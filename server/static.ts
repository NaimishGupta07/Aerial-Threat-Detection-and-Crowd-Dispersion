import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html for frontend routes
  // CRITICAL: Skip API routes - they should return JSON 404, not HTML
  // This ensures consistency between dev and production
  app.use("*", (req, res) => {
    // If this is an API route that wasn't handled, return JSON 404
    if (req.originalUrl?.startsWith("/api")) {
      return res.status(404).json({
        error: "API endpoint not found",
        path: req.originalUrl,
      });
    }
    // For frontend routes, serve the SPA
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
