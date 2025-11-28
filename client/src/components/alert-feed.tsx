import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "critical" | "success";
  message: string;
  source: string;
}

const alerts: Alert[] = [
  { id: "1", timestamp: "10:42:15", level: "critical", message: "Unauthorized UAV detected in restricted airspace Sector 7", source: "YOLO-V8" },
  { id: "2", timestamp: "10:41:55", level: "warning", message: "Crowd density exceeding safety threshold (85%)", source: "CROWD-NET" },
  { id: "3", timestamp: "10:40:30", level: "info", message: "Routine scan completed. 3 sectors clear.", source: "SYS-CORE" },
  { id: "4", timestamp: "10:38:12", level: "success", message: "Evacuation route A cleared of obstacles", source: "GIS-MOD" },
  { id: "5", timestamp: "10:35:00", level: "info", message: "System synchronization with regional command established", source: "NET-UPLINK" },
  { id: "6", timestamp: "10:30:00", level: "warning", message: "Signal interference detected on frequency 2.4GHz", source: "RF-SCAN" },
];

const LevelIcon = ({ level }: { level: Alert["level"] }) => {
  switch (level) {
    case "critical": return <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-status-warning" />;
    case "success": return <CheckCircle2 className="w-4 h-4 text-status-ok" />;
    default: return <Info className="w-4 h-4 text-primary" />;
  }
};

export function AlertFeed() {
  return (
    <div className="glass-panel h-full rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
        <h3 className="font-display font-bold text-sm tracking-wider text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-primary animate-pulse rounded-sm" />
          SYSTEM LOG
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-1 rounded border border-border">
          LIVE
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-0">
        <div className="flex flex-col divide-y divide-border/50">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`
                p-3 hover:bg-white/5 transition-colors cursor-default border-l-2
                ${alert.level === 'critical' ? 'border-l-destructive bg-destructive/5' : 
                  alert.level === 'warning' ? 'border-l-status-warning' : 
                  alert.level === 'success' ? 'border-l-status-ok' : 'border-l-primary'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <LevelIcon level={alert.level} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono tracking-tight uppercase
                      ${alert.level === 'critical' ? 'text-destructive' : 
                        alert.level === 'warning' ? 'text-status-warning' : 'text-primary'}
                    `}>
                      {alert.source}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground opacity-70">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
