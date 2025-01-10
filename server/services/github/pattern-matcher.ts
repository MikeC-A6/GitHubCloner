import { minimatch } from 'minimatch';
import path from 'path';

export class PatternMatcher {
  filterFiles(files: string[], patterns: string[]): string[] {
    return files.filter(file => {
      const normalizedFile = file.replace(/\\/g, '/');
      return !patterns.some(pattern => this.matchesPattern(normalizedFile, pattern));
    });
  }

  private matchesPattern(file: string, pattern: string): boolean {
    const matchOptions = {
      dot: true,
      matchBase: !pattern.includes('/'),
      nocase: true,
    };

    const processedPattern = pattern.endsWith('/') ? pattern + '**' : pattern;
    return minimatch(file, processedPattern, matchOptions);
  }

  generateIgnoreSuggestions(files: string[]): string[] {
    const suggestions = new Set<string>();
    const patterns = {
      nodeModules: /^node_modules\//,
      buildDirs: /^(dist|build|out)\//,
      logs: /\.(log|txt)$/,
      coverage: /^coverage\//,
      envFiles: /\.env/,
      ideaFiles: /^\.idea\//,
      vscodeFiles: /^\.vscode\//,
      cacheFiles: /^\.cache\//,
      testFiles: /\.(test|spec)\.(js|ts|jsx|tsx)$/,
    };

    for (const file of files) {
      for (const [, pattern] of Object.entries(patterns)) {
        if (pattern.test(file)) {
          suggestions.add(pattern.source.replace(/\\/g, ''));
        }
      }
    }

    return Array.from(suggestions);
  }
}
