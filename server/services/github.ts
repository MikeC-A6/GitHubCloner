import { GitHubService } from './github/github-service';
import type { AnalysisResult, FileContent } from './github/interfaces';

// Create a singleton instance for the GitHubService
const githubService = new GitHubService();

// Export clean, strongly-typed functions that delegate to the service
export const analyzeGitHubRepo = (url: string, directoryPath?: string): Promise<AnalysisResult> => 
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string): Promise<string> => 
  githubService.downloadRepository(url, directoryPath);

// Re-export types
export type { AnalysisResult, FileContent };