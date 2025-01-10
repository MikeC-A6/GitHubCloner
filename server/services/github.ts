import { GitHubService } from './github/github-service';
import type { AnalysisResult, FileContent } from './github/interfaces';
import { FileSystem } from './github/services/file-system';
import { RepositoryManager } from './github/repository-manager';
import { FileAnalyzer } from './github/file-analyzer';
import { PatternMatcher } from './github/pattern-matcher';
import { ContentManager } from './github/content-manager';
import { RepositoryAnalyzer } from './github/repository-analyzer';
import { RepositoryDownloader } from './github/repository-downloader';

// Create dependencies with proper initialization
const fileSystem = new FileSystem();
const repoManager = new RepositoryManager(fileSystem);
const fileAnalyzer = new FileAnalyzer(fileSystem);
const patternMatcher = new PatternMatcher();
const contentManager = new ContentManager();

// Create analyzers with proper dependencies
const repositoryAnalyzer = new RepositoryAnalyzer(
  repoManager,
  fileAnalyzer,
  patternMatcher
);

const repositoryDownloader = new RepositoryDownloader(
  repoManager,
  fileAnalyzer,
  patternMatcher,
  contentManager
);

// Create a singleton instance for the GitHubService with all dependencies
const githubService = new GitHubService(
  repositoryAnalyzer,
  repositoryDownloader
);

// Export clean, strongly-typed functions that delegate to the service
export const analyzeGitHubRepo = (url: string, directoryPath?: string): Promise<AnalysisResult> => 
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string): Promise<string> => 
  githubService.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent };