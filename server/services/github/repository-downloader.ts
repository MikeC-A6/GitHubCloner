import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { ContentManager } from './content-manager';
import { getPatterns } from '../patterns';
import type { IFileAnalyzer, IPatternMatcher, IRepositoryDownloader } from './interfaces';
import type { IContentManager } from './interfaces/content-manager';
import { FileSystemError } from './interfaces/file-system';

export class RepositoryDownloader implements IRepositoryDownloader {
  private readonly contentManager: IContentManager;

  constructor(
    private readonly repoManager: RepositoryManager,
    private readonly fileAnalyzer: IFileAnalyzer,
    private readonly patternMatcher: IPatternMatcher,
    contentManager?: IContentManager
  ) {
    this.contentManager = contentManager || new ContentManager();
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    let tempDir: string | undefined;
    try {
      tempDir = await this.repoManager.cloneRepository(url);
      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);

      const files = await this.fileAnalyzer.getAllFiles(targetPath);
      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(files, patterns);

      const contents = await this.contentManager.getFileContents(filteredFiles, targetPath, url);
      return this.contentManager.formatContentOutput(contents);
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to download repository: ${error.message}`);
    } finally {
      if (tempDir) {
        await this.repoManager.cleanup();
      }
    }
  }
}