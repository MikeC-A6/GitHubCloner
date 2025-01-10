// Re-export functionality from individual service files
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { RepositoryManager } from './repository-manager';
import { ContentManager } from './content-manager';
import { FileSystem } from '../file-system';
import { GitHubService } from './github-service';

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

// Export with names matching the original github.ts functionality
export const analyzeGitHubRepo = (url: string, directoryPath?: string) =>
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string) =>
  githubService.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent } from './interfaces';