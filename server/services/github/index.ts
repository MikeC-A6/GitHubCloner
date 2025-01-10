import { getPatterns } from '../patterns';
import { GitHubService } from './github-service';
import type { AnalysisResult, FileContent, FileTypeStats } from './interfaces';

// Create and export a singleton instance
const githubService = new GitHubService();

// Re-export the main functions for backward compatibility
export const analyzeGitHubRepo = (url: string, directoryPath?: string): Promise<AnalysisResult> =>
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string): Promise<string> =>
  githubService.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent, FileTypeStats };