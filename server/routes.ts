import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { analyzeGitHubRepo, downloadRepository } from "./services/github/index.js";
import { analyzeLocalFiles } from "./services/local/local-analyzer.js";
import { getPatterns, updatePatterns, resetToDefaultPatterns } from "./services/patterns.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_FILES = 1000; // Maximum number of files to process

export function registerRoutes(app: Express): Server {
  // Configure multer with limits
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES,
    }
  });

  // Helper function to handle errors
  const handleError = (error: any, res: Response) => {
    console.error('Error:', error);
    const statusCode = error.status || error.statusCode || 500;
    const message = error.message || "An unexpected error occurred";

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          message: `Too many files. Maximum is ${MAX_FILES} files`
        });
      }
    }

    res.status(statusCode).json({ message });
  };

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    handleError(err, res);
  });

  app.post("/api/analyze", upload.array('files'), async (req: Request, res: Response) => {
    try {
      const { sourceType, githubUrl, directoryPath } = req.body;
      console.log('Analyze request:', { sourceType, githubUrl, directoryPath });

      if (sourceType === 'github') {
        if (!githubUrl) {
          return res.status(400).json({ message: "GitHub URL is required" });
        }
        const result = await analyzeGitHubRepo(githubUrl, directoryPath);
        console.log('Analysis result:', result);
        return res.json(result);
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "Files are required for local analysis" });
      }

      // Check total size of all files
      const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > MAX_FILE_SIZE * 10) { // Allow up to 500MB total
        return res.status(413).json({
          message: "Total file size too large. Please select a smaller directory or fewer files."
        });
      }

      const result = await analyzeLocalFiles(req.files);
      console.log('Local analysis result:', result);
      return res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/download", upload.array('files'), async (req: Request, res: Response) => {
    try {
      const { sourceType, githubUrl, directoryPath } = req.body;

      if (sourceType === 'github') {
        if (!githubUrl) {
          return res.status(400).json({ message: "GitHub URL is required" });
        }
        const result = await downloadRepository(githubUrl, directoryPath);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send(result.content);
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "Files are required" });
      }

      const content = req.files.map(file => {
        return `// File: ${file.originalname}\n${file.buffer.toString('utf-8')}\n\n`;
      }).join('');

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="local_files.txt"');
      return res.send(content);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/patterns", (req: Request, res: Response) => {
    try {
      const patterns = getPatterns();
      res.json({ current: patterns });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/patterns", (req: Request, res: Response) => {
    try {
      const { patterns } = req.body;
      if (!patterns) {
        return res.status(400).json({ message: "Patterns are required" });
      }
      const updatedPatterns = updatePatterns(patterns);
      res.json({ current: updatedPatterns });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/patterns/reset", (_req: Request, res: Response) => {
    try {
      const patterns = resetToDefaultPatterns();
      res.json({ current: patterns });
    } catch (error) {
      handleError(error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}