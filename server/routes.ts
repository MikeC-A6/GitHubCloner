import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeGitHubRepo } from "./services/github.js";
import { getPatterns, updatePatterns, resetToDefaultPatterns } from "./services/patterns.js";

export function registerRoutes(app: Express): Server {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { githubUrl, directoryPath } = req.body;
      const result = await analyzeGitHubRepo(githubUrl, directoryPath);
      res.json(result);
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.get("/api/patterns", (req, res) => {
    const patterns = getPatterns();
    res.json({ current: patterns });
  });

  app.post("/api/patterns", (req, res) => {
    try {
      const { patterns } = req.body;
      const updatedPatterns = updatePatterns(patterns);
      res.json({ current: updatedPatterns });
    } catch (error: any) {
      res.status(400).send(error.message);
    }
  });

  app.post("/api/patterns/reset", (req, res) => {
    const patterns = resetToDefaultPatterns();
    res.json({ current: patterns });
  });

  const httpServer = createServer(app);
  return httpServer;
}