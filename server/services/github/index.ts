// Re-export functionality from individual service files
import { RepositoryAnalyzer } from './repository-analyzer.js';
import { RepositoryDownloader } from './repository-downloader.js';
import { FileAnalyzer } from './file-analyzer.js';
import { PatternMatcher } from './pattern-matcher.js';
import { RepositoryManager } from './repository-manager.js';
import { ContentManager } from './content-manager.js';
import { FileSystem } from '../file-system.js';
import { GitHubService } from './github-service.js';
import { extname } from 'path';

// Create shared instances
const fileSystem = new FileSystem();
const repoManager = new RepositoryManager(fileSystem);
const fileAnalyzer = new FileAnalyzer(fileSystem);
const patternMatcher = new PatternMatcher();
const contentManager = new ContentManager();

// Create main service instance using dependency injection
const githubService = new GitHubService(
  new RepositoryAnalyzer(repoManager, fileAnalyzer, patternMatcher),
  new RepositoryDownloader(repoManager, fileAnalyzer, patternMatcher, contentManager)
);

// Export the functions with exactly the same names as expected by routes.ts
export const analyzeGitHubRepo = (url: string, directoryPath?: string) =>
  githubService.analyzeRepository(url, directoryPath);

export const downloadRepository = (url: string, directoryPath?: string) =>
  githubService.downloadRepository(url, directoryPath);

function getLanguageFromExtension(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
  };
  return languageMap[ext] || 'unknown';
}

export const downloadRepositoryAsJsonl = async (url: string, directoryPath?: string) => {
  const content = await githubService.downloadRepository(url, directoryPath);
  const analysis = await githubService.analyzeRepository(url, directoryPath);

  // Process each file and format as JSONL
  const fileContents = content.content.split('\n================================================================================\n');
  const jsonlContent = analysis.files.map((file, index) => {
    const fileContent = fileContents[index] || '';

    // Extract metadata from the content header
    const metadataMatch = fileContent.match(/File: (.*?)\nLanguage: (.*?)\nType: (.*?)\nDirectory: (.*?)\nGitHub URL: (.*?)\nSize: (.*?)\nLast Modified: (.*?)\n/);

    // Construct the GitHub URL for the file
    const repoBase = url.replace(/\.git$/, '');
    const branch = 'main'; // Assuming main branch, could be extracted from the URL if needed
    const githubUrl = `${repoBase}/blob/${branch}/${file}`;

    const metadata = metadataMatch ? {
      path: file,
      language: getLanguageFromExtension(file),
      type: 'code',
      directory: file.split('/').slice(0, -1).join('/') || 'root',
      github_url: metadataMatch[5],
      size: analysis.stats.fileTypes.find(t => file.endsWith(t.extension))?.totalBytes || 0,
      lastModified: new Date().toISOString(),
      content: fileContent.split('\n').slice(7).join('\n').trim() // Skip metadata lines
    } : {
      path: file,
      language: getLanguageFromExtension(file),
      type: 'code',
      directory: file.split('/').slice(0, -1).join('/') || 'root',
      github_url: githubUrl,
      size: analysis.stats.fileTypes.find(t => file.endsWith(t.extension))?.totalBytes || 0,
      lastModified: new Date().toISOString(),
      content: fileContent.trim()
    };

    return JSON.stringify(metadata);
  }).join('\n');

  const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';
  return {
    content: jsonlContent,
    filename: `${repoName}.jsonl`
  };
};

// Re-export types and interfaces
export * from './interfaces.js';