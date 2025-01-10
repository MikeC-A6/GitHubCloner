import fs from 'fs/promises';
import path from 'path';
import { FileTypeStats, FileMetadata } from './interfaces';

export class FileAnalyzer {
  async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(path.relative(dir, fullPath));
        }
      }
    }

    await scan(dir);
    return files;
  }

  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isSymlink: stats.isSymbolicLink(),
      permissions: stats.mode,
      userId: stats.uid,
      groupId: stats.gid
    };
  }

  async analyzeFileTypes(files: string[], basePath: string): Promise<{ typeStats: FileTypeStats[], totalSize: number }> {
    let totalSize = 0;
    const typeStats = new Map<string, FileTypeStats>();

    for (const file of files) {
      const stats = await fs.stat(path.join(basePath, file));
      totalSize += stats.size;

      const ext = path.extname(file).toLowerCase() || 'no extension';
      const currentStats = typeStats.get(ext) || { 
        extension: ext, 
        count: 0, 
        totalBytes: 0 
      };

      currentStats.count++;
      currentStats.totalBytes += stats.size;
      typeStats.set(ext, currentStats);
    }

    const sortedTypeStats = Array.from(typeStats.values())
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, 5);

    return { typeStats: sortedTypeStats, totalSize };
  }
}
