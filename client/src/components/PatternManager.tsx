import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatterns, updatePatterns, resetPatterns, downloadRepository } from "@/lib/api";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatternManagerProps {
  disabled?: boolean;
  fileTypes?: Array<{ extension: string; count: number; totalBytes: number }>;
  repoUrl?: string;
  directoryPath?: string;
}

export default function PatternManager({ disabled = false, fileTypes = [], repoUrl, directoryPath }: PatternManagerProps) {
  const [customPatterns, setCustomPatterns] = useState("");
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [showCurrentPatterns, setShowCurrentPatterns] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ["/api/patterns"],
    queryFn: getPatterns,
  });

  const updateMutation = useMutation({
    mutationFn: updatePatterns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      toast({
        title: "Patterns updated",
        description: "Your custom patterns have been added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update patterns",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPatterns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      setCustomPatterns("");
      setSelectedExtensions([]);
      toast({
        title: "Patterns reset",
        description: "All patterns have been reset to defaults",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset patterns",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadRepository,
    onMutate: () => {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          // More gradual progress simulation
          if (oldProgress >= 85) {
            clearInterval(timer);
            return 85;
          }
          // Slower initial progress
          const increment = oldProgress < 30 ? 5 : 2;
          return oldProgress + increment;
        });
      }, 300);
      return () => clearInterval(timer);
    },
    onSuccess: () => {
      // Quick progression to 100%
      setProgress(90);
      setTimeout(() => {
        setProgress(100);
        // Reset after showing completion
        setTimeout(() => setProgress(0), 2000);
      }, 500);
      toast({
        title: "Repository downloaded successfully",
        description: "Check your downloads folder for the repository content",
      });
    },
    onError: (error: Error) => {
      setProgress(0);
      toast({
        title: "Failed to download repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtensionToggle = (extension: string, checked: boolean) => {
    setSelectedExtensions(prev => {
      const newSelected = checked
        ? [...prev, extension]
        : prev.filter(ext => ext !== extension);

      const extensionPatterns = newSelected
        .map(ext => {
          const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext;
          return `*.${cleanExt}`;
        })
        .join('\n');

      const newPatterns = customPatterns
        ? `${customPatterns}\n${extensionPatterns}`
        : extensionPatterns;

      updateMutation.mutate(newPatterns);
      return newSelected;
    });
  };

  const handleDownload = () => {
    if (!repoUrl) return;

    const extensionPatterns = selectedExtensions
      .map(ext => {
        const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext;
        return `*.${cleanExt}`;
      })
      .join('\n');

    const allPatterns = customPatterns
      ? `${customPatterns}\n${extensionPatterns}`
      : extensionPatterns;

    downloadMutation.mutate({
      githubUrl: repoUrl,
      directoryPath,
      patterns: allPatterns
    });
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Content</CardTitle>
        <CardDescription>
          Select which files to exclude from the repository download
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {progress === 100 ? "Download complete!" : `Processing repository... ${progress}%`}
            </p>
          </div>
        )}
        <Alert className="bg-primary/5 border-primary/10">
          <AlertDescription>
            Customize which files to exclude before downloading. This helps reduce the repository size and remove unnecessary files.
          </AlertDescription>
        </Alert>

        {fileTypes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Detected File Extensions</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which file types to exclude
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {fileTypes.map((type) => (
                <div
                  key={type.extension}
                  className="flex items-center gap-3 py-1"
                >
                  <Checkbox
                    id={`ext-${type.extension}`}
                    checked={selectedExtensions.includes(type.extension)}
                    onCheckedChange={(checked) =>
                      handleExtensionToggle(type.extension, checked === true)
                    }
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`ext-${type.extension}`}
                    className="flex flex-1 items-center gap-3 text-sm"
                  >
                    <span className="font-medium min-w-[60px]">{type.extension}</span>
                    <span className="text-muted-foreground">{type.count} files</span>
                    <span className="text-muted-foreground">{formatBytes(type.totalBytes)}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Custom Patterns</h3>
            <p className="text-sm text-muted-foreground">
              Add custom patterns to exclude specific files or directories
            </p>
          </div>
          <Textarea
            placeholder="Enter patterns (one per line):&#10;*.log&#10;build/&#10;dist/"
            value={customPatterns}
            onChange={(e) => setCustomPatterns(e.target.value)}
            className="font-mono min-h-[120px]"
            disabled={disabled}
          />
          <div className="flex space-x-2">
            <Button
              onClick={() => updateMutation.mutate(customPatterns)}
              disabled={disabled || !customPatterns || updateMutation.isPending}
              variant="secondary"
            >
              {updateMutation.isPending ? "Adding..." : "Add Patterns"}
            </Button>
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate()}
              disabled={disabled || resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset to Defaults"}
            </Button>
          </div>
        </div>

        <Collapsible open={showCurrentPatterns} onOpenChange={setShowCurrentPatterns}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Current Exclusion List</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {showCurrentPatterns ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle pattern list</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ) : patterns?.current ? (
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground">
                  {patterns.current.join("\n")}
                </pre>
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-start justify-between pt-6 border-t">
          <div className="space-y-1 max-w-[60%]">
            <h3 className="font-medium">Convert and Download</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Download your repository as a single text file, with all code and contents combined
              </p>
              {(selectedExtensions.length > 0 || customPatterns) && (
                <p className="text-xs text-muted-foreground">
                  Currently excluding: {selectedExtensions.length} file types {customPatterns ? "and custom patterns" : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <Button
              onClick={handleDownload}
              disabled={disabled || !repoUrl || downloadMutation.isPending}
              size="lg"
              className="gap-2 whitespace-nowrap"
            >
              {downloadMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              <Download className="w-5 h-5" />
              <span>{downloadMutation.isPending ? "Converting..." : "Download as Text"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}