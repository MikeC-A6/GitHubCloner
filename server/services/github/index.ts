// Re-export functionality from individual service files
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { RepositoryManager } from './repository-manager';
import { ContentManager } from './content-manager';
import { FileSystem } from '../file-system';

// Create shared instances
const fileSystem = new FileSystem();
const repoManager = new RepositoryManager(fileSystem);
const fileAnalyzer = new FileAnalyzer(fileSystem);
const patternMatcher = new PatternMatcher();
const contentManager = new ContentManager();

// Create main service instances
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

// Export the public API
export const analyzeGitHubRepo = async (url: string, directoryPath?: string) =>
  repositoryAnalyzer.analyzeRepository(url, directoryPath);

export const downloadRepository = async (url: string, directoryPath?: string) =>
  repositoryDownloader.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent } from './interfaces';