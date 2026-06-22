import { useState, useEffect } from "react";
import { LiveFeed } from "@/components/live-feed";
import { ThreatMap } from "@/components/threat-map";
import { StatsPanel } from "@/components/stats-panel";
import { AlertFeed } from "@/components/alert-feed";
import { ImageAnalyzer } from "@/components/image-analyzer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren, Play, Pause, Download, Share2, LayoutGrid, Eye, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dataset } from "@/data/datasets";

interface BackendDataset {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  threats: any[];
  crowdStats: any[];
  classificationStats: any[];
}

export default function Dashboard() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [threatLevel, setThreatLevel] = useState<"LOW" | "ELEVATED" | "CRITICAL">("LOW");
  const [autoLockdown, setAutoLockdown] = useState(false);

  useEffect(() => {
    // Fetch datasets from backend
    fetch('/api/datasets')
      .then(res => res.json())
      .then((backendDatasets: BackendDataset[]) => {
        // Transform backend data to frontend format
        const transformed = backendDatasets.map(ds => ({
          id: ds.id,
          name: ds.name,
          description: ds.description,
          location: [ds.latitude, ds.longitude] as [number, number],
          threats: ds.threats as any,
          stats: {
            crowdDensity: ds.crowdStats as any,
            classification: ds.classificationStats as any,
          }
        }));
        setDatasets(transformed);
        if (transformed.length > 0) {
          setSelectedDataset(transformed[0]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch datasets:', err);
        setIsLoading(false);
      });
  }, []);

  const handleDatasetChange = (value: string) => {
    const dataset = datasets.find(d => d.id === value);
    if (dataset) setSelectedDataset(dataset);
  };

  // Derive threat level from current dataset
  useEffect(() => {
    if (!selectedDataset) return;
    const threatCount = selectedDataset.threats?.length ?? 0;
    const maxConfidence = selectedDataset.threats?.reduce((max, t: any) => Math.max(max, t.confidence ?? 0), 0) ?? 0;
    const crowdPeak = selectedDataset.stats?.crowdDensity?.reduce((max: number, c: any) => Math.max(max, c.density ?? 0), 0) ?? 0;

    let level: "LOW" | "ELEVATED" | "CRITICAL" = "LOW";
    if (threatCount >= 3 || maxConfidence >= 0.8 || crowdPeak >= 70) {
      level = "ELEVATED";
    }
    if (threatCount >= 5 || maxConfidence >= 0.9 || crowdPeak >= 85) {
      level = "CRITICAL";
    }
    setThreatLevel(level);
  }, [selectedDataset]);

  // Auto-trigger lockdown on critical or extreme crowd congestion
  useEffect(() => {
    if (threatLevel === "CRITICAL") {
      setAutoLockdown(true);
    } else {
      setAutoLockdown(false);
    }
  }, [threatLevel]);

  if (isLoading || !selectedDataset) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-sm text-muted-foreground">LOADING THREAT DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            SECTOR 7 MONITORING
          </h2>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                threatLevel === "CRITICAL" ? "bg-destructive" : threatLevel === "ELEVATED" ? "bg-status-warning" : "bg-status-ok"
              }`}
            />
            OPERATIONAL STATUS: {threatLevel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
            <Database className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedDataset.id} onValueChange={handleDatasetChange}>
              <SelectTrigger className="w-[240px] bg-card border-border font-mono text-xs h-8">
                <SelectValue placeholder="Select Data Source" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {datasets.map((ds) => (
                  <SelectItem key={ds.id} value={ds.id} className="font-mono text-xs">
                    {ds.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant={autoLockdown ? "default" : "outline"}
            size="sm"
            className={`font-mono text-xs gap-2 ${autoLockdown ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"}`}
            disabled={autoLockdown}
          >
            <Siren className="w-4 h-4" />
            {autoLockdown ? "LOCKDOWN AUTO-TRIGGERED" : "INITIATE LOCKDOWN"}
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2">
            <Download className="w-4 h-4" />
            EXPORT LOGS
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs gap-2">
            <Share2 className="w-4 h-4" />
            SHARE FEED
          </Button>
        </div>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="live" className="gap-2 font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Eye className="w-3 h-3" /> LIVE OPS
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2 font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <LayoutGrid className="w-3 h-3" /> MANUAL ANALYSIS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="live" className="space-y-4">
          {/* Top Row: Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[800px] lg:h-[500px]">
            {/* Live Feed (Larger) */}
            <div className="lg:col-span-7 h-full relative group">
              <div className="absolute -top-3 left-4 z-10">
                <Badge variant="outline" className="bg-background text-primary border-primary font-mono text-[10px]">
                  OPTICAL SENSOR ARRAY
                </Badge>
              </div>
              <LiveFeed />
            </div>

            {/* Map (Smaller) */}
            <div className="lg:col-span-5 h-full relative">
              <div className="absolute -top-3 left-4 z-10">
                <Badge variant="outline" className="bg-background text-secondary-foreground border-border font-mono text-[10px]">
                  GEOSPATIAL TRACKING
                </Badge>
              </div>
              <ThreatMap 
                center={selectedDataset.location} 
                threats={selectedDataset.threats}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:h-[600px] h-auto">
             <div className="lg:col-span-8 h-[500px] lg:h-full">
               <ImageAnalyzer />
             </div>
             <div className="lg:col-span-4 h-[400px] lg:h-full relative">
               <div className="absolute -top-3 left-4 z-10">
                 <Badge variant="outline" className="bg-background text-secondary-foreground border-border font-mono text-[10px]">
                   LOCATION CONTEXT
                 </Badge>
               </div>
               <ThreatMap 
                center={selectedDataset.location} 
                threats={selectedDataset.threats}
               />
             </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Row: Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-auto lg:h-[350px]">
        {/* Stats */}
        <div className="lg:col-span-8 h-full">
          <StatsPanel 
            crowdData={selectedDataset.stats.crowdDensity} 
            threatData={selectedDataset.stats.classification}
          />
        </div>

        {/* Alerts */}
        <div className="lg:col-span-4 h-[350px] lg:h-full">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
}
