import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { downloadRepository } from "@/lib/api";
import { Download } from "lucide-react";

interface PatternManagerProps {
  disabled?: boolean;
  repoUrl?: string;
  directoryPath?: string;
}

export default function PatternManager({ 
  disabled = false, 
  repoUrl, 
  directoryPath 
}: PatternManagerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadMutation = useMutation({
    mutationFn: downloadRepository,
    onMutate: () => {
      setIsDownloading(true);
    },
    onSuccess: () => {
      setIsDownloading(false);
      toast({
        title: "Repository downloaded successfully",
        description: "Check your downloads folder for the repository content",
      });
    },
    onError: (error: Error) => {
      setIsDownloading(false);
      toast({
        title: "Failed to download repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = () => {
    if (!repoUrl) return;
    downloadMutation.mutate({
      githubUrl: repoUrl,
      directoryPath,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {isDownloading && (
          <div className="space-y-2 mb-6">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Processing repository...
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleDownload}
            disabled={disabled || !repoUrl || isDownloading}
            size="lg"
            className="gap-2"
          >
            <Download className="w-5 h-5" />
            <span>{isDownloading ? "Converting..." : "Download as Text"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}