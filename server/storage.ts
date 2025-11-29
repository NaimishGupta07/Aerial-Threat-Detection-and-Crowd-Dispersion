import { 
  type User, 
  type InsertUser, 
  type Analysis, 
  type InsertAnalysis,
  type ThreatDataset,
  type InsertThreatDataset
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAllAnalyses(limit?: number): Promise<Analysis[]>;
  
  // Dataset methods
  getAllDatasets(): Promise<ThreatDataset[]>;
  getDataset(id: string): Promise<ThreatDataset | undefined>;
  createDataset(dataset: InsertThreatDataset): Promise<ThreatDataset>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: Map<string, Analysis>;
  private datasets: Map<string, ThreatDataset>;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.datasets = new Map();
    this.seedDatasets();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Analysis methods
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = {
      imageUrl: insertAnalysis.imageUrl ?? null,
      threatCount: insertAnalysis.threatCount,
      crowdCount: insertAnalysis.crowdCount,
      density: insertAnalysis.density,
      status: insertAnalysis.status,
      detections: insertAnalysis.detections ?? null,
      id,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAllAnalyses(limit: number = 10): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Dataset methods
  async getAllDatasets(): Promise<ThreatDataset[]> {
    return Array.from(this.datasets.values());
  }

  async getDataset(id: string): Promise<ThreatDataset | undefined> {
    return this.datasets.get(id);
  }

  async createDataset(insertDataset: InsertThreatDataset): Promise<ThreatDataset> {
    const dataset: ThreatDataset = {
      ...insertDataset,
      createdAt: new Date(),
    };
    this.datasets.set(dataset.id, dataset);
    return dataset;
  }

  // Seed initial datasets
  private seedDatasets() {
    const seedData: InsertThreatDataset[] = [
      {
        id: "ukr-conflict-2024",
        name: "Conflict Zone UAV Logs (2024)",
        description: "Aggregated radar and optical tracking data from Sector 7 conflict zone.",
        latitude: 50.4501,
        longitude: 30.5234,
        threats: [
          { id: "t-01", lat: 50.4521, lng: 30.5254, type: "uav", confidence: 0.99, altitude: 120, velocity: 45, timestamp: "14:20:01", source: "RADAR-X" },
          { id: "t-02", lat: 50.4481, lng: 30.5214, type: "drone", confidence: 0.95, altitude: 80, velocity: 12, timestamp: "14:20:05", source: "OPTICAL-2" },
          { id: "t-03", lat: 50.4551, lng: 30.5194, type: "uav", confidence: 0.98, altitude: 250, velocity: 60, timestamp: "14:20:12", source: "RF-SCAN" },
          { id: "t-04", lat: 50.4505, lng: 30.5284, type: "bird", confidence: 0.45, altitude: 30, velocity: 15, timestamp: "14:20:15", source: "OPTICAL-1" },
          { id: "t-05", lat: 50.4461, lng: 30.5201, type: "drone", confidence: 0.88, altitude: 50, velocity: 10, timestamp: "14:20:22", source: "CROWD-REPORT" },
        ],
        crowdStats: [
          { time: '14:00', density: 45, panic: 10 },
          { time: '14:05', density: 48, panic: 12 },
          { time: '14:10', density: 52, panic: 15 },
          { time: '14:15', density: 55, panic: 18 },
          { time: '14:20', density: 60, panic: 25 },
          { time: '14:25', density: 58, panic: 22 },
        ],
        classificationStats: [
          { name: 'Orlan-10', count: 15, risk: 90 },
          { name: 'DJI Mavic', count: 42, risk: 60 },
          { name: 'Shahed', count: 8, risk: 95 },
          { name: 'Biological', count: 125, risk: 5 },
        ]
      },
      {
        id: "lhr-airport-2023",
        name: "Heathrow Incursion Data (2023)",
        description: "Historical restricted airspace incursion incidents near LHR.",
        latitude: 51.4700,
        longitude: -0.4543,
        threats: [
          { id: "lhr-01", lat: 51.4720, lng: -0.4523, type: "drone", confidence: 0.92, altitude: 45, velocity: 0, timestamp: "09:15:00", source: "TOWER-VISUAL" },
          { id: "lhr-02", lat: 51.4680, lng: -0.4563, type: "drone", confidence: 0.89, altitude: 60, velocity: 5, timestamp: "09:18:22", source: "DJI-SCOPE" },
          { id: "lhr-03", lat: 51.4750, lng: -0.4500, type: "aircraft", confidence: 0.99, altitude: 800, velocity: 250, timestamp: "09:20:00", source: "ADS-B" },
        ],
        crowdStats: [
          { time: '09:00', density: 80, panic: 5 },
          { time: '09:10', density: 82, panic: 5 },
          { time: '09:20', density: 85, panic: 8 },
          { time: '09:30', density: 81, panic: 6 },
        ],
        classificationStats: [
          { name: 'Rec Drone', count: 5, risk: 75 },
          { name: 'Commercial', count: 120, risk: 0 },
          { name: 'Bird Strike', count: 2, risk: 40 },
          { name: 'Unknown', count: 1, risk: 50 },
        ]
      },
      {
        id: "nyc-times-square",
        name: "NYC Urban Dense Environment",
        description: "Simulated dense urban environment with high occlusion and noise.",
        latitude: 40.7580,
        longitude: -73.9855,
        threats: [
          { id: "nyc-01", lat: 40.7585, lng: -73.9850, type: "drone", confidence: 0.75, altitude: 120, velocity: 15, timestamp: "22:00:00", source: "CCTV-NET" },
          { id: "nyc-02", lat: 40.7575, lng: -73.9860, type: "drone", confidence: 0.82, altitude: 90, velocity: 10, timestamp: "22:05:00", source: "CCTV-NET" },
          { id: "nyc-03", lat: 40.7590, lng: -73.9840, type: "bird", confidence: 0.60, altitude: 50, velocity: 20, timestamp: "22:10:00", source: "THERMAL" },
        ],
        crowdStats: [
          { time: '22:00', density: 95, panic: 10 },
          { time: '22:05', density: 98, panic: 15 },
          { time: '22:10', density: 92, panic: 12 },
          { time: '22:15', density: 96, panic: 14 },
        ],
        classificationStats: [
          { name: 'Delivery', count: 12, risk: 10 },
          { name: 'Unauthorized', count: 3, risk: 60 },
          { name: 'Police', count: 2, risk: 0 },
          { name: 'News', count: 1, risk: 5 },
        ]
      }
    ];

    seedData.forEach(dataset => {
      this.datasets.set(dataset.id, { ...dataset, createdAt: new Date() });
    });
  }
}

export const storage = new MemStorage();
