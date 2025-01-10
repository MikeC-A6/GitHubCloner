import { IGitHubService, IRepositoryAnalyzer, IRepositoryDownloader } from './interfaces/repository';
import type { AnalysisResult } from './interfaces';
import { RepositoryAnalyzer } from './repository-analyzer';
import { RepositoryDownloader } from './repository-downloader';

export class GitHubService implements IGitHubService {
  private readonly repositoryAnalyzer: IRepositoryAnalyzer;
  private readonly repositoryDownloader: IRepositoryDownloader;

  constructor() {
    this.repositoryAnalyzer = new RepositoryAnalyzer();
    this.repositoryDownloader = new RepositoryDownloader();
  }

  async analyzeRepository(url: string, directoryPath?: string): Promise<AnalysisResult> {
    return this.repositoryAnalyzer.analyzeRepository(url, directoryPath);
  }

  async downloadRepository(url: string, directoryPath?: string): Promise<string> {
    return this.repositoryDownloader.downloadRepository(url, directoryPath);
  }
}
