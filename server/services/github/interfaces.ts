// Import all interfaces first
import type { FileTypeStats, FileMetadata, FileContent } from './interfaces/common.js';
import type { AnalysisResult, IRepositoryManager, IRepositoryAnalyzer, IRepositoryDownloader, IGitHubService } from './interfaces/repository.js';
import type { IFileAnalyzer, IFileStats, IFileMetadata } from './interfaces/file-analyzer.js';
import type { IContentProcessor, IContentTypeDetector, IMetadataExtractor } from './interfaces/content-processor.js';
import type { IPatternMatcher, IPatternValidator } from './interfaces/pattern-matcher.js';
import type { IContentManager, IContentFormatter } from './interfaces/content-manager.js';
import type { IFileSystem, IPathOperations, FileSystemError } from './interfaces/file-system.js';

// Re-export everything from the interface files
export * from './interfaces/common.js';
export * from './interfaces/repository.js';
export * from './interfaces/file-analyzer.js';
export * from './interfaces/content-processor.js';
export * from './interfaces/pattern-matcher.js';
export * from './interfaces/content-manager.js';
export * from './interfaces/file-system.js';

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