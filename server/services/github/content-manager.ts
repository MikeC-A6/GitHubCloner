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

            // Generate standardized filename using content type and role
            const standardizedName = this.generateStandardizedFileName(
              file, 
              result.contentType || 'unknown',
              result.role || 'unknown',
              repoUrl
            );

            return {
              ...result,
              standardizedName,
              metadata: {
                ...result.metadata,
                generatedAt: new Date().toISOString()
              }
            };
          } catch (error) {
            // For error cases, generate a standardized error filename
            const errorFileName = this.generateStandardizedFileName(
              file,
              'error',
              'unknown',
              repoUrl
            );
            return {
              path: file,
              standardizedName: errorFileName,
              content: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
              githubUrl: '',
              metadata: { 
                size: '0 KB', 
                created: '', 
                modified: '', 
                permissions: '',
                generatedAt: new Date().toISOString()
              },
              language: 'unknown',
              role: 'unknown',
              directoryContext: '',
              dependencies: [],
              contentType: 'error'
            };
          }
        })
      );
    } catch (error) {
      throw new Error(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatContent(content: FileContent): string {
    try {
      // Safe default values for potentially undefined fields
      const safeContent = {
        path: content?.path || 'Unknown path',
        standardizedName: content?.standardizedName || this.generateStandardizedFileName('unknown', 'unknown', 'unknown'),
        githubUrl: content?.githubUrl || 'No URL available',
        language: content?.language || 'unknown',
        role: content?.role || 'unknown',
        directoryContext: content?.directoryContext || '',
        metadata: {
          size: content?.metadata?.size || '0 KB',
          created: content?.metadata?.created || 'Unknown',
          modified: content?.metadata?.modified || 'Unknown',
          permissions: content?.metadata?.permissions || 'Unknown',
          generatedAt: content?.metadata?.generatedAt || new Date().toISOString()
        },
        contentType: content?.contentType || 'unknown',
        dependencies: Array.isArray(content?.dependencies) ? content.dependencies : [],
        content: typeof content?.content === 'string' ? content.content : 'No content available'
      };

      // Create metadata section
      const metadataSection = [
        `File: ${safeContent.path}`,
        `GitHub URL: ${safeContent.githubUrl}`,
        `Language: ${safeContent.language}`,
        `Role: ${safeContent.role}`,
        `Type: ${safeContent.contentType}`,
        `Directory: ${safeContent.directoryContext}`,
        `Size: ${safeContent.metadata.size}`,
        `Created: ${safeContent.metadata.created}`,
        `Modified: ${safeContent.metadata.modified}`,
        `Permissions: ${safeContent.metadata.permissions}`,
        `Generated: ${safeContent.metadata.generatedAt}`,
        safeContent.dependencies.length > 0 ? `Dependencies:\n${safeContent.dependencies.map(d => `  ${d}`).join('\n')}` : 'Dependencies: none'
      ].join('\n');

      // Format the complete output
      return [
        safeContent.standardizedName,
        '═'.repeat(80),
        metadataSection,
        '═'.repeat(80),
        safeContent.content,
        '\n\n'
      ].join('\n');
    } catch (error) {
      return `Error formatting file content: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
    }
  }

  formatContentOutput(contents: FileContent[]): string {
    try {
      if (!Array.isArray(contents)) {
        throw new Error('Invalid contents array provided');
      }
      return contents.map(content => this.formatContent(content)).join('');
    } catch (error) {
      return `Error formatting output: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}