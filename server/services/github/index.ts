import { getPatterns } from '../patterns';
import { FileSystem } from '../file-system';
import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { ContentManager } from './content-manager';
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';
import type { AnalysisResult, FileContent, FileTypeStats } from './interfaces';

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

// Export the main functions with the correct names that match what github.ts expects
export const analyzeGitHubRepo = (url: string, directoryPath?: string): Promise<AnalysisResult> =>
  repositoryAnalyzer.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string): Promise<string> =>
  repositoryDownloader.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent, FileTypeStats };