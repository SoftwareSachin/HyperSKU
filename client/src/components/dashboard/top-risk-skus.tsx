import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TopRiskSku } from "@/types";

interface TopRiskSkusProps {
  storeId: string;
}

export default function TopRiskSkus({ storeId }: TopRiskSkusProps) {
  const { data: riskSkus = [], isLoading } = useQuery<TopRiskSku[]>({
    queryKey: ["/api/dashboard/top-risk-skus", storeId],
    enabled: !!storeId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top At-Risk SKUs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-md bg-muted/50">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top At-Risk SKUs</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-risk-skus">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {riskSkus.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p>No at-risk SKUs found</p>
            </div>
          ) : (
            riskSkus.map((item: TopRiskSku, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200" data-testid={`risk-sku-item-${index}`}>
                <div className="flex-1">
                  <div className="font-medium">{item.sku.name}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {item.sku.code}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    item.riskLevel === 'High Risk' 
                      ? 'text-destructive' 
                      : 'text-muted-foreground'
                  }`}>
                    {item.riskLevel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.stockDays.toFixed(1)} days left
                  </div>
                </div>
                <div className="ml-3">
                  <Button variant="ghost" size="sm">
                    {item.riskLevel === 'High Risk' ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
