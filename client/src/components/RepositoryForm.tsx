import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FolderIcon, Github, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { analyzeRepository } from "@/lib/api";

interface RepositoryFormProps {
  onAnalyzeStart: () => void;
  onAnalyzeComplete: (stats?: { fileCount: number; totalSizeBytes: number; fileTypes: any[] }, repoUrl?: string, directoryPath?: string, selectedFiles?: FileList | null) => void;
}

interface FormValues {
  sourceType: 'github' | 'local';
  githubUrl: string;
  directoryPath: string;
}

export default function RepositoryForm({ onAnalyzeStart, onAnalyzeComplete }: RepositoryFormProps) {
  const { toast } = useToast();
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState<string>("");
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      sourceType: 'github',
      githubUrl: "",
      directoryPath: "",
    },
  });

  const sourceType = form.watch('sourceType');

  const analyzeMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let formData = new FormData();

      if (values.sourceType === 'github') {
        const request = {
          sourceType: values.sourceType,
          githubUrl: values.githubUrl,
          directoryPath: values.directoryPath || undefined
        };
        return analyzeRepository(request);
      } else {
        // For local files, we need to handle the files differently
        if (!selectedFiles) {
          throw new Error("No files selected");
        }

        formData.append('sourceType', 'local');
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        return response.json();
      }
    },
    onMutate: () => {
      onAnalyzeStart();
      setAnalyzeProgress(10);
      setAnalyzeStage("Initializing analysis...");
    },
    onSuccess: (data) => {
      console.log('Analysis completed successfully:', data);
      setAnalyzeProgress(100);
      setAnalyzeStage("Analysis complete!");

      if (!data?.stats) {
        throw new Error('Invalid response: missing stats object');
      }

      const values = form.getValues();
      onAnalyzeComplete(
        data.stats,
        values.sourceType === 'github' ? values.githubUrl : undefined,
        values.directoryPath,
        selectedFiles
      );

      setTimeout(() => {
        setAnalyzeProgress(0);
        setAnalyzeStage("");
      }, 1000);

      toast({
        title: "Repository analyzed successfully",
        description: "You can now customize and download the repository content",
      });
    },
    onError: (error: Error) => {
      console.error('Analysis failed:', error);
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

  const handleDirectoryClick = () => {
    if (directoryInputRef.current) {
      directoryInputRef.current.click();
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (values.sourceType === 'local' && !selectedFiles) {
      toast({
        title: "No directory selected",
        description: "Please select a directory to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      await analyzeMutation.mutateAsync(values);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sourceType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Source Type</FormLabel>
              <FormControl>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="github"
                      checked={field.value === 'github'}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setSelectedFiles(null);
                      }}
                      className="form-radio"
                    />
                    <span>GitHub Repository</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="local"
                      checked={field.value === 'local'}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        form.setValue('githubUrl', '');
                      }}
                      className="form-radio"
                    />
                    <span className="flex items-center gap-2">
                      Local Files
                      <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">
                        BETA
                      </span>
                    </span>
                  </label>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {sourceType === 'github' && (
          <FormField
            control={form.control}
            name="githubUrl"
            rules={{ required: "GitHub URL is required for GitHub repositories" }}
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
                      className="pl-10 placeholder:text-muted-foreground/50"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {sourceType === 'github' && (
          <FormField
            control={form.control}
            name="directoryPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Directory Path (Optional)</FormLabel>
                <FormDescription>
                  Leave empty to analyze the entire repository, or specify a subdirectory path
                </FormDescription>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FolderIcon className="w-5 h-5 text-muted-foreground/70" />
                    </div>
                    <Input
                      placeholder="src/components"
                      className="pl-10 placeholder:text-muted-foreground/50"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {sourceType === 'local' && (
          <FormField
            control={form.control}
            name="directoryPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Directory</FormLabel>
                <FormDescription>
                  Choose a local directory to analyze its contents (max 500MB total, 50MB per file)
                </FormDescription>
                <FormControl>
                  <div className="relative">
                    <input
                      type="file"
                      ref={directoryInputRef}
                      // @ts-ignore
                      webkitdirectory=""
                      directory=""
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setSelectedFiles(files);
                          const path = files[0].webkitRelativePath.split('/')[0];
                          field.onChange(path);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={handleDirectoryClick}
                    >
                      <FolderIcon className="w-5 h-5" />
                      {field.value ? field.value : "Browse Directory"}
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {analyzeProgress > 0 && (
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{analyzeStage}</span>
              <span className="font-medium">{Math.round(analyzeProgress)}%</span>
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