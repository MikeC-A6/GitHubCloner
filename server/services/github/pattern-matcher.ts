import { minimatch } from 'minimatch';
import type { IPatternMatcher, IPatternValidator } from './interfaces';

export class PatternMatcher implements IPatternMatcher, IPatternValidator {
  matches(file: string, pattern: string): boolean {
    const normalizedFile = file.replace(/\\/g, '/');
    const matchOptions = {
      dot: true,
      matchBase: !pattern.includes('/'),
      nocase: true,
    };

    const processedPattern = pattern.endsWith('/') ? pattern + '**' : pattern;
    return minimatch(normalizedFile, processedPattern, matchOptions);
  }

  filterFiles(files: string[], patterns: string[]): string[] {
    return files.filter(file => !patterns.some(pattern => this.matches(file, pattern)));
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

  validatePattern(pattern: string): boolean {
    try {
      minimatch('test', pattern);
      return true;
    } catch {
      return false;
    }
  }
}