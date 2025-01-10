import fs from 'fs/promises';
import path from 'path';
import { FileContent } from './interfaces';

export class ContentProcessor {
  async processFile(file: string, basePath: string, repoUrl: string): Promise<FileContent> {
    const filePath = path.join(basePath, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    const repoUrlParts = repoUrl.split('github.com/');
    const fullGithubUrl = `https://github.com/${repoUrlParts[1]}/blob/main/${file}`;

    const metadata = {
      size: `${(stats.size / 1024).toFixed(2)} KB`,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      permissions: stats.mode.toString(8)
    };

    const fileExt = path.extname(file);
    const imports = fileExt === '.ts' || fileExt === '.js' ? 
      content.match(/^import.*from.*$/gm) || [] : [];

    return {
      path: file,
      content,
      githubUrl: fullGithubUrl,
      metadata,
      language: fileExt.slice(1) || 'unknown',
      role: file.includes('test') || file.includes('spec') ? 'test' : 'source',
      directoryContext: path.dirname(file),
      dependencies: imports,
      contentType: this.determineContentType(file)
    };
  }

  private determineContentType(file: string): string {
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
