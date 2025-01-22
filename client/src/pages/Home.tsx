import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  repoUrl?: string;
  directoryPath?: string;
  selectedFiles?: FileList;
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

  const handleAnalyzeComplete = (
    stats: RepoStats | undefined, 
    repoUrl?: string, 
    directoryPath?: string, 
    selectedFiles?: FileList | null
  ) => {
    setAnalyzing(false);

    if (!stats) {
      console.log('No stats provided to handleAnalyzeComplete');
      setAnalysisData(null);
      return;
    }

    const newData: AnalysisData = {
      stats: {
        fileCount: stats.fileCount,
        totalSizeBytes: stats.totalSizeBytes,
        fileTypes: stats.fileTypes || []
      },
      repoUrl,
      directoryPath,
      selectedFiles: selectedFiles || undefined
    };

    console.log('Setting new analysis data:', newData);
    setAnalysisData(newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Repository Analysis Tool</CardTitle>
            <CardDescription>
              Analyze and prepare your repository for text conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RepositoryForm 
              onAnalyzeStart={() => {
                setAnalyzing(true);
                setAnalysisData(null);
              }}
              onAnalyzeComplete={handleAnalyzeComplete}
            />
          </CardContent>
        </Card>

        {analysisData && analysisData.stats && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl">Analysis Results</CardTitle>
              <CardDescription>
                Overview of repository contents and file statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-muted p-6 rounded-lg">
                  <div className="text-3xl font-bold">
                    {analysisData.stats.fileCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total Files</div>
                </div>
                <div className="bg-muted p-6 rounded-lg">
                  <div className="text-3xl font-bold">
                    {formatBytes(analysisData.stats.totalSizeBytes)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <PatternManager 
            disabled={analyzing} 
            fileTypes={analysisData?.stats?.fileTypes}
            repoUrl={analysisData?.repoUrl}
            directoryPath={analysisData?.directoryPath}
            selectedFiles={analysisData?.selectedFiles}
          />
        </div>
      </div>
    </div>
  );
}