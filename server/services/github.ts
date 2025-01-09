import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getPatterns } from './patterns.js';
import { minimatch } from 'minimatch';

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

    // Calculate total size and get file stats
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(path.join(targetPath, file));
      totalSize += stats.size;
    }

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return {
      files,
      suggestions: generateIgnoreSuggestions(files),
      stats: {
        fileCount: files.length,
        totalSizeBytes: totalSize,
      }
    };
  } catch (error: any) {
    // Ensure cleanup even if error occurs
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Failed to analyze repository: ${error.message}`);
  }
}

export async function downloadRepository(url: string, directoryPath?: string) {
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
    const patterns = getPatterns();

    // Enhanced file filtering with proper pattern matching
    const filteredFiles = files.filter(file => {
      const normalizedFile = file.replace(/\\/g, '/'); // Normalize path separators
      return !patterns.some(pattern => {
        // Handle directory patterns with proper matching options
        const matchOptions = {
          dot: true, // Match dotfiles
          matchBase: !pattern.includes('/'), // Match basename only for patterns without paths
          nocase: true, // Case insensitive matching
        };

        // Add /** to directory patterns that don't have it
        const processedPattern = pattern.endsWith('/') ? pattern + '**' : pattern;

        return minimatch(normalizedFile, processedPattern, matchOptions);
      });
    });

    // Read content of each file
    const contents = await Promise.all(
      filteredFiles.map(async (file) => {
        const filePath = path.join(targetPath, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          return `File: ${file}\n${'='.repeat(file.length + 6)}\n${content}\n\n`;
        } catch (error) {
          return `File: ${file}\nError reading file: ${error}\n\n`;
        }
      })
    );

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return contents.join('\n');
  } catch (error: any) {
    // Ensure cleanup even if error occurs
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Failed to download repository: ${error.message}`);
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