import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    onSuccess: () => {
      toast({
        title: "Repository downloaded successfully",
        description: "Check your downloads folder for the repository content",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to download repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtensionToggle = (extension: string, checked: boolean) => {
    setSelectedExtensions(prev => {
      if (checked) {
        return [...prev, extension];
      }
      return prev.filter(ext => ext !== extension);
    });
  };

  const handleAddExtensions = () => {
    const extensionPatterns = selectedExtensions
      .map(ext => {
        const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext;
        return `*.${cleanExt}`;
      })
      .join('\n');
    const newPatterns = customPatterns
      ? `${customPatterns}\n${extensionPatterns}`
      : extensionPatterns;
    updateMutation.mutate(newPatterns);
    setSelectedExtensions([]);
  };

  const handleDownload = () => {
    if (!repoUrl) return;
    downloadMutation.mutate({
      githubUrl: repoUrl,
      directoryPath,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Repository Content</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Customize which files to exclude before downloading. This helps reduce the repository size and remove unnecessary files.
          </AlertDescription>
        </Alert>

        {fileTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Common File Types Found</h3>
            <p className="text-sm text-muted-foreground">
              Select file types to exclude from download
            </p>
            <div className="space-y-2">
              {fileTypes.slice(0, 5).map((type) => (
                <div key={type.extension} className="flex items-center space-x-2">
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type.extension} ({type.count} files, {formatBytes(type.totalBytes)})
                  </label>
                </div>
              ))}
            </div>
            {selectedExtensions.length > 0 && (
              <Button
                onClick={handleAddExtensions}
                disabled={disabled || updateMutation.isPending}
                className="mt-2"
              >
                Add Selected Types to Ignore Patterns
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Custom Patterns</h3>
          <p className="text-sm text-muted-foreground">
            One pattern per line (e.g., *.log, build/)
          </p>
          <Textarea
            placeholder="*.custom&#10;custom_dir/"
            value={customPatterns}
            onChange={(e) => setCustomPatterns(e.target.value)}
            className="min-h-[100px]"
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-4 pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              onClick={() => updateMutation.mutate(customPatterns)}
              disabled={disabled || !customPatterns || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Adding..." : "Add Custom Patterns"}
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
            <h3 className="text-sm font-medium">Current Exclusion List</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {showCurrentPatterns ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-2">
            {isLoading ? (
              <div className="animate-pulse bg-muted h-24 rounded-md" />
            ) : patterns?.current ? (
              <div className="bg-muted p-3 rounded-md">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {patterns.current.join("\n")}
                </pre>
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Ready to download with current ignore patterns?
          </p>
          <Button
            onClick={handleDownload}
            disabled={disabled || !repoUrl || downloadMutation.isPending}
            className="gap-2"
            size="lg"
          >
            {downloadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" />
            {downloadMutation.isPending ? "Downloading..." : "Download Repository"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}