import { getPatterns } from '../patterns';
import { RepositoryManager } from './repository-manager';
import { FileAnalyzer } from './file-analyzer';
import { PatternMatcher } from './pattern-matcher';
import { ContentProcessor } from './content-processor';
import type { AnalysisResult, FileContent } from './interfaces';

export async function analyzeGitHubRepo(url: string, directoryPath?: string): Promise<AnalysisResult> {
  const repoManager = new RepositoryManager();
  const fileAnalyzer = new FileAnalyzer();
  const patternMatcher = new PatternMatcher();

  try {
    const tempDir = await repoManager.cloneRepository(url);
    const targetPath = await repoManager.getTargetPath(tempDir, directoryPath);

    const allFiles = await fileAnalyzer.getAllFiles(targetPath);
    const patterns = getPatterns();
    const filteredFiles = patternMatcher.filterFiles(allFiles, patterns);

    const { typeStats, totalSize } = await fileAnalyzer.analyzeFileTypes(filteredFiles, targetPath);
    const suggestions = patternMatcher.generateIgnoreSuggestions(filteredFiles);

    return {
      files: filteredFiles,
      suggestions,
      stats: {
        fileCount: filteredFiles.length,
        totalSizeBytes: totalSize,
        fileTypes: typeStats
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze repository: ${error.message}`);
  } finally {
    await repoManager.cleanup();
  }
}

export async function downloadRepository(url: string, directoryPath?: string): Promise<string> {
  const repoManager = new RepositoryManager();
  const fileAnalyzer = new FileAnalyzer();
  const patternMatcher = new PatternMatcher();
  const contentProcessor = new ContentProcessor();

  try {
    const tempDir = await repoManager.cloneRepository(url);
    const targetPath = await repoManager.getTargetPath(tempDir, directoryPath);

    const files = await fileAnalyzer.getAllFiles(targetPath);
    const patterns = getPatterns();
    const filteredFiles = patternMatcher.filterFiles(files, patterns);

    const contents: FileContent[] = await Promise.all(
      filteredFiles.map(async file => 
        contentProcessor.processFile(file, targetPath, url)
          .catch(error => ({
            path: file,
            content: `Error processing file: ${error.message}`,
            githubUrl: '',
            metadata: { size: '0 KB', created: '', modified: '', permissions: '' },
            language: 'unknown',
            role: 'unknown',
            directoryContext: '',
            dependencies: [],
            contentType: 'error'
          }))
      )
    );

    return contents.map(content => `File: ${content.path}
GitHub URL: ${content.githubUrl}
Language: ${content.language}
Role: ${content.role}
Directory Context: ${content.directoryContext}
Dependencies: ${content.dependencies.join(', ')}
Metadata: ${JSON.stringify(content.metadata, null, 2)}
Content Type: ${content.contentType}
${'='.repeat(content.path.length + 6)}
${content.content}\n\n`).join('\n');

  } catch (error: any) {
    throw new Error(`Failed to download repository: ${error.message}`);
  } finally {
    await repoManager.cleanup();
  }
}