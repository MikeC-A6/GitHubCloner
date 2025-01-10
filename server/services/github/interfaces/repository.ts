import type { FileTypeStats, FileContent, AnalysisResult } from '../interfaces';

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

export interface IGitHubService {
  analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult>;
  downloadRepository(url: string, directoryPath?: string): Promise<string>;
}
