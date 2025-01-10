import fs from 'fs/promises';
import path from 'path';
import { IFileSystem, IPathOperations, FileSystemError } from './github/interfaces/file-system.js';
import type { Stats } from 'fs';

export class FileSystem implements IFileSystem, IPathOperations {
  async readdir(dirPath: string, options: { withFileTypes: boolean }) {
    try {
      return fs.readdir(dirPath, { withFileTypes: true });
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to read directory: ${error.message}`,
        'readdir',
        dirPath,
        error
      );
    }
  }

  async stat(path: string): Promise<Stats> {
    try {
      return fs.stat(path);
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to get file stats: ${error.message}`,
        'stat',
        path,
        error
      );
    }
  }

  async readFile(filePath: string, encoding: BufferEncoding): Promise<string> {
    try {
      return fs.readFile(filePath, { encoding });
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to read file: ${error.message}`,
        'readFile',
        filePath,
        error
      );
    }
  }

  async access(path: string): Promise<void> {
    try {
      return fs.access(path);
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to access path: ${error.message}`,
        'access',
        path,
        error
      );
    }
  }

  async rm(path: string, options: { recursive: boolean; force: boolean }): Promise<void> {
    try {
      return fs.rm(path, options);
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to remove path: ${error.message}`,
        'rm',
        path,
        error
      );
    }
  }

  async mkdtemp(prefix: string): Promise<string> {
    try {
      return fs.mkdtemp(prefix);
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to create temp directory: ${error.message}`,
        'mkdtemp',
        prefix,
        error
      );
    }
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }
}