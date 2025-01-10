import { FileTypeStats, FileMetadata } from './interfaces';
import { IFileAnalyzer, IFileStats, IFileMetadata } from './interfaces/file-analyzer';
import { IFileSystem, IPathOperations, FileSystemError } from './interfaces/file-system';
import { FileSystem } from '../file-system';

export class FileAnalyzer implements IFileAnalyzer, IFileStats, IFileMetadata {
  private readonly fileSystem: IFileSystem & IPathOperations;

  constructor(fileSystem?: IFileSystem & IPathOperations) {
    this.fileSystem = fileSystem || new FileSystem();
  }

  async getAllFiles(dir: string): Promise<string[]> {
    try {
      const files: string[] = [];
      const scan = async (directory: string): Promise<void> => {
        const entries = await this.fileSystem.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = this.fileSystem.join(directory, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else {
            files.push(this.fileSystem.relative(dir, fullPath));
          }
        }
      };

      await scan(dir);
      return files;
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to get files: ${error.message}`);
    }
  }

  async getMetadata(filePath: string): Promise<FileMetadata> {
    return this.getFileMetadata(filePath);
  }

  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const stats = await this.fileSystem.stat(filePath);
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
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  async calculateFileTypeStats(files: string[], basePath: string): Promise<FileTypeStats[]> {
    try {
      const typeStats = new Map<string, FileTypeStats>();

      for (const file of files) {
        const stats = await this.fileSystem.stat(this.fileSystem.join(basePath, file));
        const ext = this.fileSystem.extname(file).toLowerCase() || 'no extension';

        const currentStats = typeStats.get(ext) || { 
          extension: ext, 
          count: 0, 
          totalBytes: 0 
        };

        currentStats.count++;
        currentStats.totalBytes += stats.size;
        typeStats.set(ext, currentStats);
      }

      return Array.from(typeStats.values())
        .sort((a, b) => b.totalBytes - a.totalBytes)
        .slice(0, 5);
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to calculate file type stats: ${error.message}`);
    }
  }

  async getTotalSize(files: string[], basePath: string): Promise<number> {
    try {
      let totalSize = 0;
      for (const file of files) {
        const stats = await this.fileSystem.stat(this.fileSystem.join(basePath, file));
        totalSize += stats.size;
      }
      return totalSize;
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to get total size: ${error.message}`);
    }
  }

  async analyzeFileTypes(files: string[], basePath: string): Promise<{ typeStats: FileTypeStats[], totalSize: number }> {
    const [typeStats, totalSize] = await Promise.all([
      this.calculateFileTypeStats(files, basePath),
      this.getTotalSize(files, basePath)
    ]);

    return { typeStats, totalSize };
  }
}