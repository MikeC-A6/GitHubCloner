interface AnalyzeRequest {
  githubUrl: string;
  directoryPath?: string;
}

interface AnalyzeResponse {
  files: string[];
  suggestions: string[];
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