import { LiveFeed } from "@/components/live-feed";
import { ThreatMap } from "@/components/threat-map";
import { StatsPanel } from "@/components/stats-panel";
import { AlertFeed } from "@/components/alert-feed";
import { ImageAnalyzer } from "@/components/image-analyzer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Siren, Play, Pause, Download, Share2, LayoutGrid, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            SECTOR 7 MONITORING
          </h2>
          <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
            <span className="w-2 h-2 bg-status-ok rounded-full" />
            OPERATIONAL STATUS: NORMAL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Siren className="w-4 h-4" />
            INITIATE LOCKDOWN
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
              <ThreatMap />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[600px]">
             <div className="lg:col-span-8 h-full">
               <ImageAnalyzer />
             </div>
             <div className="lg:col-span-4 h-full relative">
               <div className="absolute -top-3 left-4 z-10">
                 <Badge variant="outline" className="bg-background text-secondary-foreground border-border font-mono text-[10px]">
                   LOCATION CONTEXT
                 </Badge>
               </div>
               <ThreatMap />
             </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Row: Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-auto lg:h-[350px]">
        {/* Stats */}
        <div className="lg:col-span-8 h-full">
          <StatsPanel />
        </div>

        {/* Alerts */}
        <div className="lg:col-span-4 h-[350px] lg:h-full">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
}
