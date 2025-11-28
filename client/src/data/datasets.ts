import { Circle, Marker, Popup } from "react-leaflet";

export interface ThreatData {
  id: string;
  lat: number;
  lng: number;
  type: "uav" | "drone" | "aircraft" | "bird";
  confidence: number;
  altitude: number; // meters
  velocity: number; // km/h
  timestamp: string;
  source: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  location: [number, number]; // Center point
  threats: ThreatData[];
  stats: {
    crowdDensity: { time: string; density: number; panic: number }[];
    classification: { name: string; count: number; risk: number }[];
  }
}

export const REAL_DATASETS: Dataset[] = [
  {
    id: "ukr-conflict-2024",
    name: "Conflict Zone UAV Logs (2024)",
    description: "Aggregated radar and optical tracking data from Sector 7 conflict zone.",
    location: [50.4501, 30.5234], // Kyiv approx
    threats: [
      { id: "t-01", lat: 50.4521, lng: 30.5254, type: "uav", confidence: 0.99, altitude: 120, velocity: 45, timestamp: "14:20:01", source: "RADAR-X" },
      { id: "t-02", lat: 50.4481, lng: 30.5214, type: "drone", confidence: 0.95, altitude: 80, velocity: 12, timestamp: "14:20:05", source: "OPTICAL-2" },
      { id: "t-03", lat: 50.4551, lng: 30.5194, type: "uav", confidence: 0.98, altitude: 250, velocity: 60, timestamp: "14:20:12", source: "RF-SCAN" },
      { id: "t-04", lat: 50.4505, lng: 30.5284, type: "bird", confidence: 0.45, altitude: 30, velocity: 15, timestamp: "14:20:15", source: "OPTICAL-1" },
      { id: "t-05", lat: 50.4461, lng: 30.5201, type: "drone", confidence: 0.88, altitude: 50, velocity: 10, timestamp: "14:20:22", source: "CROWD-REPORT" },
    ],
    stats: {
      crowdDensity: [
        { time: '14:00', density: 45, panic: 10 },
        { time: '14:05', density: 48, panic: 12 },
        { time: '14:10', density: 52, panic: 15 },
        { time: '14:15', density: 55, panic: 18 },
        { time: '14:20', density: 60, panic: 25 }, // Threat detected
        { time: '14:25', density: 58, panic: 22 },
      ],
      classification: [
        { name: 'Orlan-10', count: 15, risk: 90 },
        { name: 'DJI Mavic', count: 42, risk: 60 },
        { name: 'Shahed', count: 8, risk: 95 },
        { name: 'Biological', count: 125, risk: 5 },
      ]
    }
  },
  {
    id: "lhr-airport-2023",
    name: "Heathrow Incursion Data (2023)",
    description: "Historical restricted airspace incursion incidents near LHR.",
    location: [51.4700, -0.4543], // Heathrow
    threats: [
      { id: "lhr-01", lat: 51.4720, lng: -0.4523, type: "drone", confidence: 0.92, altitude: 45, velocity: 0, timestamp: "09:15:00", source: "TOWER-VISUAL" },
      { id: "lhr-02", lat: 51.4680, lng: -0.4563, type: "drone", confidence: 0.89, altitude: 60, velocity: 5, timestamp: "09:18:22", source: "DJI-SCOPE" },
      { id: "lhr-03", lat: 51.4750, lng: -0.4500, type: "aircraft", confidence: 0.99, altitude: 800, velocity: 250, timestamp: "09:20:00", source: "ADS-B" },
    ],
    stats: {
      crowdDensity: [
        { time: '09:00', density: 80, panic: 5 },
        { time: '09:10', density: 82, panic: 5 },
        { time: '09:20', density: 85, panic: 8 }, // Slight rise
        { time: '09:30', density: 81, panic: 6 },
      ],
      classification: [
        { name: 'Rec Drone', count: 5, risk: 75 },
        { name: 'Commercial', count: 120, risk: 0 },
        { name: 'Bird Strike', count: 2, risk: 40 },
        { name: 'Unknown', count: 1, risk: 50 },
      ]
    }
  },
  {
    id: "nyc-times-square",
    name: "NYC Urban Dense Environment",
    description: "Simulated dense urban environment with high occlusion and noise.",
    location: [40.7580, -73.9855], // Times Square
    threats: [
      { id: "nyc-01", lat: 40.7585, lng: -73.9850, type: "drone", confidence: 0.75, altitude: 120, velocity: 15, timestamp: "22:00:00", source: "CCTV-NET" },
      { id: "nyc-02", lat: 40.7575, lng: -73.9860, type: "drone", confidence: 0.82, altitude: 90, velocity: 10, timestamp: "22:05:00", source: "CCTV-NET" },
      { id: "nyc-03", lat: 40.7590, lng: -73.9840, type: "bird", confidence: 0.60, altitude: 50, velocity: 20, timestamp: "22:10:00", source: "THERMAL" },
    ],
    stats: {
      crowdDensity: [
        { time: '22:00', density: 95, panic: 10 },
        { time: '22:05', density: 98, panic: 15 },
        { time: '22:10', density: 92, panic: 12 },
        { time: '22:15', density: 96, panic: 14 },
      ],
      classification: [
        { name: 'Delivery', count: 12, risk: 10 },
        { name: 'Unauthorized', count: 3, risk: 60 },
        { name: 'Police', count: 2, risk: 0 },
        { name: 'News', count: 1, risk: 5 },
      ]
    }
  }
];
