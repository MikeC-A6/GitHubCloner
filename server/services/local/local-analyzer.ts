import { FileAnalyzer } from '../github/file-analyzer.js';
import { PatternMatcher } from '../github/pattern-matcher.js';
import { getPatterns } from '../patterns.js';
import { FileSystem } from '../file-system.js';
import type { AnalysisResult } from '../github/interfaces.js';
import type { Multer } from 'multer';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for processing

export async function analyzeLocalFiles(files: Express.Multer.File[]): Promise<AnalysisResult> {
  const fileSystem = new FileSystem();
  const fileAnalyzer = new FileAnalyzer(fileSystem);
  const patternMatcher = new PatternMatcher();

  // Create a temporary directory for the uploaded files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-analysis-'));

  try {
    // Process files in chunks
    const processedFiles: string[] = [];
    let totalSize = 0;

    // Write files to temporary directory maintaining their relative paths
    for (const file of files) {
      const filePath = path.join(tempDir, file.originalname);
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Process file in chunks if it's larger than chunk size
      if (file.size > CHUNK_SIZE) {
        const fileHandle = await fs.open(filePath, 'w');
        try {
          let offset = 0;
          while (offset < file.buffer.length) {
            const chunk = file.buffer.slice(offset, offset + CHUNK_SIZE);
            await fileHandle.write(chunk, 0, chunk.length, offset);
            offset += CHUNK_SIZE;
          }
        } finally {
          await fileHandle.close();
        }
      } else {
        await fs.writeFile(filePath, file.buffer);
      }

      processedFiles.push(file.originalname);
      totalSize += file.size;
    }

    const patterns = getPatterns();
    const filteredFiles = patternMatcher.filterFiles(processedFiles, patterns);

    // Analyze file types in chunks
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
  } catch (error: any) {
    console.error('Error in analyzeLocalFiles:', error);
    throw new Error(`Failed to analyze local files: ${error.message}`);
  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up temporary directory:', cleanupError);
    }
  }
}