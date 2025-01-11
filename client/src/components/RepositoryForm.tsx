import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { analyzeRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FolderIcon, Github, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface RepositoryFormProps {
  onAnalyzeStart: () => void;
  onAnalyzeComplete: (stats?: { fileCount: number; totalSizeBytes: number; fileTypes: any[] }, repoUrl?: string, directoryPath?: string) => void;
}

interface FormValues {
  githubUrl: string;
  directoryPath: string;
}

export default function RepositoryForm({ onAnalyzeStart, onAnalyzeComplete }: RepositoryFormProps) {
  const { toast } = useToast();
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState<string>("");

  const form = useForm<FormValues>({
    defaultValues: {
      githubUrl: "",
      directoryPath: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: analyzeRepository,
    onMutate: () => {
      setAnalyzeProgress(10);
      setAnalyzeStage("Initializing repository analysis...");
      
      // For very small repos, we'll use shorter intervals
      const baseDelay = 200;
      
      setTimeout(() => {
        setAnalyzeProgress(30);
        setAnalyzeStage("Cloning repository...");
      }, baseDelay);
      
      setTimeout(() => {
        setAnalyzeProgress(60);
        setAnalyzeStage("Analyzing files...");
      }, baseDelay * 2);
      
      setTimeout(() => {
        setAnalyzeProgress(90);
        setAnalyzeStage("Calculating statistics...");
      }, baseDelay * 3);
    },
    onSuccess: (data) => {
      // Immediately set to 100% when we get the response
      setAnalyzeProgress(100);
      setAnalyzeStage("Analysis complete!");
      toast({
        title: "Repository analyzed successfully",
        description: "You can now customize and download the repository content",
      });
      const values = form.getValues();
      onAnalyzeComplete(data.stats, values.githubUrl, values.directoryPath);
      
      // Clear the progress bar more quickly for small repos
      setTimeout(() => {
        setAnalyzeProgress(0);
        setAnalyzeStage("");
      }, 500);
    },
    onError: (error) => {
      setAnalyzeProgress(0);
      setAnalyzeStage("");
      toast({
        title: "Failed to analyze repository",
        description: error.message,
        variant: "destructive",
      });
      onAnalyzeComplete();
    },
  });

  const onSubmit = (values: FormValues) => {
    onAnalyzeStart();
    analyzeMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="githubUrl"
          rules={{ required: "GitHub URL is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository URL</FormLabel>
              <FormDescription>
                Enter the full URL of the GitHub repository you want to analyze
              </FormDescription>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Github className="w-5 h-5 text-muted-foreground/70" />
                  </div>
                  <Input 
                    placeholder="https://github.com/username/repository"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="directoryPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Directory Path</FormLabel>
              <FormDescription>
                Optionally specify a subdirectory to analyze. Leave empty to process the entire repository
              </FormDescription>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FolderIcon className="w-5 h-5 text-muted-foreground/70" />
                  </div>
                  <Input 
                    placeholder="e.g., src/components"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {analyzeProgress > 0 && (
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{analyzeStage}</span>
              <span className="font-medium">{analyzeProgress}%</span>
            </div>
            <Progress value={analyzeProgress} className="h-2" />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full gap-2"
          size="lg"
          disabled={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          {analyzeMutation.isPending ? "Analyzing Repository..." : "Analyze Repository"}
        </Button>
      </form>
    </Form>
  );
}