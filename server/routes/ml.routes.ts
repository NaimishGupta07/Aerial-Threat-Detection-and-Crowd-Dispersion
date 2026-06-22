/**
 * ML Routes
 * 
 * Express routes that proxy ML prediction requests to the Python ML service.
 * 
 * These routes act as the API gateway, handling:
 * - Request validation
 * - Error handling and transformation
 * - Response formatting
 * - Status code mapping
 * 
 * Architecture: Client → Express Routes → ML Service → Express Routes → Client
 */

import { Router, Request, Response } from "express";
import { mlService, MLServiceError } from "../services/ml.service";

const router = Router();

/**
 * GET /api/ml/health
 * 
 * Health check endpoint that proxies to ML service.
 * Useful for monitoring and load balancer health checks.
 */
router.get("/ml/health", async (req: Request, res: Response) => {
  try {
    const health = await mlService.healthCheck();
    res.json(health);
  } catch (error) {
    const mlError = error as MLServiceError;
    res.status(mlError.statusCode || 503).json({
      status: "unhealthy",
      error: mlError.message,
      service_url: mlService.getServiceUrl(),
    });
  }
});

/**
 * POST /api/ml/visibility
 * 
 * Predict visibility/atmospheric conditions.
 * 
 * Request body:
 * {
 *   "time_of_day": number,      // 0.0-1.0
 *   "weather_code": number,      // 0-10
 *   "cloud_cover": number,       // 0.0-1.0
 *   "visibility_km": number,
 *   "humidity": number,          // 0.0-1.0
 *   "pressure_hpa": number,
 *   "wind_speed": number,
 *   "precipitation": number
 * }
 */
router.post("/ml/visibility", async (req: Request, res: Response) => {
  try {
    // Validate required fields
    const {
      time_of_day,
      weather_code,
      cloud_cover,
      visibility_km,
      humidity,
      pressure_hpa,
      wind_speed,
      precipitation,
    } = req.body;

    // Basic validation
    if (
      time_of_day === undefined ||
      weather_code === undefined ||
      cloud_cover === undefined ||
      visibility_km === undefined ||
      humidity === undefined ||
      pressure_hpa === undefined ||
      wind_speed === undefined ||
      precipitation === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields. Required: time_of_day, weather_code, cloud_cover, visibility_km, humidity, pressure_hpa, wind_speed, precipitation",
      });
    }

    // Call ML service
    const prediction = await mlService.predictVisibility({
      time_of_day,
      weather_code,
      cloud_cover,
      visibility_km,
      humidity,
      pressure_hpa,
      wind_speed,
      precipitation,
    });

    // Return success response
    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    const mlError = error as MLServiceError;

    // Log error for debugging (in production, use proper logging)
    console.error("[ML Routes] Visibility prediction error:", mlError.message);

    // Return appropriate HTTP status
    res.status(mlError.statusCode || 500).json({
      success: false,
      error: mlError.message,
      isTimeout: mlError.isTimeout,
      isConnectionError: mlError.isConnectionError,
    });
  }
});

/**
 * POST /api/ml/threat
 * 
 * Detect and classify aerial threats.
 * 
 * Request body:
 * {
 *   "features": [number, ...]  // Array of 12 feature values
 * }
 */
router.post("/ml/threat", async (req: Request, res: Response) => {
  try {
    const { features } = req.body;

    // Validate input
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: "Invalid input: 'features' must be an array",
      });
    }

    if (features.length !== 12) {
      return res.status(400).json({
        success: false,
        error: `Invalid input: 'features' must have 12 elements, got ${features.length}`,
      });
    }

    // Validate all elements are numbers
    if (!features.every((f: any) => typeof f === "number" && !isNaN(f))) {
      return res.status(400).json({
        success: false,
        error: "Invalid input: all feature values must be numbers",
      });
    }

    // Call ML service
    const prediction = await mlService.predictThreat(features);

    // Return success response
    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    const mlError = error as MLServiceError;

    // Log error for debugging
    console.error("[ML Routes] Threat prediction error:", mlError.message);

    // Return appropriate HTTP status
    res.status(mlError.statusCode || 500).json({
      success: false,
      error: mlError.message,
      isTimeout: mlError.isTimeout,
      isConnectionError: mlError.isConnectionError,
    });
  }
});

export default router;


