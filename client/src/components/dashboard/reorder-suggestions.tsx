import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, ShoppingCart } from "lucide-react";

interface ReorderSuggestionsProps {
  storeId: string;
}

export default function ReorderSuggestions({ storeId }: ReorderSuggestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reorders, isLoading } = useQuery({
    queryKey: ["/api/reorders", storeId],
    enabled: !!storeId,
  });

  const updateReorderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/reorders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reorders", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics", storeId] });
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
    // TODO: Implement PO export functionality
    toast({
      title: "Export Started",
      description: "Purchase order export is being generated",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Reorders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-border rounded-md p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReorders = (reorders as any[])?.filter((r: any) => r.status === 'pending') || [];

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pending Reorders</CardTitle>
          <Button 
            size="sm" 
            onClick={exportPO}
            disabled={pendingReorders.length === 0}
            data-testid="button-export-po"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PO
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {pendingReorders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p>No pending reorder suggestions</p>
            </div>
          ) : (
            pendingReorders.map((reorder: any) => (
              <div key={reorder.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors duration-200" data-testid={`reorder-item-${reorder.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">SKU: {reorder.skuId}</div>
                  <div className="text-sm text-muted-foreground">
                    Lead Time: {reorder.leadTimeDays} days
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Suggested Qty:</span>
                    <span className="font-medium ml-1">{reorder.suggestedQty} units</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Safety Stock:</span>
                    <span className="font-medium ml-1">{reorder.safetyStock} units</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {reorder.rationaleJson?.type || 'Conservative'} estimate
                  </div>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReorderAction(reorder.id, 'rejected')}
                      disabled={updateReorderMutation.isPending}
                      data-testid={`button-reject-${reorder.id}`}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReorderAction(reorder.id, 'approved')}
                      disabled={updateReorderMutation.isPending}
                      data-testid={`button-approve-${reorder.id}`}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
