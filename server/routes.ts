import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
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

  app.post("/api/analyze", upload.array('files'), async (req, res) => {
    try {
      const { sourceType, githubUrl, directoryPath } = req.body;

      if (sourceType === 'github') {
        if (!githubUrl) {
          return res.status(400).json({ message: "GitHub URL is required" });
        }
        const result = await analyzeGitHubRepo(githubUrl, directoryPath);
        res.json(result);
      } else {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "Files are required" });
        }

        // Check total size of all files
        const totalSize = (req.files as Express.Multer.File[]).reduce((acc, file) => acc + file.size, 0);
        if (totalSize > MAX_FILE_SIZE * 10) { // Allow up to 500MB total
          return res.status(413).json({ 
            message: "Total file size too large. Please select a smaller directory or fewer files." 
          });
        }

        const result = await analyzeLocalFiles(req.files as Express.Multer.File[]);
        res.json(result);
      }
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      const statusCode = error.status || error.statusCode || 500;
      let message = error.message || "Failed to analyze repository";

      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          message = `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
          return res.status(413).json({ message });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          message = `Too many files. Maximum is ${MAX_FILES} files`;
          return res.status(413).json({ message });
        }
      }

      res.status(statusCode).json({ message });
    }
  });

  app.post("/api/download", upload.array('files'), async (req, res) => {
    try {
      const { sourceType, githubUrl, directoryPath } = req.body;

      if (sourceType === 'github') {
        if (!githubUrl) {
          return res.status(400).json({ message: "GitHub URL is required" });
        }
        const result = await downloadRepository(githubUrl, directoryPath);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.content);
      } else {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "Files are required" });
        }
        const files = req.files as Express.Multer.File[];
        const content = files.map(file => {
          return `// File: ${file.originalname}\n${file.buffer.toString('utf-8')}\n\n`;
        }).join('');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="local_files.txt"');
        res.send(content);
      }
    } catch (error: any) {
      console.error('Error downloading repository:', error);
      const statusCode = error.status || error.statusCode || 500;
      const message = error.message || "Failed to download repository";
      res.status(statusCode).json({ message });
    }
  });

  app.get("/api/patterns", (req, res) => {
    try {
      const patterns = getPatterns();
      res.json({ current: patterns });
    } catch (error: any) {
      console.error('Error getting patterns:', error);
      res.status(500).json({ message: "Failed to get patterns" });
    }
  });

  app.post("/api/patterns", (req, res) => {
    try {
      const { patterns } = req.body;
      if (!patterns) {
        return res.status(400).json({ message: "Patterns are required" });
      }
      const updatedPatterns = updatePatterns(patterns);
      res.json({ current: updatedPatterns });
    } catch (error: any) {
      console.error('Error updating patterns:', error);
      res.status(500).json({ message: "Failed to update patterns" });
    }
  });

  app.post("/api/patterns/reset", (_req, res) => {
    try {
      const patterns = resetToDefaultPatterns();
      res.json({ current: patterns });
    } catch (error: any) {
      console.error('Error resetting patterns:', error);
      res.status(500).json({ message: "Failed to reset patterns" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}