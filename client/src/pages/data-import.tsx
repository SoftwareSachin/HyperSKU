import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, AlertCircle, CheckCircle, Database } from "lucide-react";
import type { CSVValidationResult, CSVProcessResult } from "@/types";

export default function DataImport() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [csvContent, setCsvContent] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [importResult, setImportResult] = useState<CSVProcessResult | null>(null);

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

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: async ({ csvContent, type }: { csvContent: string; type: string }) => {
      const response = await apiRequest("POST", "/api/data/validate-csv", { csvContent, type });
      return await response.json();
    },
    onSuccess: (result: CSVValidationResult) => {
      setValidationResult(result);
      if (result.isValid) {
        toast({
          title: "Validation Successful",
          description: `CSV format is valid. Found ${result.sample.length} sample records.`,
        });
      } else {
        toast({
          title: "Validation Failed",
          description: `Found ${result.errors.length} errors in CSV format.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ csvContent, type }: { csvContent: string; type: string }) => {
      const response = await apiRequest("POST", "/api/data/import-csv", { csvContent, type });
      return await response.json();
    },
    onSuccess: (result: CSVProcessResult) => {
      setImportResult(result);
      toast({
        title: "Import Completed",
        description: `Processed ${result.recordsProcessed} of ${result.recordsTotal} records.`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleValidate = () => {
    if (!csvContent.trim() || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please provide CSV content and select data type.",
        variant: "destructive",
      });
      return;
    }
    
    setValidationResult(null);
    setImportResult(null);
    validateMutation.mutate({ csvContent, type: selectedType });
  };

  const handleImport = () => {
    if (!validationResult?.isValid) {
      toast({
        title: "Validation Required",
        description: "Please validate CSV before importing.",
        variant: "destructive",
      });
      return;
    }
    
    importMutation.mutate({ csvContent, type: selectedType });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const csvFormats = {
    sales: {
      name: "Sales/POS Data",
      description: "Import sales transactions from POS systems",
      requiredFields: ["store_id", "sku_code", "timestamp", "qty"],
      optionalFields: ["order_id", "price", "promo_flag"],
      example: "store_id,order_id,timestamp,sku_code,qty,price,promo_flag\nS001,ORD001,2025-01-01T10:00:00Z,ABC123,2,10.50,0"
    },
    inventory: {
      name: "Inventory Data",
      description: "Import current inventory levels",
      requiredFields: ["store_id", "sku_code", "on_hand"],
      optionalFields: ["reserved", "last_counted_at"],
      example: "store_id,sku_code,on_hand,reserved,last_counted_at\nS001,ABC123,100,5,2025-01-01T09:00:00Z"
    },
    skus: {
      name: "SKU Master Data",
      description: "Import product catalog and SKU information",
      requiredFields: ["sku_code", "name"],
      optionalFields: ["category", "weight", "shelf_life_days", "lead_time_days", "supplier_name", "price"],
      example: "sku_code,name,category,weight,shelf_life_days,lead_time_days,supplier_name,price\nABC123,Widget A,Electronics,0.5,365,7,Supplier Inc,10.50"
    }
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
      <Header stores={[]} selectedStoreId="" onStoreChange={() => {}} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 bg-muted/30">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Data Import</h1>
            <p className="text-muted-foreground">
              Import sales, inventory, and SKU data using CSV files
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Import Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>CSV Import</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Data Type Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Type</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger data-testid="select-data-type">
                        <SelectValue placeholder="Select data type to import" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(csvFormats).map(([key, format]) => (
                          <SelectItem key={key} value={key}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      data-testid="input-csv-file"
                    />
                  </div>

                  {/* CSV Content */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">CSV Content</label>
                    <Textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Paste your CSV content here..."
                      className="min-h-32 font-mono text-sm"
                      data-testid="textarea-csv-content"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleValidate}
                      disabled={validateMutation.isPending || !csvContent.trim() || !selectedType}
                      data-testid="button-validate-csv"
                    >
                      {validateMutation.isPending ? 'Validating...' : 'Validate'}
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importMutation.isPending || !validationResult?.isValid}
                      variant="default"
                      data-testid="button-import-csv"
                    >
                      {importMutation.isPending ? 'Importing...' : 'Import'}
                    </Button>
                  </div>

                  {/* Import Progress */}
                  {importMutation.isPending && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Processing CSV data...</div>
                      <Progress value={50} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results */}
              {(validationResult || importResult) && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Import Results</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs defaultValue="validation" className="w-full">
                      <TabsList>
                        <TabsTrigger value="validation">Validation</TabsTrigger>
                        <TabsTrigger value="import" disabled={!importResult}>Import Results</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="validation">
                        {validationResult && (
                          <div className="space-y-4">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <span className="font-medium">
                                  {validationResult.isValid ? 'Validation Successful' : 'Validation Failed'}
                                </span>
                                {validationResult.isValid && (
                                  <span> - Found {validationResult.sample.length} sample records</span>
                                )}
                              </AlertDescription>
                            </Alert>

                            {validationResult.errors.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Validation Errors:</h4>
                                <div className="space-y-1">
                                  {validationResult.errors.map((error, index) => (
                                    <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {validationResult.sample.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Sample Data:</h4>
                                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                  {JSON.stringify(validationResult.sample, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="import">
                        {importResult && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-primary/10 p-3 rounded">
                                <div className="text-2xl font-bold text-primary">{importResult.recordsProcessed}</div>
                                <div className="text-sm text-muted-foreground">Records Processed</div>
                              </div>
                              <div className="bg-muted p-3 rounded">
                                <div className="text-2xl font-bold">{importResult.recordsTotal}</div>
                                <div className="text-sm text-muted-foreground">Total Records</div>
                              </div>
                            </div>

                            {importResult.errors.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Import Errors:</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {importResult.errors.map((error, index) => (
                                    <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {importResult.jobId && (
                              <div className="text-sm text-muted-foreground">
                                Job ID: <code className="bg-muted px-1 rounded">{importResult.jobId}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Format Guide */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>CSV Formats</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(csvFormats).map(([key, format]) => (
                      <div key={key} className="border rounded-md p-3">
                        <h4 className="font-medium mb-1">{format.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{format.description}</p>
                        
                        <div className="text-xs space-y-1">
                          <div>
                            <strong>Required:</strong> {format.requiredFields.join(', ')}
                          </div>
                          <div>
                            <strong>Optional:</strong> {format.optionalFields.join(', ')}
                          </div>
                        </div>
                        
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-primary">Show example</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {format.example}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
