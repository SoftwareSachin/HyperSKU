import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import TopRiskSkus from "@/components/dashboard/top-risk-skus";
import ReorderSuggestions from "@/components/dashboard/reorder-suggestions";
import ForecastChart from "@/components/dashboard/forecast-chart";
import DataIngestionStatus from "@/components/dashboard/data-ingestion-status";
import AnomalyDetection from "@/components/dashboard/anomaly-detection";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user stores
  const { data: stores } = useQuery({
    queryKey: ["/api/stores"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Set default store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        stores={stores || []}
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 bg-muted/30">
          {/* Dashboard Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Operations Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor forecasts, inventory levels, and reorder suggestions across your stores
            </p>
          </div>

          {selectedStoreId && (
            <>
              {/* Metrics Grid */}
              <MetricsGrid storeId={selectedStoreId} />

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TopRiskSkus storeId={selectedStoreId} />
                <ReorderSuggestions storeId={selectedStoreId} />
              </div>

              {/* Forecast Chart */}
              <ForecastChart storeId={selectedStoreId} />

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataIngestionStatus />
                <AnomalyDetection storeId={selectedStoreId} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
