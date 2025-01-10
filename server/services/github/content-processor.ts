import { FileContent } from './interfaces.js';
import { IContentProcessor, IContentTypeDetector, IMetadataExtractor } from './interfaces/content-processor.js';
import { IFileSystem, IPathOperations } from './interfaces/file-system.js';
import { FileSystem } from '../file-system.js';

export class ContentProcessor implements IContentProcessor, IContentTypeDetector, IMetadataExtractor {
  private readonly fileSystem: IFileSystem & IPathOperations;

  constructor(fileSystem?: IFileSystem & IPathOperations) {
    this.fileSystem = fileSystem || new FileSystem();
  }

  async processFile(file: string, basePath: string, repoUrl: string): Promise<FileContent> {
    try {
      const filePath = this.fileSystem.join(basePath, file);
      const content = await this.fileSystem.readFile(filePath, 'utf-8');
      const stats = await this.fileSystem.stat(filePath);

      // Safe construction of GitHub URL
      const repoUrlParts = repoUrl.split('github.com/');
      const fullGithubUrl = repoUrlParts.length > 1 ? 
        `https://github.com/${repoUrlParts[1]}/blob/main/${file}` : 
        'Invalid GitHub URL';

      const metadata = this.extractMetadata(stats);
      const fileExt = this.fileSystem.extname(file).toLowerCase();

      // Extract imports only for JavaScript/TypeScript files
      const imports = (fileExt === '.ts' || fileExt === '.js' || fileExt === '.tsx' || fileExt === '.jsx') ? 
        (content.match(/^import.*from.*$/gm) || []) : [];

      return {
        path: file,
        content: content || '',
        githubUrl: fullGithubUrl,
        metadata,
        language: fileExt.slice(1) || 'unknown',
        role: this.determineRole(file),
        directoryContext: this.fileSystem.dirname(file),
        dependencies: imports,
        contentType: this.determineContentType(file)
      };
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
      throw error;
    }
  }

  extractMetadata(stats: { size: number; birthtime: Date; mtime: Date; mode: number }): {
    size: string;
    created: string;
    modified: string;
    permissions: string;
  } {
    try {
      return {
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        permissions: stats.mode.toString(8)
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        size: '0 KB',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        permissions: '644'
      };
    }
  }

  determineContentType(file: string): string {
    try {
      const lowercasePath = file.toLowerCase();

      if (lowercasePath.includes('.test.') || lowercasePath.includes('.spec.')) {
        return 'test';
      }
      if (lowercasePath.includes('/components/')) {
        return 'component';
      }
      if (lowercasePath.includes('/services/')) {
        return 'service';
      }
      if (lowercasePath.includes('/utils/')) {
        return 'utility';
      }
      if (lowercasePath.includes('/interfaces/')) {
        return 'interface';
      }
      if (lowercasePath.includes('/types/')) {
        return 'type';
      }
      return 'source';
    } catch (error) {
      console.error('Error determining content type:', error);
      return 'unknown';
    }
  }

  private determineRole(file: string): string {
    try {
      const lowercasePath = file.toLowerCase();

      if (lowercasePath.includes('.test.') || lowercasePath.includes('.spec.')) {
        return 'test';
      }
      if (lowercasePath.includes('interface') || lowercasePath.includes('.d.ts')) {
        return 'interface';
      }
      if (lowercasePath.includes('type') || lowercasePath.includes('.types.')) {
        return 'type';
      }
      return 'source';
    } catch (error) {
      console.error('Error determining role:', error);
      return 'unknown';
    }
  }
}