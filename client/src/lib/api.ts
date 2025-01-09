interface AnalyzeRequest {
  githubUrl: string;
  directoryPath?: string;
}

interface FileTypeStats {
  extension: string;
  count: number;
  totalBytes: number;
}

interface AnalyzeResponse {
  files: string[];
  suggestions: string[];
  stats: {
    fileCount: number;
    totalSizeBytes: number;
    fileTypes: FileTypeStats[];
  };
}

interface PatternsResponse {
  current: string[];
}

export async function analyzeRepository(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function downloadRepository(request: AnalyzeRequest): Promise<void> {
  const response = await fetch("/api/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  // Create a blob from the response and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'repository-content.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function updatePatterns(patterns: string): Promise<PatternsResponse> {
  const response = await fetch("/api/patterns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patterns }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function resetPatterns(): Promise<PatternsResponse> {
  const response = await fetch("/api/patterns/reset", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getPatterns(): Promise<PatternsResponse> {
  const response = await fetch("/api/patterns");
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}