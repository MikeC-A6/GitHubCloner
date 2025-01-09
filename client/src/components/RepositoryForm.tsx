import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { analyzeRepository, downloadRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FolderIcon, Github, Download } from "lucide-react";

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
  const form = useForm<FormValues>({
    defaultValues: {
      githubUrl: "",
      directoryPath: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: analyzeRepository,
    onSuccess: (data) => {
      toast({
        title: "Repository analyzed successfully",
        description: "You can now manage patterns below",
      });
      onAnalyzeComplete(data.stats);
    },
    onError: (error) => {
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

        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? "Analyzing..." : "Clone and Analyze Repository"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={downloadMutation.isPending || analyzeMutation.isPending || !analyzeMutation.data}
          >
            <Download className="h-4 w-4" />
            {downloadMutation.isPending ? "Downloading..." : "Download"}
          </Button>
        </div>
      </form>
    </Form>
  );
}