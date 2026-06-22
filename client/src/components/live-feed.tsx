import { useEffect, useMemo, useState } from "react";
import { Crosshair, AlertTriangle, Target, Scan } from "lucide-react";
import { motion } from "framer-motion";

interface Detection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: "threat" | "neutral";
}

interface AirTrack {
  id: string;
  label: string;
  x: number;
  y: number;
  status: "engaged" | "tracking" | "clear";
  threat: "threat" | "neutral";
  speed: number; // knots
  altitude: number; // ft
}

const FRAME_SOURCES = [
  {
    id: "drone-thermal",
    label: "UAV THERMAL FEED",
    src: "https://images.unsplash.com/photo-1508614999368-9260051291ea?auto=format&fit=crop&w=1600&q=80", // drone close-up
    detections: [
      { label: "UAV", x: 42, y: 30, width: 18, height: 12, type: "threat" },
    ],
  },
  {
    id: "drone-optical",
    label: "DRONE OPTICAL FEED",
    src: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1600&q=80", // drone in flight
    detections: [
      { label: "DRONE", x: 58, y: 24, width: 20, height: 14, type: "threat" },
      { label: "DRONE", x: 22, y: 54, width: 12, height: 10, type: "threat" },
    ],
  },
  {
    id: "airspace-clear",
    label: "AIRSPACE SCAN",
    src: "https://images.unsplash.com/photo-1508196361694-3e7c5be3c8ff?auto=format&fit=crop&w=1600&q=80", // aircraft in sky
    detections: [], // no drone present
  },
];

export function LiveFeed() {
  const [detections, setDetections] = useState<Detection[]>(() =>
    FRAME_SOURCES[0].detections.map((d, idx) => ({
      ...d,
      id: `d-${idx}`,
      confidence: d.type === "threat" ? 0.9 : 0.6,
    }))
  );
  const [feedIndex, setFeedIndex] = useState(0);
  const [tracks, setTracks] = useState<AirTrack[]>(() =>
    FRAME_SOURCES[0].detections.map((d, idx) => ({
      id: `track-${idx}`,
      label: d.label,
      x: d.x,
      y: d.y,
      status: d.type === "threat" ? "engaged" : "tracking",
      threat: d.type,
      speed: 120 + Math.random() * 80,
      altitude: 500 + Math.random() * 800,
    }))
  );

  const activeFrame = useMemo(() => FRAME_SOURCES[feedIndex], [feedIndex]);

  // Simulate movement simulation (only when detections exist)
  useEffect(() => {
    const interval = setInterval(() => {
      setDetections(prev => prev.map(d => ({
        ...d,
        x: d.x + (Math.random() - 0.5) * 2,
        y: d.y + (Math.random() - 0.5) * 2,
        confidence: Math.min(0.99, Math.max(0.4, d.confidence + (Math.random() - 0.5) * 0.05))
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate feed source and refresh labels to match source type
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 2000; // 5-7s
      timeout = setTimeout(() => {
        setFeedIndex((prev) => {
          const nextIndex = (prev + 1) % FRAME_SOURCES.length;
          const nextFrame = FRAME_SOURCES[nextIndex];
          setDetections(
            nextFrame.detections.map((d, idx) => ({
              ...d,
              id: `${nextFrame.id}-${idx}`,
              confidence: d.type === "threat" ? 0.85 : 0.55,
            }))
          );
          setTracks(
            nextFrame.detections.map((d, idx) => ({
              id: `${nextFrame.id}-track-${idx}`,
              label: d.label,
              x: d.x,
              y: d.y,
              status: d.type === "threat" ? "engaged" : "tracking",
              threat: d.type,
              speed: 120 + Math.random() * 80,
              altitude: 500 + Math.random() * 800,
            }))
          );
          return nextIndex;
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  // Airspace state refresh every 10s (simulated live input)
  useEffect(() => {
    const interval = setInterval(() => {
      setTracks((prev) =>
        prev.map((t) => ({
          ...t,
          x: Math.min(90, Math.max(5, t.x + (Math.random() - 0.5) * 4)),
          y: Math.min(90, Math.max(5, t.y + (Math.random() - 0.5) * 4)),
          speed: Math.max(60, Math.min(240, t.speed + (Math.random() - 0.5) * 20)),
          altitude: Math.max(300, Math.min(1500, t.altitude + (Math.random() - 0.5) * 120)),
          status: t.threat === "threat" ? "engaged" : Math.random() > 0.6 ? "tracking" : "clear",
        }))
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-black group">
      {/* Image Frames (rotating) */}
      <div
        key={activeFrame.id}
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-80 transition-opacity duration-500 group-hover:opacity-60"
        style={{ backgroundImage: `url(${activeFrame.src})` }}
      />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-primary border border-primary/30 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {activeFrame.label} :: CAM-04 :: AERIAL_SECTOR_7
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-primary border border-primary/30">
            FPS: 29.97 | LATENCY: 24ms
          </div>
        </div>
        
        {/* Center Reticle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Crosshair className="w-32 h-32 text-primary" strokeWidth={0.5} />
        </div>

        {/* Detections */}
        {detections.map((d) => (
          <motion.div
            key={d.id}
            className="absolute border-2"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.width}%`,
              height: `${d.height}%`,
              borderColor: d.type === "threat" ? "var(--color-destructive)" : "var(--color-status-warning)",
              boxShadow: d.type === "threat" ? "0 0 10px var(--color-destructive)" : "none"
            }}
            animate={{
              left: `${d.x}%`,
              top: `${d.y}%`
            }}
            transition={{ duration: 1, ease: "linear" }}
          >
            {/* Label Tag */}
            <div 
              className="absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 text-black font-bold flex items-center gap-1 whitespace-nowrap"
              style={{ backgroundColor: d.type === "threat" ? "var(--color-destructive)" : "var(--color-status-warning)" }}
            >
              {d.type === "threat" ? <Target className="w-3 h-3" /> : <Scan className="w-3 h-3" />}
              {d.label} [{(d.confidence * 100).toFixed(0)}%]
            </div>
            
            {/* Corner Brackets */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-inherit" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-inherit" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-inherit" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-inherit" />
          </motion.div>
        ))}
      </div>

      {/* Scanline Animation (Stronger here) */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-[scan_4s_linear_infinite] pointer-events-none opacity-20" />

      {/* Airspace telemetry overlay */}
      <div className="absolute bottom-4 left-4 z-[1001] w-72 max-w-[80vw] bg-black/70 backdrop-blur-md border border-border rounded-lg p-3 space-y-2 pointer-events-none">
        <div className="flex items-center justify-between text-xs font-mono text-primary">
          <span>AIRSPACE LIVE // 10s REFRESH</span>
          <span className="text-muted-foreground">CAM-04</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-hidden">
          {tracks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-[11px] text-foreground/90 border border-border/60 rounded px-2 py-1 bg-card/40"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{t.label}</span>
                <span className="text-muted-foreground">
                  SPD {t.speed.toFixed(0)}kts • ALT {t.altitude.toFixed(0)}ft
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    t.threat === "threat"
                      ? "bg-destructive/20 text-destructive border border-destructive/50"
                      : "bg-status-warning/20 text-status-warning border border-status-warning/50"
                  }`}
                >
                  {t.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
