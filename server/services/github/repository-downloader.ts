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
      // Step 1: Clone the repository and get the target path
      tempDir = await this.repoManager.cloneRepository(url);
      if (!tempDir) {
        throw new Error('Failed to clone repository: temporary directory not created');
      }

      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);
      if (!targetPath) {
        throw new Error('Failed to resolve target path in repository');
      }

      // Step 2: Get and filter files
      const allFiles = await this.fileAnalyzer.getAllFiles(targetPath);
      if (!allFiles || allFiles.length === 0) {
        throw new Error('No files found in repository');
      }

      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(allFiles, patterns);
      if (!filteredFiles || filteredFiles.length === 0) {
        throw new Error('No files match the current patterns');
      }

      // Step 3: Process file contents
      const contents = await this.contentManager.getFileContents(filteredFiles, targetPath, url);
      if (!contents || contents.length === 0) {
        throw new Error('Failed to read file contents');
      }

      const formattedContent = this.contentManager.formatContentOutput(contents);
      if (!formattedContent) {
        throw new Error('Failed to format repository content');
      }

      // Generate a standardized filename
      const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${repoName}_${timestamp}.txt`;

      return {
        content: formattedContent,
        filename
      };
    } catch (error: any) {
      console.error('Repository download failed:', error);

      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to download repository: ${error.message}`);
    } finally {
      // Ensure cleanup happens even if an error occurs
      if (tempDir) {
        try {
          await this.repoManager.cleanup();
        } catch (cleanupError) {
          console.error('Failed to cleanup temporary directory:', cleanupError);
        }
      }
    }
  }
}