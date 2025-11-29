import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // GET /api/datasets - Get all threat datasets
  app.get("/api/datasets", async (req, res) => {
    try {
      const datasets = await storage.getAllDatasets();
      res.json(datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      res.status(500).json({ error: "Failed to fetch datasets" });
    }
  });

  // GET /api/datasets/:id - Get specific dataset
  app.get("/api/datasets/:id", async (req, res) => {
    try {
      const dataset = await storage.getDataset(req.params.id);
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      res.json(dataset);
    } catch (error) {
      console.error("Error fetching dataset:", error);
      res.status(500).json({ error: "Failed to fetch dataset" });
    }
  });

  // POST /api/analyze - Analyze uploaded image
  app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Simulate AI processing - in production, this would call actual ML models
      const simulateDetection = () => {
        const threatCount = Math.floor(Math.random() * 4); // 0-3 threats
        const crowdCount = Math.floor(Math.random() * 100) + 20; // 20-120 people
        const densityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        const density = densityOptions[Math.floor(Math.random() * densityOptions.length)];
        const status = threatCount > 1 ? "DANGER" : (threatCount > 0 ? "WARNING" : "SAFE");

        // Generate mock detections
        const detections = [];
        for (let i = 0; i < threatCount; i++) {
          detections.push({
            id: `detection-${Date.now()}-${i}`,
            type: Math.random() > 0.5 ? "drone" : "uav",
            confidence: 0.75 + Math.random() * 0.24,
            bbox: {
              x: Math.random() * 0.8,
              y: Math.random() * 0.8,
              width: 0.1 + Math.random() * 0.1,
              height: 0.1 + Math.random() * 0.1
            }
          });
        }

        return {
          threatCount,
          crowdCount,
          density,
          status,
          detections
        };
      };

      const analysis = simulateDetection();

      // Store analysis
      const savedAnalysis = await storage.createAnalysis({
        imageUrl: null, // Could store base64 or file path
        threatCount: analysis.threatCount,
        crowdCount: analysis.crowdCount,
        density: analysis.density,
        status: analysis.status,
        detections: analysis.detections,
      });

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // GET /api/analyses - Get recent analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const analyses = await storage.getAllAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // POST /api/geocode - Convert address to coordinates
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Mock geocoding - in production, use real geocoding API
      const mockGeocoding: Record<string, { lat: number; lng: number; display: string }> = {
        "times square": { lat: 40.7580, lng: -73.9855, display: "Times Square, NYC" },
        "central park": { lat: 40.7829, lng: -73.9654, display: "Central Park, NYC" },
        "kyiv": { lat: 50.4501, lng: 30.5234, display: "Kyiv, Ukraine" },
        "heathrow": { lat: 51.4700, lng: -0.4543, display: "London Heathrow Airport" },
        "london": { lat: 51.5074, lng: -0.1278, display: "London, UK" },
        "new york": { lat: 40.7128, lng: -74.0060, display: "New York, USA" },
      };

      const searchTerm = address.toLowerCase();
      const match = Object.keys(mockGeocoding).find(key => searchTerm.includes(key));

      if (match) {
        res.json(mockGeocoding[match]);
      } else {
        res.status(404).json({ error: "Location not found", suggestion: "Try 'Kyiv', 'Heathrow', or 'Times Square'" });
      }
    } catch (error) {
      console.error("Error geocoding:", error);
      res.status(500).json({ error: "Failed to geocode address" });
    }
  });

  return httpServer;
}
