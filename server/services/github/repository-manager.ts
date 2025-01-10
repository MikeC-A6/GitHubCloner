import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { IRepositoryManager } from './interfaces/repository';

export class RepositoryManager implements IRepositoryManager {
  private tempDir: string = '';
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async initializeTempDir(): Promise<string> {
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
    return this.tempDir;
  }

  validateGitHubUrl(url: string): boolean {
    return !!url.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/);
  }

  async cloneRepository(url: string): Promise<string> {
    if (!this.validateGitHubUrl(url)) {
      throw new Error("Invalid GitHub repository URL");
    }

    const tempDir = await this.initializeTempDir();
    await this.git.clone(url, tempDir, ['--depth', '1']);
    return tempDir;
  }

  async getTargetPath(baseDir: string, directoryPath?: string): Promise<string> {
    const targetPath = directoryPath ? path.join(baseDir, directoryPath) : baseDir;

    try {
      await fs.access(targetPath);
      return targetPath;
    } catch {
      throw new Error("Specified directory path does not exist in the repository");
    }
  }

  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}