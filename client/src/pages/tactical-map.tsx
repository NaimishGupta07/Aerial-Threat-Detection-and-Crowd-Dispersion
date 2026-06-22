import { ThreatMap } from "@/components/threat-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Radar, RefreshCw } from "lucide-react";

export default function TacticalMap() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground tracking-[0.25em]">LIVE TACTICAL OVERVIEW</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Tactical Map</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-2 font-mono text-xs border-primary text-primary">
            <MapPin className="h-3 w-3" />
            SATLINK OK
          </Badge>
          <Button variant="outline" size="sm" className="font-mono text-xs gap-2">
            <RefreshCw className="h-4 w-4" />
            REFRESH LAYERS
          </Button>
          <Button size="sm" className="font-mono text-xs gap-2 bg-primary text-primary-foreground">
            <Radar className="h-4 w-4" />
            DEPLOY SCAN
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 h-[70vh] border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <span className="w-1 h-4 bg-primary rounded-full" />
              GEOSPATIAL TRACKING
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-0">
            <ThreatMap center={[40.7128, -74.0060]} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">OPERATION STATUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Link</span>
                <Badge className="bg-status-ok text-primary-foreground">Stable</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sensor Sweep</span>
                <Badge variant="outline" className="text-primary border-primary">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">No-Fly Zones</span>
                <span className="font-mono text-xs">5 monitored</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">PRIORITY OBJECTIVES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Secure perimeter", "Track aerial targets", "Mark evacuation corridors"].map((item) => (
                <div key={item} className="p-3 rounded-md border border-border/60 bg-card/60">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-destructive rounded-full" />
                    <p className="font-medium text-sm">{item}</p>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-mono">AUTO-SYNCED • LIVE</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

