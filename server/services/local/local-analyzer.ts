import { FileAnalyzer } from '../github/file-analyzer.js';
import { PatternMatcher } from '../github/pattern-matcher.js';
import { getPatterns } from '../patterns.js';
import { FileSystem } from '../file-system.js';
import type { AnalysisResult } from '../github/interfaces.js';
import type { Multer } from 'multer';

export async function analyzeLocalFiles(files: Express.Multer.File[]): Promise<AnalysisResult> {
  const fileSystem = new FileSystem();
  const fileAnalyzer = new FileAnalyzer(fileSystem);
  const patternMatcher = new PatternMatcher();

  // Convert uploaded files to paths and calculate total size
  const fileList = files.map(file => file.originalname);
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  const patterns = getPatterns();
  const filteredFiles = patternMatcher.filterFiles(fileList, patterns);

  const { typeStats } = await fileAnalyzer.analyzeFileTypes(filteredFiles, '');
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
}