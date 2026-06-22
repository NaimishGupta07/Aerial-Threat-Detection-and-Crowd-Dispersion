import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Vite middleware for static assets and HMR
  // CRITICAL: Skip API routes - they must be handled by Express routes only
  // This middleware runs AFTER Express routes are registered, so API routes
  // will have already been handled by Express if they match
  app.use((req, res, next) => {
    // Skip Vite middleware for API routes - let Express handle them
    // This check ensures API routes return JSON, not HTML
    if (req.url?.startsWith("/api")) {
      return next();
    }
    // For non-API routes, use Vite middleware (handles HMR, static assets)
    vite.middlewares(req, res, next);
  });

  // Catch-all route for frontend SPA routing
  // CRITICAL: Must also skip API routes to prevent returning HTML for API calls
  // This ensures /api/* routes that don't match Express routes return 404 JSON, not HTML
  app.use("*", async (req, res, next) => {
    // Normalize URL to handle cases with trailing whitespace/newlines
    // Decode URL-encoded characters like %0A (newline)
    let normalizedUrl: string;
    try {
      const rawUrl = (req.originalUrl?.trim() || req.url?.trim() || "").replace(/\s+$/, "");
      normalizedUrl = decodeURIComponent(rawUrl);
    } catch (e) {
      // If decoding fails, just use trimmed version
      normalizedUrl = (req.originalUrl?.trim() || req.url?.trim() || "").replace(/\s+$/, "");
    }
    
    // Skip API routes - if we reach here for an API route, it means Express
    // didn't handle it (404), but we still shouldn't return HTML
    if (normalizedUrl.startsWith("/api")) {
      // API route not found - return JSON 404, not HTML
      // Log for debugging to help identify routing issues
      console.warn(`[Vite] API route not matched: ${normalizedUrl} (method: ${req.method})`);
      console.warn(`[Vite] Original URL: ${req.originalUrl}, Normalized: ${normalizedUrl}`);
      return res.status(404).json({
        error: "API endpoint not found",
        path: normalizedUrl,
        method: req.method,
        hint: "Check for trailing whitespace or newlines in the URL",
      });
    }

    // For non-API routes, serve the frontend SPA
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
