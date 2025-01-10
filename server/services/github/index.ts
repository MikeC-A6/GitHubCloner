// Re-export functionality from individual service files
import { RepositoryAnalyzer } from './repository-analyzer.js';
import { RepositoryDownloader } from './repository-downloader.js';
import { FileAnalyzer } from './file-analyzer.js';
import { PatternMatcher } from './pattern-matcher.js';
import { RepositoryManager } from './repository-manager.js';
import { ContentManager } from './content-manager.js';
import { FileSystem } from '../file-system.js';

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

// Export with names matching the original github.ts functionality
export const analyzeGitHubRepo = (url: string, directoryPath?: string) =>
  repositoryAnalyzer.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string) =>
  repositoryDownloader.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent } from './interfaces.js';