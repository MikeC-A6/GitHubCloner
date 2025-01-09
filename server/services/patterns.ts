const DEFAULT_PATTERNS = [
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  ".env",
  ".env.*",
  ".DS_Store",
  "*.log",
  ".idea/",
  ".vscode/",
];

let currentPatterns = [...DEFAULT_PATTERNS];

export function getPatterns(): string[] {
  return currentPatterns;
}

export function updatePatterns(newPatterns: string): string[] {
  if (!newPatterns.trim()) {
    return currentPatterns;
  }

  const patterns = newPatterns
    .split("\n")
    .map(p => p.trim())
    .filter(p => p && !p.startsWith("#"));

  currentPatterns = Array.from(new Set([...currentPatterns, ...patterns]));
  return currentPatterns;
}

export function resetToDefaultPatterns(): string[] {
  currentPatterns = [...DEFAULT_PATTERNS];
  return currentPatterns;
}