import { analyzeGitHubRepo as analyzeGitHubRepoImpl, downloadRepository as downloadRepositoryImpl } from './github/index';
import type { AnalysisResult, FileContent } from './github/interfaces';

// Export clean, strongly-typed functions that delegate to the implementation
export const analyzeGitHubRepo = (url: string, directoryPath?: string): Promise<AnalysisResult> => 
  analyzeGitHubRepoImpl(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string): Promise<string> => 
  downloadRepositoryImpl(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent };