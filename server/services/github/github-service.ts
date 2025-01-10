import { IGitHubService, IRepositoryAnalyzer, IRepositoryDownloader } from './interfaces/repository.js';
import type { AnalysisResult } from './interfaces.js';
import { RepositoryAnalyzer } from './repository-analyzer.js';
import { RepositoryDownloader } from './repository-downloader.js';
import { FileAnalyzer } from './file-analyzer.js';
import { PatternMatcher } from './pattern-matcher.js';
import { RepositoryManager } from './repository-manager.js';
import { ContentManager } from './content-manager.js';
import { FileSystem } from '../file-system.js';

export class GitHubService implements IGitHubService {
  private readonly repositoryAnalyzer: IRepositoryAnalyzer;
  private readonly repositoryDownloader: IRepositoryDownloader;

  constructor(
    repositoryAnalyzer?: IRepositoryAnalyzer,
    repositoryDownloader?: IRepositoryDownloader
  ) {
    // Initialize file system first as it's a core dependency
    const fileSystem = new FileSystem();

    // Create dependencies with proper initialization
    const repoManager = new RepositoryManager(fileSystem);
    const fileAnalyzer = new FileAnalyzer(fileSystem);
    const patternMatcher = new PatternMatcher();
    const contentManager = new ContentManager();

    this.repositoryAnalyzer = repositoryAnalyzer || 
      new RepositoryAnalyzer(repoManager, fileAnalyzer, patternMatcher);
    this.repositoryDownloader = repositoryDownloader || 
      new RepositoryDownloader(repoManager, fileAnalyzer, patternMatcher, contentManager);
  }

  async analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult> {
    return this.repositoryAnalyzer.analyzeRepository(url, directoryPath);
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    return this.repositoryDownloader.downloadRepository(url, directoryPath);
  }
}