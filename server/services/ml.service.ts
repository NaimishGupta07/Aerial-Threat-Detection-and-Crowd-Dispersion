/**
 * ML Service Layer
 * 
 * This service acts as a client to the Python ML microservice.
 * It handles all communication with the ML service, including:
 * - HTTP requests to FastAPI endpoints
 * - Error handling and retries
 * - Request/response transformation
 * - Timeout management
 * 
 * Architecture: Client → Express → Python ML Service → Express → Client
 * 
 * Why separate service layer? This keeps route handlers clean and makes
 * ML service calls testable and reusable across different endpoints.
 */

// Using native fetch (Node 18+) - alternatively can use axios with better error handling
// To use axios: npm install axios and replace fetch calls with axios

// Configuration - use environment variable for flexibility
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || "10000", 10); // 10 seconds default

/**
 * Response types for ML predictions
 */
export interface VisibilityPrediction {
  visibility_class: "poor" | "moderate" | "clear";
  confidence: number;
  probabilities: {
    poor: number;
    moderate: number;
    clear: number;
  };
  model_loaded: boolean;
  recommendation: string;
}

export interface ThreatPrediction {
  threat_detected: boolean;
  threat_class: string;
  threat_score: number;
  confidence: number;
  class_probabilities: {
    background: number;
    drone: number;
    uav: number;
    aircraft: number;
    bird: number;
    unknown: number;
  };
  model_loaded: boolean;
  severity: "none" | "low" | "medium" | "high" | "critical";
  recommendation: string;
}

export interface MLServiceError {
  message: string;
  statusCode: number;
  isTimeout: boolean;
  isConnectionError: boolean;
}

/**
 * ML Service Client
 * 
 * Singleton instance that manages HTTP communication with the ML service.
 * Uses native fetch API (Node 18+) with proper timeout and error handling.
 * 
 * Note: For production, consider using axios for better error handling:
 * npm install axios
 */
class MLService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = ML_SERVICE_URL;
    this.timeout = ML_SERVICE_TIMEOUT;
  }

  /**
   * Make HTTP request with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw this.handleError({
          type: "timeout",
          message: "Request timed out",
        } as any);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Handle and transform fetch errors into application errors
   */
  private handleError(error: any): MLServiceError {
    // Timeout error
    if (error.type === "timeout" || error.message?.includes("timeout")) {
      return {
        message: "ML service request timed out",
        statusCode: 504,
        isTimeout: true,
        isConnectionError: false,
      };
    }

    // Connection error
    if (
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("ENOTFOUND") ||
      error.code === "ECONNREFUSED"
    ) {
      return {
        message: "ML service unavailable - connection refused",
        statusCode: 503,
        isTimeout: false,
        isConnectionError: true,
      };
    }

    // HTTP error (handled in response)
    return {
      message: error.message || "Unknown ML service error",
      statusCode: error.statusCode || 500,
      isTimeout: false,
      isConnectionError: false,
    };
  }

  /**
   * Check ML service health
   * 
   * Used for monitoring and graceful degradation.
   */
  async healthCheck(): Promise<{ status: string; models: Record<string, any> }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/health`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw {
          statusCode: response.status,
          message: error.detail || "Health check failed",
        };
      }
      return await response.json();
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      const mlError = this.handleError(error);
      throw mlError;
    }
  }

  /**
   * Predict visibility/atmospheric conditions
   * 
   * @param input Visibility prediction input parameters
   * @returns Visibility prediction results
   */
  async predictVisibility(input: {
    time_of_day: number;
    weather_code: number;
    cloud_cover: number;
    visibility_km: number;
    humidity: number;
    pressure_hpa: number;
    wind_speed: number;
    precipitation: number;
  }): Promise<VisibilityPrediction> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/predict/visibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw {
          statusCode: response.status,
          message: error.detail || "Visibility prediction failed",
        };
      }

      return await response.json();
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      const mlError = this.handleError(error);
      throw mlError;
    }
  }

  /**
   * Detect and classify aerial threats
   * 
   * @param features Array of 12 feature values for threat detection
   * @returns Threat detection results
   */
  async predictThreat(features: number[]): Promise<ThreatPrediction> {
    // Validate input
    if (!Array.isArray(features) || features.length !== 12) {
      throw {
        message: "Invalid input: features must be an array of 12 numbers",
        statusCode: 400,
        isTimeout: false,
        isConnectionError: false,
      } as MLServiceError;
    }

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/predict/threat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw {
          statusCode: response.status,
          message: error.detail || "Threat prediction failed",
        };
      }

      return await response.json();
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      const mlError = this.handleError(error);
      throw mlError;
    }
  }
  /**
 * Get real-time YOLO detections (NEW)
 */
  async getDetections(): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/detect`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw {
          statusCode: response.status,
          message: error.detail || "Detection failed",
        };
      }

      return await response.json();
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      const mlError = this.handleError(error);
      throw mlError;
    }
  }

  /**
   * Get service URL (useful for debugging)
   */
  getServiceUrl(): string {
    return ML_SERVICE_URL;
  }
}

// Export singleton instance
export const mlService = new MLService();

