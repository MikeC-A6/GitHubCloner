import { FileContent } from './common';

export interface IContentProcessor {
  processFile(file: string, basePath: string, repoUrl: string): Promise<FileContent>;
}

export interface IContentTypeDetector {
  determineContentType(file: string): string;
}

export interface IMetadataExtractor {
  extractMetadata(stats: { size: number, birthtime: Date, mtime: Date, mode: number }): {
    size: string;
    created: string;
    modified: string;
    permissions: string;
  };
}
