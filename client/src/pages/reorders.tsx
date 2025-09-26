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
import { ShoppingCart, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import type { Store, Sku, Reorder } from "@/types";

export default function Reorders() {
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

  const { data: reorders, isLoading: reordersLoading } = useQuery({
    queryKey: ["/api/reorders", selectedStoreId],
    enabled: !!selectedStoreId,
  });

  // Set default store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const updateReorderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/reorders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reorders", selectedStoreId] });
      toast({
        title: "Success",
        description: "Reorder status updated successfully",
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

  const handleReorderAction = (id: string, status: string) => {
    updateReorderMutation.mutate({ id, status });
  };

  const exportPO = () => {
    toast({
      title: "Export Started",
      description: "Purchase order export is being generated",
    });
  };

  // Filter reorders by status
  const pendingReorders = reorders?.filter((r: Reorder) => r.status === 'pending') || [];
  const approvedReorders = reorders?.filter((r: Reorder) => r.status === 'approved') || [];
  const rejectedReorders = reorders?.filter((r: Reorder) => r.status === 'rejected') || [];

  const renderReorderCard = (reorder: Reorder) => {
    const sku = skus?.find((s: Sku) => s.id === reorder.skuId);
    const rationale = reorder.rationaleJson as any;
    
    return (
      <div key={reorder.id} className="border border-border rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">{sku?.name || 'Unknown SKU'}</div>
            <div className="text-sm text-muted-foreground">
              SKU: {sku?.code} • Lead Time: {reorder.leadTimeDays} days
            </div>
          </div>
          <Badge 
            variant={
              reorder.status === 'approved' ? 'default' :
              reorder.status === 'rejected' ? 'destructive' :
              'secondary'
            }
          >
            {reorder.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Suggested Qty:</span>
            <div className="font-medium">{reorder.suggestedQty} units</div>
          </div>
          <div>
            <span className="text-muted-foreground">Safety Stock:</span>
            <div className="font-medium">{reorder.safetyStock || 0} units</div>
          </div>
        </div>
        
        {rationale && (
          <div className="text-xs text-muted-foreground mb-3">
            <strong>Rationale:</strong> {rationale.type || 'Conservative'} estimate
            {rationale.alternatives?.aggressive && (
              <span> (Aggressive option: {rationale.alternatives.aggressive} units)</span>
            )}
          </div>
        )}
        
        {reorder.status === 'pending' && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReorderAction(reorder.id, 'rejected')}
              disabled={updateReorderMutation.isPending}
              data-testid={`button-reject-${reorder.id}`}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleReorderAction(reorder.id, 'approved')}
              disabled={updateReorderMutation.isPending}
              data-testid={`button-approve-${reorder.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2">
          Created: {new Date(reorder.createdAt).toLocaleString()}
        </div>
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
                <h1 className="text-2xl font-bold mb-2">Reorder Suggestions</h1>
                <p className="text-muted-foreground">
                  Review and manage automated reorder suggestions based on demand forecasts
                </p>
              </div>
              <Button 
                onClick={exportPO}
                disabled={approvedReorders.length === 0}
                data-testid="button-export-all-po"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Approved POs
              </Button>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pending ({pendingReorders.length})</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Approved ({approvedReorders.length})</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center space-x-2">
                <XCircle className="h-4 w-4" />
                <span>Rejected ({rejectedReorders.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Pending Review</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse border border-border rounded-md p-4">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : pendingReorders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                      <p>No pending reorder suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingReorders.map(renderReorderCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="approved">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Approved Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {approvedReorders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No approved reorder suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvedReorders.map(renderReorderCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rejected">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5" />
                    <span>Rejected Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rejectedReorders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No rejected reorder suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rejectedReorders.map(renderReorderCard)}
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
