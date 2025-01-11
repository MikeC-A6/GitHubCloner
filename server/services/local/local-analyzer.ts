
import { FileAnalyzer } from '../github/file-analyzer.js';
import { PatternMatcher } from '../github/pattern-matcher.js';
import type { AnalysisResult } from '../github/interfaces.js';

export async function analyzeLocalFiles(files: FileList): Promise<AnalysisResult> {
  const fileAnalyzer = new FileAnalyzer();
  const patternMatcher = new PatternMatcher();
  
  const fileList = Array.from(files).map(file => file.name);
  const patterns = getPatterns();
  const filteredFiles = patternMatcher.filterFiles(fileList, patterns);
  
  const typeStats = await fileAnalyzer.analyzeFileTypes(filteredFiles);
  const suggestions = patternMatcher.generateIgnoreSuggestions(filteredFiles);
  
  return {
    files: filteredFiles,
    suggestions,
    stats: {
      fileCount: filteredFiles.length,
      totalSizeBytes: files.size,
      fileTypes: typeStats
    }
  };
}
