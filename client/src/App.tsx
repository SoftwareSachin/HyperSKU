import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Forecasts from "@/pages/forecasts";
import Reorders from "@/pages/reorders";
import Inventory from "@/pages/inventory";
import Skus from "@/pages/skus";
import DataImport from "@/pages/data-import";
import Anomalies from "@/pages/anomalies";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/forecasts" component={Forecasts} />
          <Route path="/reorders" component={Reorders} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/skus" component={Skus} />
          <Route path="/data-import" component={DataImport} />
          <Route path="/anomalies" component={Anomalies} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
