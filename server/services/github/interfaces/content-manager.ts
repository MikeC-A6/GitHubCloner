import { FileContent } from './common';

export interface IContentManager {
  getFileContents(files: string[], basePath: string, repoUrl: string): Promise<FileContent[]>;
  formatContentOutput(contents: FileContent[]): string;
}

export interface IContentFormatter {
  formatContent(content: FileContent): string;
  generateStandardizedFileName(originalPath: string, type: string, role: string): string;
}

export interface IContentProcessor {
  processFile(filePath: string, basePath: string, repoUrl: string): Promise<FileContent>;
}