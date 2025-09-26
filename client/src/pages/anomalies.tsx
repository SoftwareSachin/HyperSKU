import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import type { Store, Sku, Anomaly } from "@/types";

export default function AnomaliesPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const queryClient = useQueryClient();

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

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["/api/anomalies", selectedStoreId],
    enabled: !!selectedStoreId,
  });

  // Set default store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Detect anomalies mutation
  const detectAnomaliesMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await apiRequest("POST", `/api/anomalies/detect/${storeId}`);
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/anomalies", selectedStoreId] });
      toast({
        title: "Anomaly Detection Complete",
        description: `Detected ${result.total} anomalies (${result.highSeverity} high severity)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Detection Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update anomaly mutation
  const updateAnomalyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'ignore' }) => {
      await apiRequest("PATCH", `/api/anomalies/${id}/action`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anomalies", selectedStoreId] });
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

  const handleDetectAnomalies = () => {
    if (selectedStoreId) {
      detectAnomaliesMutation.mutate(selectedStoreId);
    }
  };

  const handleAnomalyAction = (id: string, action: 'accept' | 'ignore') => {
    updateAnomalyMutation.mutate({ id, action });
  };

  // Filter anomalies by status
  const pendingAnomalies = anomalies?.filter((a: Anomaly) => a.status === 'pending') || [];
  const acceptedAnomalies = anomalies?.filter((a: Anomaly) => a.status === 'accepted') || [];
  const ignoredAnomalies = anomalies?.filter((a: Anomaly) => a.status === 'ignored') || [];

  // Get anomaly icon and colors
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'demand_spike':
        return TrendingUp;
      case 'demand_drop':
        return TrendingDown;
      case 'pattern_change':
        return Calendar;
      default:
        return AlertTriangle;
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
          border: 'border-l-blue-500',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
        };
    }
  };

  const renderAnomalyCard = (anomaly: Anomaly) => {
    const sku = skus?.find((s: Sku) => s.id === anomaly.skuId);
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
              {anomaly.type.replace('_', ' ')}
            </span>
            <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
              {anomaly.severity}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(anomaly.detectedAt).toLocaleString()}
          </div>
        </div>
        
        <div className="mb-2">
          <div className="font-medium">{sku?.name || 'Unknown SKU'}</div>
          <div className="text-sm text-muted-foreground">SKU: {sku?.code}</div>
        </div>
        
        <div className="text-sm text-muted-foreground mb-3">
          {anomaly.description}
        </div>
        
        {anomaly.status === 'pending' && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAnomalyAction(anomaly.id, 'accept')}
              disabled={updateAnomalyMutation.isPending}
              data-testid={`button-accept-anomaly-${anomaly.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAnomalyAction(anomaly.id, 'ignore')}
              disabled={updateAnomalyMutation.isPending}
              data-testid={`button-ignore-anomaly-${anomaly.id}`}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Ignore
            </Button>
          </div>
        )}
        
        {anomaly.resolvedAt && (
          <div className="text-xs text-muted-foreground mt-2">
            Resolved: {new Date(anomaly.resolvedAt).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Anomaly Detection</h1>
                <p className="text-muted-foreground">
                  Monitor unusual patterns in demand, inventory, and sales data
                </p>
              </div>
              <Button 
                onClick={handleDetectAnomalies}
                disabled={detectAnomaliesMutation.isPending || !selectedStoreId}
                data-testid="button-detect-anomalies"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${detectAnomaliesMutation.isPending ? 'animate-spin' : ''}`} />
                {detectAnomaliesMutation.isPending ? 'Detecting...' : 'Run Detection'}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{pendingAnomalies.length}</div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{acceptedAnomalies.length}</div>
                    <div className="text-sm text-muted-foreground">Accepted</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-600">{ignoredAnomalies.length}</div>
                    <div className="text-sm text-muted-foreground">Ignored</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {pendingAnomalies.filter(a => a.severity === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Severity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Pending ({pendingAnomalies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Accepted ({acceptedAnomalies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="ignored" className="flex items-center space-x-2">
                <XCircle className="h-4 w-4" />
                <span>Ignored ({ignoredAnomalies.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Pending Review</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {anomaliesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse p-4 rounded-md bg-muted/50">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : pendingAnomalies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>No pending anomalies detected</p>
                      <Button onClick={handleDetectAnomalies} className="mt-4">
                        Run Anomaly Detection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingAnomalies.map(renderAnomalyCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="accepted">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Accepted Anomalies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {acceptedAnomalies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No accepted anomalies</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {acceptedAnomalies.map(renderAnomalyCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ignored">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5" />
                    <span>Ignored Anomalies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ignoredAnomalies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No ignored anomalies</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ignoredAnomalies.map(renderAnomalyCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
