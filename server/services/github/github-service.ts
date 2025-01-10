import { IGitHubService, IRepositoryAnalyzer, IRepositoryDownloader } from './interfaces/repository';
import type { AnalysisResult } from './interfaces';
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { RepositoryManager } from './repository-manager';

export class GitHubService implements IGitHubService {
  private readonly repositoryAnalyzer: IRepositoryAnalyzer;
  private readonly repositoryDownloader: IRepositoryDownloader;

  constructor() {
    const repoManager = new RepositoryManager();
    const fileAnalyzer = new FileAnalyzer();
    const patternMatcher = new PatternMatcher();

    this.repositoryAnalyzer = new RepositoryAnalyzer(repoManager, fileAnalyzer, patternMatcher);
    this.repositoryDownloader = new RepositoryDownloader(repoManager, fileAnalyzer, patternMatcher);
  }

  async analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult> {
    return this.repositoryAnalyzer.analyzeRepository(url, directoryPath);
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    return this.repositoryDownloader.downloadRepository(url, directoryPath);
  }
}