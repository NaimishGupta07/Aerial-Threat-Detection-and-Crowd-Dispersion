import { AlertFeed } from "@/components/alert-feed";
import { StatsPanel } from "@/components/stats-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground tracking-[0.25em]">MISSION METRICS</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Analytics</h2>
        </div>
        <Badge variant="outline" className="gap-2 font-mono text-xs border-primary text-primary">
          <Activity className="h-3 w-3" />
          STREAM LIVE
        </Badge>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            OPERATIONAL INTELLIGENCE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatsPanel />
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">SURVEILLANCE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frames processed</span>
                  <span className="font-mono">24,193</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Detection latency</span>
                  <span className="font-mono text-primary">148 ms</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">RISKS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Critical threats</span>
                  <span className="font-mono text-destructive">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flagged routes</span>
                  <span className="font-mono">7</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">SYSTEM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API uptime</span>
                  <span className="font-mono text-status-ok">99.95%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Worker load</span>
                  <span className="font-mono">62%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground">ALERT STREAM</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] overflow-hidden">
          <AlertFeed />
        </CardContent>
      </Card>
    </div>
  );
}

