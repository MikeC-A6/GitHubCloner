import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
}

export default function PatternManager({ disabled = false }: PatternManagerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [customPatterns, setCustomPatterns] = useState("");
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
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Add Custom Patterns</h3>
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
      </CardContent>
    </Card>
  );
}