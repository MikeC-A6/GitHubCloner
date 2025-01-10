import type { FileTypeStats, FileContent } from './common';

export interface AnalysisResult {
  files: string[];
  suggestions: string[];
  stats: {
    fileCount: number;
    totalSizeBytes: number;
    fileTypes: FileTypeStats[];
  };
}

export interface IRepositoryManager {
  initializeTempDir(): Promise<string>;
  validateGitHubUrl(url: string): boolean;
  cloneRepository(url: string): Promise<string>;
  getTargetPath(baseDir: string, directoryPath?: string): Promise<string>;
  cleanup(): Promise<void>;
}

export interface IRepositoryAnalyzer {
  analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult>;
}

export interface IRepositoryDownloader {
  downloadRepository(url: string, directoryPath?: string): Promise<string>;
}

export interface IGitHubService extends IRepositoryAnalyzer, IRepositoryDownloader {}