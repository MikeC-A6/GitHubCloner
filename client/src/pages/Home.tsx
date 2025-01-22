import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RepositoryForm from "@/components/RepositoryForm";
import PatternManager from "@/components/PatternManager";
import { useState, useEffect } from "react";

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

  const validateStats = (stats?: RepoStats): boolean => {
    return !!(
      stats &&
      typeof stats.fileCount === 'number' &&
      typeof stats.totalSizeBytes === 'number' &&
      Array.isArray(stats.fileTypes)
    );
  };

  const handleAnalyzeComplete = (
    stats?: RepoStats, 
    repoUrl?: string, 
    directoryPath?: string, 
    selectedFiles?: FileList | null
  ) => {
    setAnalyzing(false);

    if (!stats || !validateStats(stats)) {
      setAnalysisData(null);
      return;
    }

    const newAnalysisData: AnalysisData = {
      stats: {
        fileCount: stats.fileCount,
        totalSizeBytes: stats.totalSizeBytes,
        fileTypes: Array.isArray(stats.fileTypes) ? stats.fileTypes : []
      },
      repoUrl,
      directoryPath,
      selectedFiles: selectedFiles || undefined
    };

    console.log('Setting analysis data:', JSON.stringify(newAnalysisData, null, 2));
    setAnalysisData(newAnalysisData);
  };

  useEffect(() => {
    console.log('Analysis data changed:', JSON.stringify(analysisData, null, 2));
  }, [analysisData]);

  return (
    <div className="bg-white">
      <div className="page-header bg-agilesix-blue text-white">
        <div className="container">
          <h1 className="text-4xl font-bold tracking-tight">Repository Analysis Tool</h1>
          <p className="mt-2 text-agilesix-cyan">Analyze and prepare your repository for text conversion</p>
        </div>
      </div>

      <div className="section">
        <div className="container max-w-4xl">
          <Card className="border-agilesix-light-grey shadow-sm">
            <CardHeader>
              <CardTitle className="text-agilesix-blue text-2xl">Repository Details</CardTitle>
              <CardDescription className="text-agilesix-dark-grey">
                First, analyze your repository to see its contents and prepare it for text conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg bg-agilesix-light-blue/20 px-4 py-3 text-sm text-agilesix-dark-grey">
                <p className="font-semibold">The analysis will:</p>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Calculate total repository size</li>
                  <li>Identify all file types and their sizes</li>
                  <li>Help you decide what to exclude before converting</li>
                </ul>
              </div>
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
            <Card className="mt-8 border-agilesix-light-grey shadow-sm" data-testid="analysis-results">
              <CardHeader>
                <CardTitle className="text-agilesix-blue text-2xl">Analysis Results</CardTitle>
                <CardDescription className="text-agilesix-dark-grey">
                  Overview of repository contents and file statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-agilesix-light-blue/20 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-agilesix-blue">
                      {analysisData.stats.fileCount}
                    </div>
                    <div className="text-sm text-agilesix-dark-grey mt-1">Total Files</div>
                  </div>
                  <div className="bg-agilesix-light-blue/20 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-agilesix-blue">
                      {formatBytes(analysisData.stats.totalSizeBytes)}
                    </div>
                    <div className="text-sm text-agilesix-dark-grey mt-1">Total Size</div>
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
    </div>
  );
}