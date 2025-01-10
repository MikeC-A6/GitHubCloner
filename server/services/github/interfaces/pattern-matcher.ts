import { minimatch } from 'minimatch';

export interface IPatternMatcher {
  matches(file: string, pattern: string): boolean;
  filterFiles(files: string[], patterns: string[]): string[];
  generateIgnoreSuggestions(files: string[]): string[];
}

export interface IPatternValidator {
  validatePattern(pattern: string): boolean;
}
