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
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES,
    }
  });

  app.post("/api/analyze", upload.array('files'), async (req: Request, res: Response, next: NextFunction) => {
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
      next(error);
    }
  });

  app.get("/api/patterns", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patterns = getPatterns();
      res.json({ current: patterns });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/patterns", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patterns } = req.body;
      if (!patterns) {
        return res.status(400).json({ message: "Patterns are required" });
      }
      const updatedPatterns = updatePatterns(patterns);
      res.json({ current: updatedPatterns });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/patterns/reset", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const patterns = resetToDefaultPatterns();
      res.json({ current: patterns });
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware should be last
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return createServer(app);
}