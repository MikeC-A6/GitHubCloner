import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function analyzeGitHubRepo(url: string, directoryPath?: string) {
  // Validate GitHub URL
  if (!url.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/)) {
    throw new Error("Invalid GitHub repository URL");
  }

  // Create temp directory for cloning
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
  const git: SimpleGit = simpleGit();

  try {
    // Clone repository
    await git.clone(url, tempDir, ['--depth', '1']);

    // Get repository contents
    const targetPath = directoryPath ? path.join(tempDir, directoryPath) : tempDir;

    // Verify directory exists
    try {
      await fs.access(targetPath);
    } catch {
      throw new Error("Specified directory path does not exist in the repository");
    }

    const files = await getAllFiles(targetPath);

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return {
      files,
      suggestions: generateIgnoreSuggestions(files),
    };
  } catch (error: any) {
    // Ensure cleanup even if error occurs
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Failed to analyze repository: ${error.message}`);
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(path.relative(dir, fullPath));
      }
    }
  }

  await scan(dir);
  return files;
}

function generateIgnoreSuggestions(files: string[]): string[] {
  const suggestions = new Set<string>();

  // Common patterns to suggest
  const patterns = {
    nodeModules: /^node_modules\//,
    buildDirs: /^(dist|build|out)\//,
    logs: /\.(log|txt)$/,
    coverage: /^coverage\//,
    envFiles: /\.env/,
    ideaFiles: /^\.idea\//,
    vscodeFiles: /^\.vscode\//,
    cacheFiles: /^\.cache\//,
    testFiles: /\.(test|spec)\.(js|ts|jsx|tsx)$/,
  };

  for (const file of files) {
    for (const [, pattern] of Object.entries(patterns)) {
      if (pattern.test(file)) {
        suggestions.add(pattern.source.replace(/\\/g, ''));
      }
    }
  }

  return Array.from(suggestions);
}