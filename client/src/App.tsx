import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import TacticalMap from "@/pages/tactical-map";
import Analytics from "@/pages/analytics";
import CrowdControl from "@/pages/crowd-control";
import SystemConfig from "@/pages/system-config";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/map" component={TacticalMap} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/crowd" component={CrowdControl} />
        <Route path="/settings" component={SystemConfig} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
