import { IContentManager, IContentFormatter } from './interfaces/content-manager';
import { IContentProcessor } from './interfaces/content-processor';
import { FileContent } from './interfaces';
import { ContentProcessor } from './content-processor';

export class ContentManager implements IContentManager, IContentFormatter {
  private readonly contentProcessor: IContentProcessor;

  constructor(contentProcessor?: IContentProcessor) {
    this.contentProcessor = contentProcessor || new ContentProcessor();
  }

  async getFileContents(files: string[], basePath: string, repoUrl: string): Promise<FileContent[]> {
    return Promise.all(
      files.map(async (file: string) => 
        this.contentProcessor.processFile(file, basePath, repoUrl)
          .catch((error: Error) => ({
            path: file,
            content: `Error processing file: ${error.message}`,
            githubUrl: '',
            metadata: { size: '0 KB', created: '', modified: '', permissions: '' },
            language: 'unknown',
            role: 'unknown',
            directoryContext: '',
            dependencies: [],
            contentType: 'error'
          }))
      )
    );
  }

  formatContent(content: FileContent): string {
    return `File: ${content.path}
GitHub URL: ${content.githubUrl}
Language: ${content.language}
Role: ${content.role}
Directory Context: ${content.directoryContext}
Dependencies: ${content.dependencies.join(', ')}
Metadata: ${JSON.stringify(content.metadata, null, 2)}
Content Type: ${content.contentType}
${'='.repeat(content.path.length + 6)}
${content.content}\n\n`;
  }

  formatContentOutput(contents: FileContent[]): string {
    return contents.map(content => this.formatContent(content)).join('\n');
  }
}