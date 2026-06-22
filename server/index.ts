import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import threatRoutes from "./routes/threat.routes";
import crowdRoutes from "./routes/crowd.routes";
import mlRoutes from "./routes/ml.routes";

const app = express();
const httpServer = createServer(app);
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  // Normalize URL by trimming whitespace and newlines
  // This handles cases where clients accidentally include trailing newlines (%0A)
  // CRITICAL: This must happen BEFORE routes try to match, otherwise routes won't match
  try {
    if (req.url) {
      const trimmed = req.url.trim();
      // Decode URL-encoded characters, but handle decode errors gracefully
      req.url = decodeURIComponent(trimmed);
    }
    if (req.originalUrl) {
      const trimmed = req.originalUrl.trim();
      req.originalUrl = decodeURIComponent(trimmed);
    }
    // Note: req.path is derived from req.url, so it will be normalized automatically
  } catch (e) {
    // If URL decoding fails, just trim (malformed URL, but don't crash)
    if (req.url) req.url = req.url.trim();
    if (req.originalUrl) req.originalUrl = req.originalUrl.trim();
  }

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});
// Register API routes BEFORE Vite middleware
// CRITICAL: Express routes must be registered first so they handle /api/* requests
// before Vite's catch-all route can intercept them
app.use("/api", threatRoutes);
app.use("/api", crowdRoutes);
app.use("/api", mlRoutes);

// Debug: Log registered routes in development
if (process.env.NODE_ENV === "development") {
  console.log("✓ Registered API routes:");
  console.log("  - POST /api/threat-detect");
  console.log("  - GET /api/ml/health");
  console.log("  - POST /api/ml/visibility");
  console.log("  - POST /api/ml/threat");
}

console.log("⏳ Starting server...");
(async () => {
  console.log("⏳ registerRoutes starting...");
  await registerRoutes(httpServer, app);
  console.log("✔ registerRoutes completed");

  // Error handler - returns JSON for all errors (appropriate for API routes)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup frontend serving (Vite dev server or static files)
  // This runs AFTER API routes are registered, ensuring API routes take precedence
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    console.log("setupVite starting...");
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    console.log("✔ setupVite completed");
  }
  // index.ts (inside the same file, after setupVite)
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, () => {
    log(`Server running on http://localhost:${port}`);
  });
})();
