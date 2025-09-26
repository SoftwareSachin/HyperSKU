import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Boxes, Search, Plus, Edit, Package } from "lucide-react";
import type { Store, Sku, Supplier } from "@/types";

const skuFormSchema = z.object({
  code: z.string().min(1, "SKU code is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  weight: z.string().optional(),
  shelfLifeDays: z.string().optional(),
  leadTimeDays: z.string().optional(),
  supplierId: z.string().optional(),
  price: z.string().optional(),
});

type SkuFormData = z.infer<typeof skuFormSchema>;

export default function SkusPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<SkuFormData>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "",
      weight: "",
      shelfLifeDays: "",
      leadTimeDays: "",
      supplierId: "",
      price: "",
    },
  });

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

  const { data: skus, isLoading: skusLoading } = useQuery({
    queryKey: ["/api/skus"],
    enabled: isAuthenticated,
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    enabled: isAuthenticated,
  });

  // Set default store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Create/Update SKU mutation
  const skuMutation = useMutation({
    mutationFn: async (data: SkuFormData) => {
      const payload = {
        ...data,
        weight: data.weight ? parseFloat(data.weight).toString() : null,
        shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : null,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : null,
        price: data.price ? parseFloat(data.price).toString() : null,
        supplierId: data.supplierId || null,
      };

      if (editingSku) {
        await apiRequest("PATCH", `/api/skus/${editingSku.id}`, payload);
      } else {
        await apiRequest("POST", "/api/skus", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      setIsDialogOpen(false);
      setEditingSku(null);
      form.reset();
      toast({
        title: "Success",
        description: editingSku ? "SKU updated successfully" : "SKU created successfully",
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

  const handleSubmit = (data: SkuFormData) => {
    skuMutation.mutate(data);
  };

  const handleEdit = (sku: Sku) => {
    setEditingSku(sku);
    form.reset({
      code: sku.code,
      name: sku.name,
      category: sku.category || "",
      weight: sku.weight || "",
      shelfLifeDays: sku.shelfLifeDays?.toString() || "",
      leadTimeDays: sku.leadTimeDays?.toString() || "",
      supplierId: sku.supplierId || "",
      price: sku.price || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewSku = () => {
    setEditingSku(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Filter SKUs based on search term
  const filteredSkus = skus?.filter((sku: Sku) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sku.name.toLowerCase().includes(searchLower) ||
      sku.code.toLowerCase().includes(searchLower) ||
      sku.category?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate summary stats
  const totalSkus = filteredSkus.length;
  const activeSkus = filteredSkus.filter(sku => sku.isActive).length;
  const categories = new Set(filteredSkus.map(sku => sku.category).filter(Boolean)).size;

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
                <h1 className="text-2xl font-bold mb-2">SKU Management</h1>
                <p className="text-muted-foreground">
                  Manage your product catalog, update supplier information, and maintain SKU data
                </p>
              </div>
              <Button onClick={handleNewSku} data-testid="button-add-sku">
                <Plus className="h-4 w-4 mr-2" />
                Add SKU
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{totalSkus}</div>
                    <div className="text-sm text-muted-foreground">Total SKUs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{activeSkus}</div>
                    <div className="text-sm text-muted-foreground">Active SKUs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Boxes className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{categories}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SKUs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Boxes className="h-5 w-5" />
                  <span>SKU Catalog</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search SKUs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                    data-testid="input-search-skus"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {skusLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredSkus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Boxes className="h-8 w-8 mx-auto mb-2" />
                  <p>No SKUs found</p>
                  <Button onClick={handleNewSku} className="mt-4">
                    Add your first SKU
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSkus.map((sku: Sku) => {
                      const supplier = suppliers?.find((s: Supplier) => s.id === sku.supplierId);
                      
                      return (
                        <TableRow key={sku.id}>
                          <TableCell className="font-mono text-sm">{sku.code}</TableCell>
                          <TableCell className="font-medium">{sku.name}</TableCell>
                          <TableCell>{sku.category || '-'}</TableCell>
                          <TableCell>
                            {sku.price ? `$${parseFloat(sku.price).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>{sku.leadTimeDays ? `${sku.leadTimeDays} days` : '-'}</TableCell>
                          <TableCell>{supplier?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={sku.isActive ? 'default' : 'secondary'}>
                              {sku.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(sku)}
                              data-testid={`button-edit-sku-${sku.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* SKU Form Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSku ? 'Edit SKU' : 'Add New SKU'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU Code *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-sku-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-sku-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-sku-category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-sku-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.001" data-testid="input-sku-weight" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shelfLifeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shelf Life (days)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" data-testid="input-sku-shelf-life" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="leadTimeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Time (days)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" data-testid="input-sku-lead-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-sku-supplier">
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers?.map((supplier: Supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-sku"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={skuMutation.isPending}
                      data-testid="button-save-sku"
                    >
                      {skuMutation.isPending ? 'Saving...' : (editingSku ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
