import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { analyzeRepository, downloadRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FolderIcon, Github, Download, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface RepositoryFormProps {
  onAnalyzeStart: () => void;
  onAnalyzeComplete: (data?: { fileCount: number; totalSizeBytes: number }) => void;
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
      setTimeout(() => {
        setAnalyzeProgress(30);
        setAnalyzeStage("Cloning repository...");
      }, 500);
      setTimeout(() => {
        setAnalyzeProgress(60);
        setAnalyzeStage("Analyzing files...");
      }, 1500);
      setTimeout(() => {
        setAnalyzeProgress(90);
        setAnalyzeStage("Calculating statistics...");
      }, 2500);
    },
    onSuccess: (data) => {
      setAnalyzeProgress(100);
      setAnalyzeStage("Analysis complete!");
      toast({
        title: "Repository analyzed successfully",
        description: "You can now manage patterns below",
      });
      onAnalyzeComplete(data.stats);
      // Reset progress after a brief delay
      setTimeout(() => {
        setAnalyzeProgress(0);
        setAnalyzeStage("");
      }, 1000);
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

  const downloadMutation = useMutation({
    mutationFn: downloadRepository,
    onSuccess: () => {
      toast({
        title: "Repository downloaded successfully",
        description: "Check your downloads folder for the repository content",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to download repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    onAnalyzeStart();
    analyzeMutation.mutate(values);
  };

  const handleDownload = () => {
    const values = form.getValues();
    if (!values.githubUrl) {
      toast({
        title: "Repository URL required",
        description: "Please enter a GitHub repository URL first",
        variant: "destructive",
      });
      return;
    }
    downloadMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="githubUrl"
          rules={{ required: "GitHub URL is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <Github className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
              <FormLabel>Directory Path (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <FolderIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Leave empty for entire repository"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {analyzeProgress > 0 && (
          <div className="space-y-2">
            <Progress value={analyzeProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">{analyzeStage}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="flex-1 gap-2"
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {analyzeMutation.isPending ? "Analyzing Repository..." : "Clone and Analyze Repository"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={downloadMutation.isPending || analyzeMutation.isPending || !analyzeMutation.data}
          >
            {downloadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" />
            {downloadMutation.isPending ? "Downloading..." : "Download"}
          </Button>
        </div>
      </form>
    </Form>
  );
}