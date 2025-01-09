import { Card, CardContent } from "@/components/ui/card";
import RepositoryForm from "@/components/RepositoryForm";
import PatternManager from "@/components/PatternManager";
import { useState } from "react";

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [repoStats, setRepoStats] = useState<{ fileCount: number; totalSizeBytes: number } | null>(null);

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen w-full p-6 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          GitHub Repository Analyzer
        </h1>

        <Card>
          <CardContent className="pt-6">
            <RepositoryForm 
              onAnalyzeStart={() => {
                setAnalyzing(true);
                setRepoStats(null);
              }}
              onAnalyzeComplete={(stats) => {
                setAnalyzing(false);
                if (stats) {
                  setRepoStats(stats);
                }
              }}
            />
            {repoStats && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Repository contains {repoStats.fileCount} files
                  {" "}({formatBytes(repoStats.totalSizeBytes)} total)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <PatternManager disabled={analyzing} />
      </div>
    </div>
  );
}