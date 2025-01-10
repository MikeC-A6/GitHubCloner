import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { ContentProcessor } from './content-processor';
import { getPatterns } from '../patterns';
import type { FileContent } from './interfaces';
import type { IRepositoryDownloader } from './interfaces/repository';

export class RepositoryDownloader implements IRepositoryDownloader {
  private readonly contentProcessor: ContentProcessor;

  constructor(
    private readonly repoManager: RepositoryManager,
    private readonly fileAnalyzer: FileAnalyzer,
    private readonly patternMatcher: PatternMatcher
  ) {
    this.contentProcessor = new ContentProcessor();
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    try {
      const tempDir = await this.repoManager.cloneRepository(url);
      const targetPath = await this.repoManager.getTargetPath(tempDir, directoryPath);

      const files = await this.fileAnalyzer.getAllFiles(targetPath);
      const patterns = getPatterns();
      const filteredFiles = this.patternMatcher.filterFiles(files, patterns);

      const contents: FileContent[] = await Promise.all(
        filteredFiles.map(async file => 
          this.contentProcessor.processFile(file, targetPath, url)
            .catch(error => ({
              path: file,
              content: `Error processing file: ${error.message}`,
              githubUrl: '',
              metadata: { size: '0 KB', created: '', modified: '', permissions: '' },
              language: 'unknown',
              role: 'unknown',
              directoryContext: '',
              dependencies: [],
              contentType: 'error'
            }))
        )
      );

      return contents.map(content => `File: ${content.path}
GitHub URL: ${content.githubUrl}
Language: ${content.language}
Role: ${content.role}
Directory Context: ${content.directoryContext}
Dependencies: ${content.dependencies.join(', ')}
Metadata: ${JSON.stringify(content.metadata, null, 2)}
Content Type: ${content.contentType}
${'='.repeat(content.path.length + 6)}
${content.content}\n\n`).join('\n');

    } catch (error: any) {
      throw new Error(`Failed to download repository: ${error.message}`);
    } finally {
      await this.repoManager.cleanup();
    }
  }
}