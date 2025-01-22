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

      // Extract repository name from the URL
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'unknown-repo';

      // Safe construction of GitHub URL
      const repoUrlParts = repoUrl.split('github.com/');
      const fullGithubUrl = repoUrlParts.length > 1 ? 
        `https://github.com/${repoUrlParts[1]}/blob/main/${file}` : 
        repoUrl;

      const metadata = this.extractMetadata(stats);
      const fileExt = this.fileSystem.extname(file).toLowerCase();
      const contentType = this.determineContentType(file);
      const role = this.determineRole(file);

      // Create more detailed directory context
      const pathParts = file.split('/');
      const directoryContext = pathParts.length > 1 ? 
        pathParts.slice(0, -1).join('/') : 
        'root';

      // Extract imports for JavaScript/TypeScript files
      const imports = (fileExt === '.ts' || fileExt === '.js' || fileExt === '.tsx' || fileExt === '.jsx') ? 
        (content.match(/^import.*from.*$/gm) || []) : [];

      return {
        path: file,
        standardizedName: '', // Will be set by ContentManager
        content,
        githubUrl: fullGithubUrl,
        metadata: {
          ...metadata,
          generatedAt: new Date().toISOString()
        },
        language: fileExt.slice(1) || 'unknown',
        role,
        directoryContext,
        dependencies: imports,
        contentType
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
    generatedAt: string;
  } {
    return {
      size: `${(stats.size / 1024).toFixed(2)} KB`,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      permissions: stats.mode.toString(8),
      generatedAt: new Date().toISOString()
    };
  }

  determineContentType(file: string): string {
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
    if (lowercasePath.includes('/routes/') || lowercasePath.includes('route.') || lowercasePath.includes('router.')) {
      return 'route';
    }
    if (lowercasePath.includes('/models/') || lowercasePath.includes('model.')) {
      return 'model';
    }
    if (lowercasePath.includes('/controllers/') || lowercasePath.includes('controller.')) {
      return 'controller';
    }
    return 'code';
  }

  private determineRole(file: string): string {
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
    if (lowercasePath.includes('controller')) {
      return 'controller';
    }
    if (lowercasePath.includes('service')) {
      return 'service';
    }
    if (lowercasePath.includes('component')) {
      return 'component';
    }
    if (lowercasePath.includes('model')) {
      return 'model';
    }
    return 'file';
  }
}