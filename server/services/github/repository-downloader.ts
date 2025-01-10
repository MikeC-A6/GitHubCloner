import { RepositoryManager } from './repository-manager.js';
import { FileAnalyzer } from './file-analyzer.js';
import { PatternMatcher } from './pattern-matcher.js';
import { ContentManager } from './content-manager.js';
import { getPatterns } from '../patterns.js';
import type { IFileAnalyzer, IPatternMatcher, IRepositoryDownloader } from './interfaces.js';
import type { IContentManager } from './interfaces/content-manager.js';

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
    try {
      const tempDir = await this.repoManager.cloneRepository(url);
      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);

      const files = await this.fileAnalyzer.getAllFiles(targetPath);
      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(files, patterns);

      const contents = await this.contentManager.getFileContents(filteredFiles, targetPath, url);
      return this.contentManager.formatContentOutput(contents);

    } catch (error: any) {
      throw new Error(`Failed to download repository: ${error.message}`);
    } finally {
      await this.repoManager.cleanup();
    }
  }
}