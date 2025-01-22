import { IContentManager, IContentFormatter } from './interfaces/content-manager.js';
import { IContentProcessor } from './interfaces/content-processor.js';
import { FileContent } from './interfaces.js';
import { ContentProcessor } from './content-processor.js';

export class ContentManager implements IContentManager, IContentFormatter {
  private readonly contentProcessor: IContentProcessor;

  constructor(contentProcessor?: IContentProcessor) {
    this.contentProcessor = contentProcessor || new ContentProcessor();
  }

  generateStandardizedFileName(originalPath: string, type: string, role: string, repoUrl?: string): string {
    const date = new Date();
    const timestamp = date.toISOString().split('T')[0].replace(/-/g, '') + 
                     '_' + date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');

    // Extract repository name from the GitHub URL
    let repoContext = 'repository';
    if (repoUrl) {
      const urlParts = repoUrl.split('/');
      repoContext = urlParts[urlParts.length - 1]?.replace('.git', '') || 
                   urlParts[urlParts.length - 2] || 
                   'repository';
    }

    // Create a more readable directory context
    const pathParts = originalPath.split('/');
    const dirContext = pathParts
      .slice(0, -1) // Exclude the filename
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single one
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Generate final filename with just repository name and timestamp
    return `${repoContext}_${timestamp}.txt`;
  }

  async getFileContents(files: string[], basePath: string, repoUrl: string): Promise<FileContent[]> {
    try {
      return await Promise.all(
        files.map(async (file) => {
          try {
            const result = await this.contentProcessor.processFile(file, basePath, repoUrl);
            return {
              ...result,
              standardizedName: this.generateStandardizedFileName(
                file, 
                result.contentType || 'unknown',
                result.role || 'unknown',
                repoUrl
              )
            };
          } catch (error) {
            console.error(`Error processing file ${file}:`, error);
            const errorFileName = this.generateStandardizedFileName(file, 'error', 'unknown', repoUrl);
            return {
              path: file,
              standardizedName: errorFileName,
              content: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
              githubUrl: repoUrl,
              metadata: { 
                size: '0 KB', 
                created: new Date().toISOString(), 
                modified: new Date().toISOString(), 
                permissions: '644',
                generatedAt: new Date().toISOString()
              },
              language: 'unknown',
              role: 'error',
              directoryContext: '',
              dependencies: [],
              contentType: 'error'
            };
          }
        })
      );
    } catch (error) {
      console.error('Failed to process files:', error);
      throw new Error(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatContent(content: FileContent): string {
    try {
      const header = [
        '='.repeat(80),
        `File: ${content.path}`,
        `Language: ${content.language}`,
        `Type: ${content.contentType}`,
        `Directory: ${content.directoryContext}`,
        `Size: ${content.metadata.size}`,
        `Last Modified: ${content.metadata.modified}`,
        '='.repeat(80),
        ''
      ].join('\n');

      return header + content.content + '\n\n';
    } catch (error) {
      console.error('Error formatting content:', error);
      return `Error formatting file content: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
    }
  }

  formatContentOutput(contents: FileContent[]): string {
    try {
      if (!Array.isArray(contents)) {
        throw new Error('Invalid contents array provided');
      }

      const output = contents
        .filter(content => content && typeof content.content === 'string')
        .map(content => this.formatContent(content))
        .join('\n');

      if (!output) {
        throw new Error('No valid content to format');
      }

      return output;
    } catch (error) {
      console.error('Error formatting output:', error);
      return `Error formatting output: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}