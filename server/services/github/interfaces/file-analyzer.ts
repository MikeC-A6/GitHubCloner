import { FileTypeStats, FileMetadata } from '../interfaces';

export interface IFileAnalyzer {
  getAllFiles(dir: string): Promise<string[]>;
  getFileMetadata(filePath: string): Promise<FileMetadata>;
  analyzeFileTypes(files: string[], basePath: string): Promise<{ typeStats: FileTypeStats[], totalSize: number }>;
}

export interface IFileStats {
  calculateFileTypeStats(files: string[], basePath: string): Promise<FileTypeStats[]>;
  getTotalSize(files: string[], basePath: string): Promise<number>;
}

export interface IFileMetadata {
  getMetadata(filePath: string): Promise<FileMetadata>;
}
