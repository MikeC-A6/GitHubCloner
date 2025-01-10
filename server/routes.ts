import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeGitHubRepo, downloadRepository } from "./services/github/index.js";
import { getPatterns, updatePatterns, resetToDefaultPatterns } from "./services/patterns.js";

export function registerRoutes(app: Express): Server {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { githubUrl, directoryPath } = req.body;
      if (!githubUrl) {
        return res.status(400).json({ message: "GitHub URL is required" });
      }
      const result = await analyzeGitHubRepo(githubUrl, directoryPath);
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      const statusCode = error.status || error.statusCode || 500;
      const message = error.message || "Failed to analyze repository";
      res.status(statusCode).json({ message });
    }
  });

  app.post("/api/download", async (req, res) => {
    try {
      const { githubUrl, directoryPath } = req.body;
      if (!githubUrl) {
        return res.status(400).json({ message: "GitHub URL is required" });
      }
      const content = await downloadRepository(githubUrl, directoryPath);

      // Extract repository name from GitHub URL
      const repoName = githubUrl.split('/').pop()?.replace('.git', '') || 'repository';

      // Generate standardized filename with repository context
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `${repoName}-content_${date}.txt`;

      // Set proper headers for text file download
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
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