import { useState, useRef } from "react";
import { Upload, Scan, AlertCircle, Users, ShieldAlert, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  threats: number;
  crowdCount: number;
  density: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "SAFE" | "WARNING" | "DANGER";
}

export function ImageAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setResult(null);
    }
  };

  const analyzeImage = () => {
    if (!image) return;
    setIsAnalyzing(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        threats: Math.floor(Math.random() * 3), // Random threats 0-2
        crowdCount: Math.floor(Math.random() * 50) + 20, // Random crowd
        density: Math.random() > 0.5 ? "HIGH" : "MEDIUM",
        status: Math.random() > 0.7 ? "DANGER" : "WARNING"
      });
    }, 2000);
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="glass-panel p-6 rounded-lg h-full flex flex-col relative overflow-hidden">
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
      </div>

      <div className="flex-1 flex flex-col min-h-[300px]">
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
          <div className="relative flex-1 rounded-lg overflow-hidden bg-black border border-border group">
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
              <div className="absolute inset-0 p-4 pointer-events-none">
                {/* Simulated Bounding Boxes (Static for mock) */}
                <div className="absolute top-[20%] left-[30%] w-[15%] h-[20%] border-2 border-destructive shadow-[0_0_10px_var(--color-destructive)] opacity-80">
                  <div className="absolute -top-6 left-0 bg-destructive text-black font-mono text-[10px] px-1 font-bold">
                    THREAT 98%
                  </div>
                </div>
                <div className="absolute top-[40%] right-[20%] w-[25%] h-[30%] border-2 border-status-warning shadow-[0_0_10px_var(--color-status-warning)] opacity-60">
                  <div className="absolute -top-6 left-0 bg-status-warning text-black font-mono text-[10px] px-1 font-bold">
                    CROWD DENSITY
                  </div>
                </div>
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
      <div className="mt-4 flex items-center justify-between gap-4">
        {image && !result && !isAnalyzing && (
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold tracking-wide" onClick={analyzeImage}>
            <Scan className="w-4 h-4 mr-2" />
            INITIATE SCAN
          </Button>
        )}
        
        {result && (
          <div className="w-full grid grid-cols-3 gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
