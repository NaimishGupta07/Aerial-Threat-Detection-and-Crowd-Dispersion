import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, ShieldCheck, Users } from "lucide-react";

export default function CrowdControl() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground tracking-[0.25em]">CIVILIAN MANAGEMENT</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Crowd Control</h2>
        </div>
        <Badge variant="outline" className="gap-2 font-mono text-xs border-destructive text-destructive">
          <AlertTriangle className="h-3 w-3" />
          HIGH DENSITY
        </Badge>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Users className="h-5 w-5 text-primary" />
              ACTIVE DIRECTIVES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Evacuation Lane A", status: "Open", severity: "Controlled" },
              { title: "Perimeter South", status: "Monitored", severity: "Watch" },
              { title: "Staging Zone", status: "Secured", severity: "Low" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-md border border-border/60 bg-card/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">STATUS: {item.status}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[11px] uppercase">
                    {item.severity}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Crowd flow</span>
                  <span className="font-mono text-primary">Stable</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">RESPONSE PROTOCOLS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Voice Broadcast", "Barrier Deployment", "Lighting Override"].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{label}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground">DISPERSION INTENSITY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider defaultValue={[35]} step={5} max={100} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Target density</span>
                <span className="font-mono text-primary">35%</span>
              </div>
              <Button size="sm" className="w-full font-mono text-xs gap-2 bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
                APPLY SAFE DISPERSION
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

