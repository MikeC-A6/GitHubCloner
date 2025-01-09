interface AnalyzeRequest {
  githubUrl: string;
  directoryPath?: string;
}

export async function analyzeRepository(request: AnalyzeRequest) {
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

export async function updatePatterns(patterns: string) {
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

export async function resetPatterns() {
  const response = await fetch("/api/patterns/reset", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getPatterns() {
  const response = await fetch("/api/patterns");
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
