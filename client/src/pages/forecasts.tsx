import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar, RefreshCw } from "lucide-react";
import type { Store, Sku, Forecast } from "@/types";

export default function Forecasts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");

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

  // Fetch data
  const { data: stores } = useQuery({
    queryKey: ["/api/stores"],
    enabled: isAuthenticated,
  });

  const { data: skus } = useQuery({
    queryKey: ["/api/skus"],
    enabled: isAuthenticated,
  });

  const { data: forecasts } = useQuery({
    queryKey: ["/api/forecasts", selectedStoreId],
    enabled: !!selectedStoreId,
  });

  const { data: selectedForecast } = useQuery({
    queryKey: ["/api/forecasts", selectedStoreId, selectedSkuId],
    enabled: !!selectedStoreId && !!selectedSkuId,
  });

  // Set defaults
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (skus && skus.length > 0 && !selectedSkuId) {
      setSelectedSkuId(skus[0].id);
    }
  }, [skus, selectedSkuId]);

  // Prepare chart data
  const chartData = selectedForecast ? (selectedForecast.medianForecast as number[]).map((median: number, index: number) => ({
    day: `Day ${index + 1}`,
    median,
    p10: (selectedForecast.p10Forecast as number[])[index] || median * 0.7,
    p90: (selectedForecast.p90Forecast as number[])[index] || median * 1.3,
  })) : [];

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Demand Forecasts</h1>
            <p className="text-muted-foreground">
              View 7-day demand forecasts with prediction intervals for all SKUs
            </p>
          </div>

          {/* Forecast Chart */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>7-Day Demand Forecast</span>
                </CardTitle>
                <div className="flex items-center space-x-4">
                  {skus && skus.length > 0 && (
                    <Select value={selectedSkuId} onValueChange={setSelectedSkuId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select SKU" />
                      </SelectTrigger>
                      <SelectContent>
                        {skus.map((sku: Sku) => (
                          <SelectItem key={sku.id} value={sku.id}>
                            {sku.name} ({sku.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>Median</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-primary/30 rounded-full"></div>
                      <span>90% Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {!selectedForecast || chartData.length === 0 ? (
                <div className="h-64 bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg mb-2">No forecast data available</p>
                    <p className="text-sm">Select a SKU to view forecast</p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(1) : value,
                          name === 'median' ? 'Median Forecast' : 
                          name === 'p10' ? '10th Percentile' : 
                          '90th Percentile'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="p90" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.1}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="p10" 
                        stroke="hsl(var(--primary))" 
                        fill="white" 
                        fillOpacity={1}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="median" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>All Forecasts</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {!forecasts || forecasts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No forecasts available for this store</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forecasts.map((forecast: Forecast) => {
                    const sku = skus?.find((s: Sku) => s.id === forecast.skuId);
                    const medianForecast = forecast.medianForecast as number[];
                    const totalDemand = medianForecast?.reduce((sum: number, val: number) => sum + val, 0) || 0;
                    const metadata = forecast.metadata as any;
                    
                    return (
                      <div
                        key={forecast.id}
                        className="border border-border rounded-md p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{sku?.name || 'Unknown SKU'}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {sku?.code} • {forecast.horizonHours}h forecast
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {metadata?.accuracy ? `${metadata.accuracy.toFixed(1)}% accuracy` : 'New'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total 7-day demand:</span>
                            <div className="font-medium">{totalDemand.toFixed(0)} units</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <div className="font-medium">{metadata?.model || 'Unknown'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Generated:</span>
                            <div className="font-medium">
                              {new Date(forecast.generatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {metadata?.notes && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {metadata.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
