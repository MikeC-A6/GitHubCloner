// Import all interfaces first
import type { FileTypeStats, FileMetadata, FileContent } from './interfaces/common';
import type { AnalysisResult, IRepositoryManager, IRepositoryAnalyzer, IRepositoryDownloader, IGitHubService } from './interfaces/repository';
import type { IFileAnalyzer, IFileStats, IFileMetadata } from './interfaces/file-analyzer';
import type { IContentProcessor, IContentTypeDetector, IMetadataExtractor } from './interfaces/content-processor';
import type { IPatternMatcher, IPatternValidator } from './interfaces/pattern-matcher';
import type { IContentManager, IContentFormatter } from './interfaces/content-manager';
import type { IFileSystem, IPathOperations, FileSystemError } from './interfaces/file-system';

// Re-export everything from the interface files
export * from './interfaces/common';
export * from './interfaces/repository';
export * from './interfaces/file-analyzer';
export * from './interfaces/content-processor';
export * from './interfaces/pattern-matcher';
export * from './interfaces/content-manager';
export * from './interfaces/file-system';

// Re-export specific types to ensure type safety
export type {
  FileTypeStats,
  FileMetadata,
  FileContent,
  AnalysisResult,
  IRepositoryManager,
  IRepositoryAnalyzer,
  IRepositoryDownloader,
  IGitHubService,
  IFileAnalyzer,
  IFileStats,
  IFileMetadata,
  IContentProcessor,
  IContentTypeDetector,
  IMetadataExtractor,
  IPatternMatcher,
  IPatternValidator,
  IContentManager,
  IContentFormatter,
  IFileSystem,
  IPathOperations,
  FileSystemError
};