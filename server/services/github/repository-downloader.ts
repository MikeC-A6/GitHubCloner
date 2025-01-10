import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { ContentManager } from './content-manager';
import { getPatterns } from '../patterns';
import type { IFileAnalyzer, IPatternMatcher, IRepositoryDownloader } from './interfaces';
import type { IContentManager } from './interfaces/content-manager';
import { FileSystemError } from './interfaces/file-system';
import type { FileContent } from './interfaces';

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

  async downloadRepository(url: string, directoryPath?: string): Promise<{ content: string, filename: string }> {
    let tempDir: string | undefined;
    try {
      tempDir = await this.repoManager.cloneRepository(url);
      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);

      const allFiles = await this.fileAnalyzer.getAllFiles(targetPath);
      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(allFiles, patterns);

      const contents = await this.contentManager.getFileContents(filteredFiles, targetPath, url);
      const formattedContent = this.contentManager.formatContentOutput(contents);

      // Get the first file's standardized name as the download filename
      // If no files or no standardized name, use a default
      const filename = contents[0]?.standardizedName || `repository_${new Date().toISOString().split('T')[0]}.txt`;

      return {
        content: formattedContent,
        filename
      };
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