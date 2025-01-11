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

  const handleAnalyzeComplete = (stats?: RepoStats, repoUrl?: string, directoryPath?: string, selectedFiles?: FileList) => {
    setAnalyzing(false);
    if (stats) {
      setAnalysisData({
        stats,
        repoUrl,
        directoryPath,
        selectedFiles
      });
    } else {
      setAnalysisData(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 bg-muted/80 text-foreground px-8 py-4 rounded-xl text-3xl font-bold w-full">
            <Github className="w-8 h-8" />
            <span>Repository Analysis Tool</span>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Repository Details</CardTitle>
            <CardDescription>
              First, analyze your repository to see its contents and prepare it for text conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <p>The analysis will:</p>
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

              {analysisData.stats.fileTypes && analysisData.stats.fileTypes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">File Types</h3>
                  <div className="grid gap-3">
                    {analysisData.stats.fileTypes.map((type) => (
                      <div key={type.extension} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                        <span className="font-medium">{type.extension || 'No extension'}</span>
                        <div className="flex gap-4">
                          <span className="text-sm text-muted-foreground">{type.count} files</span>
                          <span className="text-sm text-muted-foreground">{formatBytes(type.totalBytes)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <PatternManager 
          disabled={analyzing} 
          fileTypes={analysisData?.stats.fileTypes}
          repoUrl={analysisData?.repoUrl}
          directoryPath={analysisData?.directoryPath}
          selectedFiles={analysisData?.selectedFiles}
        />
      </div>
    </div>
  );
}