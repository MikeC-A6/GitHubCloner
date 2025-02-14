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
  const content = await githubService.downloadRepository(url, directoryPath);
  const analysis = await githubService.analyzeRepository(url, directoryPath);

  // Convert content to JSONL format by processing each file
  const fileContents = content.content.split('\n---\n'); // Assuming files are separated by '---'
  const jsonlContent = analysis.files.map((file, index) => {
    const fileContent = fileContents[index] || '';
    return JSON.stringify({
      path: file,
      content: fileContent.trim(),
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