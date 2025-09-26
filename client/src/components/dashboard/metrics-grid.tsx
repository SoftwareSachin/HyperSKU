import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsGridProps {
  storeId: string;
}

export default function MetricsGrid({ storeId }: MetricsGridProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", storeId],
    enabled: !!storeId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Active Alerts",
      value: metrics?.activeAlerts || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      change: "+12% from last week",
    },
    {
      title: "Reorder Suggestions",
      value: metrics?.reorderSuggestions || 0,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Pending review",
    },
    {
      title: "Forecast Accuracy",
      value: `${metrics?.forecastAccuracy || 0}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "7-day MAPE",
    },
    {
      title: "Stock Coverage",
      value: `${metrics?.stockCoverage || 0} days`,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "Average across SKUs",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={`h-8 w-8 ${metric.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
