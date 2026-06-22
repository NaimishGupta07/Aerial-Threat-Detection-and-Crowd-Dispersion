import { useState, useRef } from "react";
import { Upload, Scan, AlertCircle, Users, ShieldAlert, X, Loader2, Radar, Crosshair, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  threats: number;
  crowdCount: number;
  density: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "SAFE" | "WARNING" | "DANGER";
  predictions: Array<{
    label: string;
    confidence: number;
    box: { x: number; y: number; w: number; h: number };
  }>;
}

export function ImageAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      setResult({
        threats: 0,
        crowdCount: 0,
        density: "LOW",
        status: "SAFE",
        predictions: [],
      });
      setError("No image selected. Please upload an image to classify.");
      return;
    }
    
    // Get the file from the file input
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setResult({
        threats: 0,
        crowdCount: 0,
        density: "LOW",
        status: "SAFE",
        predictions: [],
      });
      setError("No image file found. Please re-upload and try again.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "http://127.0.0.1:8000/analyze-drone",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  const data = await response.json();

  const predictions = (data.detections || []).map(
    (d: any, idx: number) => ({
      label: d.class.toUpperCase(),
      confidence: d.confidence,

      box: {
        x: 20 + idx * 5,
        y: 20 + idx * 5,
        w: 25,
        h: 25,
      },
    })
  );

  setResult({
    threats: data.count || 0,
    crowdCount: 0,
    density: "LOW",
    status: data.count > 0 ? "DANGER" : "SAFE",
    predictions,
  });
} catch (error) {
      console.error('Analysis error:', error);
      setError("Analysis failed. Please retry with a clearer image.");
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="glass-panel p-6 rounded-lg h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            MANUAL INTEL ANALYSIS
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            UPLOAD FOOTAGE FOR THREAT/CROWD ESTIMATION
          </p>
        </div>
        {result && (
          <Badge variant="outline" className={`
            font-mono text-xs px-3 py-1 border
            ${result.status === 'DANGER' ? 'border-destructive text-destructive bg-destructive/10' : 'border-status-warning text-status-warning bg-status-warning/10'}
          `}>
            ANALYSIS COMPLETE
          </Badge>
        )}
        {error && (
          <Badge variant="destructive" className="font-mono text-xs px-3 py-1">
            {error}
          </Badge>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-visible rounded-lg bg-black border border-border relative group">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="p-4 rounded-full bg-card group-hover:scale-110 transition-transform border border-border">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="mt-4 font-display font-bold text-foreground">DROP INTEL HERE</p>
            <p className="text-xs font-mono text-muted-foreground mt-2">SUPPORTED: JPG, PNG, WEBP</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img src={image} alt="Analysis Target" className="w-full h-full object-contain opacity-80" />
            
            {/* Scanning Effect Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-primary/10 z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-[20%] w-full animate-[scan_2s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/80 backdrop-blur px-4 py-2 rounded border border-primary text-primary font-mono text-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    PROCESSING NEURAL NET...
                  </div>
                </div>
              </div>
            )}

            {/* Results Overlay */}
            {!isAnalyzing && result && (
              <div className="absolute inset-0 p-4 pointer-events-none z-20">
                {/* Dynamic bounding boxes from ML predictions */}
                {result.predictions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 text-muted-foreground font-mono text-xs px-3 py-2 rounded border border-border">
                      NO DETECTIONS IN FRAME
                    </div>
                  </div>
                )}
                {result.predictions.map((p, idx) => {
                  const isThreat = p.label === "UAV" || p.label === "DRONE";
                  const color = isThreat ? "var(--color-destructive)" : p.label === "CROWD" ? "var(--color-status-warning)" : "var(--color-primary)";
                  return (
                    <motion.div
                      key={`${p.label}-${idx}`}
                      className="absolute border-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 0.85, scale: 1 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      style={{
                        left: `${p.box.x}%`,
                        top: `${p.box.y}%`,
                        width: `${p.box.w}%`,
                        height: `${p.box.h}%`,
                        borderColor: color,
                        boxShadow: `0 0 10px ${color}`,
                      }}
                    >
                      <div
                        className="absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 text-black font-bold flex items-center gap-1 whitespace-nowrap"
                        style={{ backgroundColor: color }}
                      >
                        {isThreat ? <Target className="w-3 h-3" /> : <Radar className="w-3 h-3" />}
                        {p.label} {(p.confidence * 100).toFixed(0)}%
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Controls */}
            <div className="absolute top-2 right-2 flex gap-2 z-20">
              <Button 
                size="icon" 
                variant="destructive" 
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-4 flex items-center justify-between gap-4 min-h-[80px]">
        {image && !result && !isAnalyzing && (
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold tracking-wide" onClick={analyzeImage}>
            <Scan className="w-4 h-4 mr-2" />
            INITIATE SCAN
          </Button>
        )}
        
        {result && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-2">
             <Card className="bg-card/50 border-border p-3 flex flex-col items-center justify-center text-center">
               <ShieldAlert className="w-5 h-5 text-destructive mb-1" />
               <span className="text-[10px] font-mono text-muted-foreground">THREATS</span>
               <span className="text-lg font-display font-bold text-foreground">{result.threats}</span>
             </Card>
             <Card className="bg-card/50 border-border p-3 flex flex-col items-center justify-center text-center">
               <Users className="w-5 h-5 text-status-warning mb-1" />
               <span className="text-[10px] font-mono text-muted-foreground">CROWD</span>
               <span className="text-lg font-display font-bold text-foreground">{result.crowdCount}</span>
             </Card>
             <Card className="bg-card/50 border-border p-3 flex flex-col items-center justify-center text-center">
               <AlertCircle className={`w-5 h-5 mb-1 ${result.status === 'DANGER' ? 'text-destructive' : 'text-status-warning'}`} />
               <span className="text-[10px] font-mono text-muted-foreground">STATUS</span>
               <span className={`text-lg font-display font-bold ${result.status === 'DANGER' ? 'text-destructive' : 'text-status-warning'}`}>
                 {result.status}
               </span>
             </Card>
             <Card className="bg-card/50 border-border p-3 flex flex-col items-center justify-center text-center">
               <Radar className="w-5 h-5 text-primary mb-1" />
               <span className="text-[10px] font-mono text-muted-foreground">CLASSES</span>
               <span className="text-sm font-display font-bold text-foreground">
                 {result.predictions.length === 0 ? "NONE" : Array.from(new Set(result.predictions.map(p => p.label))).join(" · ")}
               </span>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
}
