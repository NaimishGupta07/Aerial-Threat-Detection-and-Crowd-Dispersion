import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Cog, Save } from "lucide-react";

export default function SystemConfig() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground tracking-[0.25em]">CORE SETTINGS</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">System Configuration</h2>
        </div>
        <Button size="sm" className="font-mono text-xs gap-2 bg-primary text-primary-foreground">
          <Save className="h-4 w-4" />
          SAVE PROFILE
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Cog className="h-5 w-5 text-primary" />
              NETWORK & SECURITY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Control Endpoint</label>
              <Input defaultValue="https://command.aeroguard.local" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">API Key</label>
              <Input type="password" defaultValue="••••••••••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Encryption</label>
              <Select defaultValue="tls12">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls12">TLS 1.2</SelectItem>
                  <SelectItem value="tls13">TLS 1.3</SelectItem>
                  <SelectItem value="strict">Strict Zero Trust</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Multi-factor commands</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground">ALERTING & LOGS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Webhook notifications</span>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Notification channel</label>
              <Select defaultValue="pagerduty">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagerduty">PagerDuty</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Log retention</label>
              <Select defaultValue="30d">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

