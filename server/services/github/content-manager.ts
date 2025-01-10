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
    const ext = originalPath.split('.').pop() || 'txt';
    const dirContext = originalPath.split('/').slice(0, -1).join('-') || 'root';
    return `repo-${dirContext}_${type}_${role}_${timestamp}.${ext}`;
  }

  async getFileContents(files: string[], basePath: string, repoUrl: string): Promise<FileContent[]> {
    return Promise.all(
      files.map(async (file) => {
        try {
          const result = await this.contentProcessor.processFile(file, basePath, repoUrl);
          // Generate standardized filename based on content type, role and current date
          const standardizedName = this.generateStandardizedFileName(
            file, 
            result.contentType,
            result.role
          );
          return {
            ...result,
            standardizedName,
            metadata: {
              ...result.metadata,
              generatedAt: new Date().toISOString(),
            }
          };
        } catch (error) {
          return {
            path: file,
            standardizedName: this.generateStandardizedFileName(file, 'error', 'unknown'),
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
          } as FileContent;
        }
      })
    );
  }

  formatContent(content: FileContent): string {
    try {
      // Safe default values for potentially undefined fields
      const safeContent = {
        path: content?.path || 'Unknown path',
        standardizedName: content?.standardizedName || this.generateStandardizedFileName('unknown.txt', 'unknown', 'unknown'),
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

      const separator = '═'.repeat(80);
      const sectionSeparator = '─'.repeat(40);
      const bullet = '■';

      return `${separator}
${bullet} FILE INFORMATION
${sectionSeparator}
Original Path: ${safeContent.path}
Standardized Name: ${safeContent.standardizedName}
GitHub URL: ${safeContent.githubUrl}
Language: ${safeContent.language}
Role: ${safeContent.role}
Directory Context: ${safeContent.directoryContext}

${bullet} METADATA
${sectionSeparator}
Size: ${safeContent.metadata.size}
Created: ${safeContent.metadata.created}
Modified: ${safeContent.metadata.modified}
Generated At: ${safeContent.metadata.generatedAt}
Permissions: ${safeContent.metadata.permissions}

${bullet} ANALYSIS
${sectionSeparator}
Content Type: ${safeContent.contentType}
Dependencies: ${safeContent.dependencies.length > 0 ? 
  '\n' + safeContent.dependencies.map(dep => `  - ${dep}`).join('\n') : 
  'None'}

${bullet} FILE CONTENT
${sectionSeparator}
${safeContent.content}

${separator}\n\n`;
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
      return contents.map(content => this.formatContent(content)).join('');
    } catch (error) {
      console.error('Error in formatContentOutput:', error);
      return `Error formatting output: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}