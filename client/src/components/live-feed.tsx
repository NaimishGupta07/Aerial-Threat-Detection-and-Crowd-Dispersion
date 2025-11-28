import { useEffect, useState } from "react";
import { Crosshair, AlertTriangle, Target, Scan } from "lucide-react";
import { motion } from "framer-motion";
import droneImage from "@assets/download_1764335874773.jpg";

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

export function LiveFeed() {
  const [detections, setDetections] = useState<Detection[]>([
    { id: "t1", x: 35, y: 20, width: 25, height: 15, label: "UAV-X1", confidence: 0.98, type: "threat" },
    { id: "t2", x: 65, y: 45, width: 15, height: 10, label: "DRONE", confidence: 0.85, type: "threat" },
    { id: "n1", x: 15, y: 60, width: 10, height: 8, label: "BIRD", confidence: 0.45, type: "neutral" },
  ]);

  // Simulate movement simulation
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

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-black group">
      {/* Video Source Simulator */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-80 transition-opacity duration-500 group-hover:opacity-60"
        style={{ backgroundImage: `url(${droneImage})` }}
      />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-primary border border-primary/30 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE FEED :: CAM-04 :: AERIAL_SECTOR_7
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
    </div>
  );
}
