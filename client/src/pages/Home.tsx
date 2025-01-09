import { Card, CardContent } from "@/components/ui/card";
import RepositoryForm from "@/components/RepositoryForm";
import PatternManager from "@/components/PatternManager";
import { useState } from "react";

interface FileTypeStats {
  extension: string;
  count: number;
  totalBytes: number;
}

interface RepoStats {
  fileCount: number;
  totalSizeBytes: number;
  fileTypes: FileTypeStats[];
}

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);

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
          GitHub Repository to Text
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
                  setRepoStats(stats as RepoStats);
                }
              }}
            />
          </CardContent>
        </Card>

        <PatternManager 
          disabled={analyzing} 
          fileTypes={repoStats?.fileTypes}
        />

        {repoStats && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-2">Analysis Results</h2>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Repository contains {repoStats.fileCount} files
                    {" "}({formatBytes(repoStats.totalSizeBytes)} total)
                  </p>
                </div>

                {repoStats.fileTypes.length > 0 && (
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Top 5 File Types by Size</h3>
                    <ul className="space-y-2">
                      {repoStats.fileTypes.map((type) => (
                        <li key={type.extension} className="text-sm text-muted-foreground">
                          {type.extension}: {type.count} files ({formatBytes(type.totalBytes)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}