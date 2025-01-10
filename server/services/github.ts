import { GitHubService } from './github/github-service';

const githubService = new GitHubService();

// Re-export the main functions to maintain backward compatibility
export const analyzeGitHubRepo = (url: string, directoryPath?: string) => 
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string) => 
  githubService.downloadRepository(url, directoryPath);

// Re-export types
export type { FileTypeStats } from './github/interfaces';