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

interface AnalysisData {
  stats: RepoStats;
  repoUrl: string;
  directoryPath?: string;
}

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

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
                setAnalysisData(null);
              }}
              onAnalyzeComplete={(stats, repoUrl, directoryPath) => {
                setAnalyzing(false);
                if (stats && repoUrl) {
                  setAnalysisData({ stats, repoUrl, directoryPath });
                }
              }}
            />
          </CardContent>
        </Card>

        {analysisData && (
          <Card>
            <CardContent className="pt-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Analysis Results</h2>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Repository contains {analysisData.stats.fileCount} files
                    {" "}({formatBytes(analysisData.stats.totalSizeBytes)} total)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <PatternManager 
          disabled={analyzing} 
          fileTypes={analysisData?.stats.fileTypes}
          repoUrl={analysisData?.repoUrl}
          directoryPath={analysisData?.directoryPath}
        />
      </div>
    </div>
  );
}