import { Stats } from 'fs';

export interface FileTypeStats {
  extension: string;
  count: number;
  totalBytes: number;
}

export interface FileMetadata {
  size: string;
  created: string;
  modified: string;
  permissions: string;
  generatedAt: string;  // Required field for tracking when the file was processed
}

export interface FileContent {
  path: string;
  standardizedName: string;  // Required field for the standardized filename
  content: string;
  githubUrl: string;
  metadata: FileMetadata;
  language: string;
  role: string;
  directoryContext: string;
  dependencies: string[];
  contentType: string;
}