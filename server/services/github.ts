import { analyzeGitHubRepo, downloadRepository } from './github/index';
import type { FileTypeStats } from './github/interfaces';

// Re-export the main functions to maintain backward compatibility
export { analyzeGitHubRepo, downloadRepository };
// Re-export the interface
export type { FileTypeStats };