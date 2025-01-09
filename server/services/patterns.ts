const DEFAULT_PATTERNS = [
  // Git
  ".git/**", 
  ".gitignore",
  ".gitattributes",
  ".gitmodules",
  // Python
  "*.pyc",
  "*.pyo",
  "*.pyd",
  "__pycache__",
  ".pytest_cache",
  ".coverage",
  ".tox",
  ".nox",
  ".mypy_cache",
  ".ruff_cache",
  ".hypothesis",
  "poetry.lock",
  "Pipfile.lock",
  // JavaScript/Node
  "node_modules/**", 
  "bower_components",
  "package-lock.json",
  "yarn.lock",
  ".npm",
  ".yarn",
  ".pnpm-store",
  // Java
  "*.class",
  "*.jar",
  "*.war",
  "*.ear",
  "*.nar",
  "target/",
  ".gradle/",
  "build/",
  ".settings/",
  ".project",
  ".classpath",
  "gradle-app.setting",
  "*.gradle",
  // C/C++
  "*.o",
  "*.obj",
  "*.so",
  "*.dll",
  "*.dylib",
  "*.exe",
  "*.lib",
  "*.out",
  "*.a",
  "*.pdb",
  // Swift/Xcode
  ".build/",
  "*.xcodeproj/",
  "*.xcworkspace/",
  "*.pbxuser",
  "*.mode1v3",
  "*.mode2v3",
  "*.perspectivev3",
  "*.xcuserstate",
  "xcuserdata/",
  ".swiftpm/",
  // Ruby
  "*.gem",
  ".bundle/",
  "vendor/bundle",
  "Gemfile.lock",
  ".ruby-version",
  ".ruby-gemset",
  ".rvmrc",
  // Rust
  "target/",
  "Cargo.lock",
  "**/*.rs.bk",
  // Go
  "bin/",
  "pkg/",
  // .NET/C#
  "bin/",
  "obj/",
  "*.suo",
  "*.user",
  "*.userosscache",
  "*.sln.docstates",
  "packages/",
  "*.nupkg",
  // Version control
  ".svn",
  ".hg",
  // Images and media
  "*.svg",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.ico",
  "*.pdf",
  "*.mov",
  "*.mp4",
  "*.mp3",
  "*.wav",
  // Virtual environments
  "venv",
  ".venv",
  "env",
  ".env",
  "virtualenv",
  // IDEs and editors
  ".idea",
  ".vscode",
  ".vs",
  "*.swp",
  "*.swo",
  "*.swn",
  ".settings",
  ".project",
  ".classpath",
  "*.sublime-*",
  // Temporary and cache files
  "*.log",
  "*.bak",
  "*.swp",
  "*.tmp",
  "*.temp",
  ".cache",
  ".sass-cache",
  ".eslintcache",
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  // Build directories and artifacts
  "build",
  "dist",
  "target",
  "out",
  "*.egg-info",
  "*.egg",
  "*.whl",
  // Documentation
  "site-packages",
  ".docusaurus",
  ".next",
  ".nuxt",
  // Other patterns
  "*.min.js",
  "*.min.css",
  "*.map",
  ".terraform",
  "*.tfstate*",
  "vendor/",
];

let currentPatterns = [...DEFAULT_PATTERNS];

export function getPatterns(): string[] {
  return currentPatterns;
}

export function updatePatterns(newPatterns: string): string[] {
  if (!newPatterns.trim()) {
    return currentPatterns;
  }

  const patterns = newPatterns
    .split("\n")
    .map(p => p.trim())
    .filter(p => p && !p.startsWith("#"));

  // Ensure directory patterns end with /** if they don't have a wildcard
  const processedPatterns = patterns.map(pattern => {
    if (pattern.endsWith('/') && !pattern.includes('*')) {
      return pattern + '**';
    }
    return pattern;
  });

  currentPatterns = Array.from(new Set([...currentPatterns, ...processedPatterns]));
  return currentPatterns;
}

export function resetToDefaultPatterns(): string[] {
  currentPatterns = [...DEFAULT_PATTERNS];
  return currentPatterns;
}