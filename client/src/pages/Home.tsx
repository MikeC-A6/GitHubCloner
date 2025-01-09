import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RepositoryForm from "@/components/RepositoryForm";
import PatternManager from "@/components/PatternManager";
import { useState } from "react";
import { Github } from "lucide-react";

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
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 bg-muted/80 text-foreground px-8 py-4 rounded-xl text-3xl font-bold w-full">
            <Github className="w-8 h-8" />
            <span>Convert GitHub Code to Text</span>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Repository Details</CardTitle>
            <CardDescription>Enter the GitHub repository URL and optional directory path to analyze</CardDescription>
          </CardHeader>
          <CardContent>
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
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Overview of repository contents and file statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisData.stats.fileCount}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{formatBytes(analysisData.stats.totalSizeBytes)}</div>
                  <div className="text-sm text-muted-foreground">Total Size</div>
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