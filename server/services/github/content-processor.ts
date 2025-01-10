import { FileContent } from './interfaces';
import { IContentProcessor, IContentTypeDetector, IMetadataExtractor } from './interfaces/content-processor';
import { IFileSystem, IPathOperations } from './interfaces/file-system';
import { FileSystem } from '../file-system';

export class ContentProcessor implements IContentProcessor, IContentTypeDetector, IMetadataExtractor {
  private readonly fileSystem: IFileSystem & IPathOperations;

  constructor(fileSystem?: IFileSystem & IPathOperations) {
    this.fileSystem = fileSystem || new FileSystem();
  }

  async processFile(file: string, basePath: string, repoUrl: string): Promise<FileContent> {
    const filePath = this.fileSystem.join(basePath, file);
    const content = await this.fileSystem.readFile(filePath, 'utf-8');
    const stats = await this.fileSystem.stat(filePath);
    const repoUrlParts = repoUrl.split('github.com/');
    const fullGithubUrl = `https://github.com/${repoUrlParts[1]}/blob/main/${file}`;

    const metadata = this.extractMetadata(stats);

    const fileExt = this.fileSystem.extname(file);
    const imports = fileExt === '.ts' || fileExt === '.js' ? 
      content.match(/^import.*from.*$/gm) || [] : [];

    return {
      path: file,
      content,
      githubUrl: fullGithubUrl,
      metadata,
      language: fileExt.slice(1) || 'unknown',
      role: file.includes('test') || file.includes('spec') ? 'test' : 'source',
      directoryContext: this.fileSystem.dirname(file),
      dependencies: imports,
      contentType: this.determineContentType(file)
    };
  }

  extractMetadata(stats: { size: number; birthtime: Date; mtime: Date; mode: number }): {
    size: string;
    created: string;
    modified: string;
    permissions: string;
  } {
    return {
      size: `${(stats.size / 1024).toFixed(2)} KB`,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      permissions: stats.mode.toString(8)
    };
  }

  determineContentType(file: string): string {
    if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
      return 'test';
    }
    if (file.includes('/components/')) {
      return 'component';
    }
    if (file.includes('/services/')) {
      return 'service';
    }
    if (file.includes('/utils/')) {
      return 'utility';
    }
    return 'source';
  }
}