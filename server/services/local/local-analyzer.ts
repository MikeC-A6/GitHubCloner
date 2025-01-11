import { FileAnalyzer } from '../github/file-analyzer.js';
import { PatternMatcher } from '../github/pattern-matcher.js';
import { getPatterns } from '../patterns.js';
import { FileSystem } from '../file-system.js';
import type { AnalysisResult } from '../github/interfaces.js';
import type { Multer } from 'multer';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

export async function analyzeLocalFiles(files: Express.Multer.File[]): Promise<AnalysisResult> {
  const fileSystem = new FileSystem();
  const fileAnalyzer = new FileAnalyzer(fileSystem);
  const patternMatcher = new PatternMatcher();

  // Create a temporary directory for the uploaded files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-analysis-'));

  try {
    // Write files to temporary directory maintaining their relative paths
    for (const file of files) {
      const filePath = path.join(tempDir, file.originalname);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.buffer);
    }

    // Get all files in the temporary directory
    const fileList = files.map(file => file.originalname);
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    const patterns = getPatterns();
    const filteredFiles = patternMatcher.filterFiles(fileList, patterns);

    const { typeStats } = await fileAnalyzer.analyzeFileTypes(filteredFiles, tempDir);
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
  } finally {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}