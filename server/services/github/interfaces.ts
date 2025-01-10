import { Stats } from 'fs';

export interface FileTypeStats {
  extension: string;
  count: number;
  totalBytes: number;
}

export interface FileMetadata {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isSymlink: boolean;
  permissions: number;
  userId: number;
  groupId: number;
}

export interface AnalysisResult {
  files: string[];
  suggestions: string[];
  stats: {
    fileCount: number;
    totalSizeBytes: number;
    fileTypes: FileTypeStats[];
  };
}

export interface FileContent {
  path: string;
  content: string;
  githubUrl: string;
  metadata: {
    size: string;
    created: string;
    modified: string;
    permissions: string;
  };
  language: string;
  role: string;
  directoryContext: string;
  dependencies: string[];
  contentType: string;
}
