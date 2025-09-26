import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Anomaly } from "@/types";

interface AnomalyDetectionProps {
  storeId: string;
}

export default function AnomalyDetection({ storeId }: AnomalyDetectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ["/api/anomalies", storeId],
    enabled: !!storeId,
  });

  const updateAnomalyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'ignore' }) => {
      await apiRequest("PATCH", `/api/anomalies/${id}/action`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anomalies", storeId] });
      toast({
        title: "Success",
        description: "Anomaly action processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnomalyAction = (id: string, action: 'accept' | 'ignore') => {
    updateAnomalyMutation.mutate({ id, action });
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'demand_spike':
        return AlertTriangle;
      case 'pattern_change':
        return TrendingUp;
      default:
        return Calendar;
    }
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          border: 'border-l-destructive',
          bg: 'bg-destructive/5',
          text: 'text-destructive',
        };
      case 'medium':
        return {
          border: 'border-l-orange-500',
          bg: 'bg-orange-50',
          text: 'text-orange-600',
        };
      default:
        return {
          border: 'border-l-primary',
          bg: 'bg-primary/5',
          text: 'text-primary',
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 rounded-md bg-muted/50">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingAnomalies = anomalies?.filter((a: Anomaly) => a.status === 'pending') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {pendingAnomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>No pending anomalies detected</p>
            </div>
          ) : (
            pendingAnomalies.map((anomaly: Anomaly) => {
              const Icon = getAnomalyIcon(anomaly.type);
              const colors = getAnomalyColor(anomaly.severity);
              
              return (
                <div
                  key={anomaly.id}
                  className={`border-l-4 ${colors.border} ${colors.bg} p-4 rounded-r-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-medium ${colors.text} flex items-center space-x-2`}>
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">
                        {anomaly.type.replace('_', ' ')} - {anomaly.severity} severity
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(anomaly.detectedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {anomaly.description}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAnomalyAction(anomaly.id, 'accept')}
                      disabled={updateAnomalyMutation.isPending}
                      data-testid={`button-accept-anomaly-${anomaly.id}`}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAnomalyAction(anomaly.id, 'ignore')}
                      disabled={updateAnomalyMutation.isPending}
                      data-testid={`button-ignore-anomaly-${anomaly.id}`}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
