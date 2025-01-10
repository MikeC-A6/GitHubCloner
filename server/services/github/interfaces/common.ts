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

export interface FileContent {
  path: string;
  standardizedName: string;  // Required field for the standardized filename
  content: string;
  githubUrl: string;
  metadata: {
    size: string;
    created: string;
    modified: string;
    permissions: string;
    generatedAt: string;  // Required field for tracking when the file was processed
  };
  language: string;
  role: string;
  directoryContext: string;
  dependencies: string[];
  contentType: string;
}