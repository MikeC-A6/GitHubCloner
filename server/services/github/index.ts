// Re-export functionality from individual service files
import { RepositoryAnalyzer } from './repository-analyzer.js';
import { RepositoryDownloader } from './repository-downloader.js';
import { FileAnalyzer } from './file-analyzer.js';
import { PatternMatcher } from './pattern-matcher.js';
import { RepositoryManager } from './repository-manager.js';
import { ContentManager } from './content-manager.js';
import { FileSystem } from '../file-system.js';
import { GitHubService } from './github-service.js';

// Create shared instances
const fileSystem = new FileSystem();
const repoManager = new RepositoryManager(fileSystem);
const fileAnalyzer = new FileAnalyzer(fileSystem);
const patternMatcher = new PatternMatcher();
const contentManager = new ContentManager();

// Create main service instance using dependency injection
const githubService = new GitHubService(
  new RepositoryAnalyzer(repoManager, fileAnalyzer, patternMatcher),
  new RepositoryDownloader(repoManager, fileAnalyzer, patternMatcher, contentManager)
);

// Export the functions with exactly the same names as expected by routes.ts
export const analyzeGitHubRepo = (url: string, directoryPath?: string) =>
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string) =>
  githubService.downloadRepository(url, directoryPath);

export const downloadRepositoryAsJsonl = async (url: string, directoryPath?: string) => {
  const { files, content } = await githubService.downloadRepository(url, directoryPath);

  // Convert content to JSONL format
  const jsonlContent = files.map((file, index) => {
    const fileContent = content.split('\n').slice(index, index + 1).join('\n');
    return JSON.stringify({
      path: file,
      content: fileContent,
      timestamp: new Date().toISOString()
    });
  }).join('\n');

  const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';
  return {
    content: jsonlContent,
    filename: `${repoName}.jsonl`
  };
};

// Re-export types and interfaces
export * from './interfaces.js';