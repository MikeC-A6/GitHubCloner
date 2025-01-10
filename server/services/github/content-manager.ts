import { IContentManager, IContentFormatter } from './interfaces/content-manager.js';
import { IContentProcessor } from './interfaces/content-processor.js';
import { FileContent } from './interfaces.js';
import { ContentProcessor } from './content-processor.js';

export class ContentManager implements IContentManager, IContentFormatter {
  private readonly contentProcessor: IContentProcessor;

  constructor(contentProcessor?: IContentProcessor) {
    this.contentProcessor = contentProcessor || new ContentProcessor();
  }

  private generateStandardizedFileName(originalPath: string, type: string, role: string): string {
    const date = new Date();
    const timestamp = date.toISOString().split('T')[0].replace(/-/g, '');

    // Extract repository name from the path (if available)
    const pathParts = originalPath.split('/');
    const repoContext = pathParts[0] === '' ? 'root' : pathParts[0];

    // Create a more readable directory context
    const dirContext = pathParts
      .slice(1, -1) // Exclude the first (repo) and last (filename) parts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single one
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Combine contexts for the filename
    const context = dirContext ? `${repoContext}-${dirContext}` : repoContext;

    // Clean up type and role
    const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRole = role.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Generate final filename with all components
    return `${context}_${cleanType}_${cleanRole}_${timestamp}.txt`;
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
              result.role || 'unknown'
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
              'unknown'
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

      return `${safeContent.standardizedName}\n${'═'.repeat(80)}\n${safeContent.content}\n\n`;
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