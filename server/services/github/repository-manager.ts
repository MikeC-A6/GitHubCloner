import { SimpleGit, simpleGit } from 'simple-git';
import os from 'os';
import { IRepositoryManager } from './interfaces/repository';
import { IFileSystem, IPathOperations, FileSystemError } from './interfaces/file-system';
import { FileSystem } from './services/file-system';

export class RepositoryManager implements IRepositoryManager {
  private tempDir: string = '';
  private readonly git: SimpleGit;
  private readonly fileSystem: IFileSystem & IPathOperations;

  constructor(fileSystem?: IFileSystem & IPathOperations) {
    this.git = simpleGit();
    this.fileSystem = fileSystem || new FileSystem();
  }

  async initializeTempDir(): Promise<string> {
    try {
      this.tempDir = await this.fileSystem.mkdtemp(
        this.fileSystem.join(os.tmpdir(), 'repo-')
      );
      return this.tempDir;
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to initialize temp directory: ${error.message}`);
    }
  }

  validateGitHubUrl(url: string): boolean {
    return !!url.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/);
  }

  async cloneRepository(url: string): Promise<string> {
    try {
      if (!this.validateGitHubUrl(url)) {
        throw new Error("Invalid GitHub repository URL");
      }

      const tempDir = await this.initializeTempDir();
      await this.git.clone(url, tempDir, ['--depth', '1']);
      return tempDir;
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async getTargetPath(baseDir: string, directoryPath?: string): Promise<string> {
    try {
      const targetPath = directoryPath ? 
        this.fileSystem.join(baseDir, directoryPath) : 
        baseDir;

      await this.fileSystem.access(targetPath);
      return targetPath;
    } catch (error: any) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new Error(`Failed to access target path: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        await this.fileSystem.rm(this.tempDir, { recursive: true, force: true });
      } catch (error: any) {
        // Silently handle cleanup errors
        console.error(`Cleanup failed: ${error.message}`);
      }
    }
  }
}