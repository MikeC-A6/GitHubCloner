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
import { getPatterns, updatePatterns, resetPatterns } from "@/lib/api";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PatternManagerProps {
  disabled?: boolean;
  fileTypes?: Array<{ extension: string; count: number; totalBytes: number }>;
}

export default function PatternManager({ disabled = false, fileTypes = [] }: PatternManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPatterns, setCustomPatterns] = useState("");
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
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
        // Remove the leading dot if it exists
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Current Ignore Patterns</CardTitle>
            <CollapsibleTrigger className="hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="pt-4">
              {isLoading ? (
                <div className="animate-pulse bg-muted h-24 rounded-md" />
              ) : patterns?.current ? (
                <div className="bg-muted p-3 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">
                    {patterns.current.join("\n")}
                  </pre>
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>

      <CardContent className="space-y-4">
        {fileTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Common File Types Found</h3>
            <p className="text-sm text-muted-foreground">
              Select file types to add to ignore patterns
            </p>
            <div className="space-y-2">
              {fileTypes.slice(0, 5).map((type) => ( // Show only top 5
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
            One pattern per line
          </p>
          <Textarea
            placeholder="*.custom&#10;custom_dir/"
            value={customPatterns}
            onChange={(e) => setCustomPatterns(e.target.value)}
            className="min-h-[100px]"
            disabled={disabled}
          />
        </div>

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