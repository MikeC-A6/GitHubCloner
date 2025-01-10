import { IGitHubService, IRepositoryAnalyzer, IRepositoryDownloader } from './interfaces/repository';
import type { AnalysisResult } from './interfaces';
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { RepositoryManager } from './repository-manager';
import { ContentManager } from './content-manager';

export class GitHubService implements IGitHubService {
  private readonly repositoryAnalyzer: IRepositoryAnalyzer;
  private readonly repositoryDownloader: IRepositoryDownloader;

  constructor(
    repositoryAnalyzer?: IRepositoryAnalyzer,
    repositoryDownloader?: IRepositoryDownloader
  ) {
    // Dependency injection with default implementations
    if (!repositoryAnalyzer || !repositoryDownloader) {
      const repoManager = new RepositoryManager();
      const fileAnalyzer = new FileAnalyzer();
      const patternMatcher = new PatternMatcher();
      const contentManager = new ContentManager();

      this.repositoryAnalyzer = repositoryAnalyzer || 
        new RepositoryAnalyzer(repoManager, fileAnalyzer, patternMatcher);
      this.repositoryDownloader = repositoryDownloader || 
        new RepositoryDownloader(repoManager, fileAnalyzer, patternMatcher, contentManager);
    } else {
      this.repositoryAnalyzer = repositoryAnalyzer;
      this.repositoryDownloader = repositoryDownloader;
    }
  }

  async analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult> {
    return this.repositoryAnalyzer.analyzeRepository(url, directoryPath);
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    return this.repositoryDownloader.downloadRepository(url, directoryPath);
  }
}