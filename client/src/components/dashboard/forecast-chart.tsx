import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import type { Sku, Forecast } from "@/types";

interface ForecastChartProps {
  storeId: string;
}

export default function ForecastChart({ storeId }: ForecastChartProps) {
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");

  const { data: skus = [] } = useQuery<Sku[]>({
    queryKey: ["/api/skus"],
    enabled: !!storeId,
  });

  const { data: forecast, isLoading } = useQuery<Forecast>({
    queryKey: ["/api/forecasts", storeId, selectedSkuId],
    enabled: !!storeId && !!selectedSkuId,
  });

  // Set default SKU
  useEffect(() => {
    if (!selectedSkuId && skus.length > 0) {
      setSelectedSkuId(skus[0].id);
    }
  }, [skus, selectedSkuId]);

  // Prepare chart data
  const chartData = forecast && forecast.medianForecast ? 
    (forecast.medianForecast as number[]).map((median, index) => ({
      day: `Day ${index + 1}`,
      median,
      p10: (forecast.p10Forecast as number[])?.[index] || median * 0.7,
      p90: (forecast.p90Forecast as number[])?.[index] || median * 1.3,
    })) : [];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>7-Day Demand Forecast</CardTitle>
          <div className="flex items-center space-x-4">
            {skus.length > 0 && (
              <Select value={selectedSkuId} onValueChange={setSelectedSkuId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {skus.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Median Forecast</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary/30 rounded-full"></div>
                <span>95% Confidence</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-muted/20 rounded-md flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !forecast || chartData.length === 0 ? (
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
  );
}
