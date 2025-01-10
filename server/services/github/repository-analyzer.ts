import { getPatterns } from '../patterns';
import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { FileSystemError } from './interfaces/file-system';
import type { AnalysisResult } from './interfaces';
import type { IRepositoryAnalyzer } from './interfaces/repository';

export class RepositoryAnalyzer implements IRepositoryAnalyzer {
  constructor(
    private readonly repoManager: RepositoryManager,
    private readonly fileAnalyzer: FileAnalyzer,
    private readonly patternMatcher: PatternMatcher
  ) {}

  async analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult> {
    let tempDir: string | undefined;
    try {
      tempDir = await this.repoManager.cloneRepository(url);
      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);

      const allFiles = await this.fileAnalyzer.getAllFiles(targetPath);
      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(allFiles, patterns);

      const { typeStats, totalSize } = await this.fileAnalyzer.analyzeFileTypes(filteredFiles, targetPath);
      const suggestions = this.patternMatcher.generateIgnoreSuggestions(filteredFiles);

      return {
        files: filteredFiles,
        suggestions,
        stats: {
          fileCount: filteredFiles.length,
          totalSizeBytes: totalSize,
          fileTypes: typeStats
        }
      };
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to analyze repository: ${error.message}`);
    } finally {
      if (tempDir) {
        await this.repoManager.cleanup();
      }
    }
  }
}