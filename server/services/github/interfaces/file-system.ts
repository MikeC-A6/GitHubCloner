import { Stats } from 'fs';

export interface IFileSystem {
  readdir(path: string, options: { withFileTypes: boolean }): Promise<Array<{ name: string; isDirectory(): boolean }>>;
  stat(path: string): Promise<Stats>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
  access(path: string): Promise<void>;
  rm(path: string, options: { recursive: boolean; force: boolean }): Promise<void>;
  mkdtemp(prefix: string): Promise<string>;
}

export interface IPathOperations {
  join(...paths: string[]): string;
  relative(from: string, to: string): string;
  dirname(path: string): string;
  extname(path: string): string;
}

export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly path: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FileSystemError';
  }
}