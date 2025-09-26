import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { Store, Sku, Inventory } from "@/types";

export default function InventoryPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory", selectedStoreId],
    enabled: !!selectedStoreId,
  });

  // Set default store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Filter inventory based on search term
  const filteredInventory = inventory?.filter((inv: Inventory) => {
    const sku = skus?.find((s: Sku) => s.id === inv.skuId);
    const searchLower = searchTerm.toLowerCase();
    return (
      sku?.name.toLowerCase().includes(searchLower) ||
      sku?.code.toLowerCase().includes(searchLower) ||
      sku?.category?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate inventory status
  const getInventoryStatus = (inv: Inventory) => {
    const available = inv.onHand - inv.reserved;
    if (available <= 0) return { status: 'critical', label: 'Out of Stock', color: 'destructive' };
    if (available <= 10) return { status: 'low', label: 'Low Stock', color: 'secondary' };
    return { status: 'good', label: 'In Stock', color: 'default' };
  };

  // Calculate summary stats
  const totalItems = filteredInventory.length;
  const outOfStock = filteredInventory.filter(inv => (inv.onHand - inv.reserved) <= 0).length;
  const lowStock = filteredInventory.filter(inv => {
    const available = inv.onHand - inv.reserved;
    return available > 0 && available <= 10;
  }).length;
  const totalValue = filteredInventory.reduce((sum, inv) => {
    const sku = skus?.find((s: Sku) => s.id === inv.skuId);
    const price = parseFloat(sku?.price || '0');
    return sum + (inv.onHand * price);
  }, 0);

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
            <h1 className="text-2xl font-bold mb-2">Inventory Management</h1>
            <p className="text-muted-foreground">
              Monitor stock levels, track reservations, and manage inventory across your stores
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{totalItems}</div>
                    <div className="text-sm text-muted-foreground">Total SKUs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="text-2xl font-bold text-destructive">{outOfStock}</div>
                    <div className="text-sm text-muted-foreground">Out of Stock</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{lowStock}</div>
                    <div className="text-sm text-muted-foreground">Low Stock</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">${totalValue.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Inventory Details</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search SKUs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-inventory"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No inventory items found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>On Hand</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Counted</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((inv: Inventory) => {
                      const sku = skus?.find((s: Sku) => s.id === inv.skuId);
                      const available = inv.onHand - inv.reserved;
                      const status = getInventoryStatus(inv);
                      const price = parseFloat(sku?.price || '0');
                      const value = inv.onHand * price;
                      
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{sku?.code}</TableCell>
                          <TableCell className="font-medium">{sku?.name}</TableCell>
                          <TableCell>{sku?.category || '-'}</TableCell>
                          <TableCell>{inv.onHand}</TableCell>
                          <TableCell>{inv.reserved}</TableCell>
                          <TableCell className={available <= 0 ? 'text-destructive font-medium' : ''}>
                            {available}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.color as any}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {inv.lastCountedAt 
                              ? new Date(inv.lastCountedAt).toLocaleDateString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>${value.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
