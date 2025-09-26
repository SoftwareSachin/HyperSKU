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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  User, 
  Building, 
  Code, 
 
  Bell, 
  Database, 
  Key,
  Webhook,
  Mail,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  Trash2
} from "lucide-react";
import type { Store, Organization, User as UserType } from "@/types";

const userFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
});

const organizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

const storeFormSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  code: z.string().min(1, "Store code is required"),
  address: z.string().optional(),
  timezone: z.string().optional(),
});

const webhookFormSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  isActive: z.boolean().default(true),
});

const apiKeyFormSchema = z.object({
  name: z.string().min(1, "API key name is required"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type UserFormData = z.infer<typeof userFormSchema>;
type OrganizationFormData = z.infer<typeof organizationFormSchema>;
type StoreFormData = z.infer<typeof storeFormSchema>;
type WebhookFormData = z.infer<typeof webhookFormSchema>;
type ApiKeyFormData = z.infer<typeof apiKeyFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);
  const queryClient = useQueryClient();

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const orgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const storeForm = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      timezone: "UTC",
    },
  });

  const webhookForm = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      url: "",
      events: [],
      isActive: true,
    },
  });

  const apiKeyForm = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      permissions: [],
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

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      userForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, userForm]);

  // Fetch data
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: isAuthenticated,
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organizations", user?.organizationId],
    enabled: !!user?.organizationId,
  });

  // Update organization form when data loads
  useEffect(() => {
    if (organization) {
      orgForm.reset({
        name: organization.name,
      });
    }
  }, [organization, orgForm]);

  // Mock data for webhooks and API keys (these would come from actual APIs)
  const webhooks = [
    {
      id: "1",
      url: "https://example.com/webhooks/forecasts",
      events: ["forecast.completed", "reorder.suggested"],
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
    },
  ];

  const apiKeys = [
    {
      id: "1",
      name: "Production API",
      key: "hf_prod_1234567890abcdef",
      permissions: ["read", "write"],
      lastUsed: "2025-01-15T10:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
    },
  ];

  // Mutation handlers would go here
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // This would call the actual user update API
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      await apiRequest("POST", "/api/stores", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setShowNewStoreForm(false);
      storeForm.reset();
      toast({
        title: "Success",
        description: "Store created successfully",
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

  const handleUserSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleStoreSubmit = (data: StoreFormData) => {
    createStoreMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const generateApiKey = () => {
    const newKey = `hf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    copyToClipboard(newKey);
    toast({
      title: "API Key Generated",
      description: "New API key copied to clipboard",
    });
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
            <h1 className="text-2xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, organization, and system preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Organization</span>
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Stores</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>API & Webhooks</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>User Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" disabled data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateUserMutation.isPending}
                          data-testid="button-update-profile"
                        >
                          {updateUserMutation.isPending ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organization Tab */}
            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Organization Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...orgForm}>
                    <form className="space-y-4">
                      <FormField
                        control={orgForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-org-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Subscription Plan</label>
                          <div className="mt-1">
                            <Badge variant="default">Professional</Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Monthly Usage</label>
                          <div className="mt-1 text-sm text-muted-foreground">
                            8,450 / 10,000 SKU-days
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled
                          data-testid="button-update-organization"
                        >
                          Update Organization
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stores Tab */}
            <TabsContent value="stores">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>Store Management</span>
                      </CardTitle>
                      <Button 
                        onClick={() => setShowNewStoreForm(true)}
                        data-testid="button-add-store"
                      >
                        Add Store
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stores && stores.length > 0 ? (
                      <div className="space-y-4">
                        {stores.map((store: Store) => (
                          <div key={store.id} className="flex items-center justify-between p-4 border rounded-md">
                            <div>
                              <div className="font-medium">{store.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Code: {store.code} • {store.address || 'No address'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={store.isActive ? 'default' : 'secondary'}>
                                {store.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-8 w-8 mx-auto mb-2" />
                        <p>No stores configured</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* New Store Form */}
                {showNewStoreForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Store</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...storeForm}>
                        <form onSubmit={storeForm.handleSubmit(handleStoreSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={storeForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Store Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-store-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={storeForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Store Code *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-store-code" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={storeForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-store-address" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={storeForm.control}
                              name="timezone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Timezone</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-timezone">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="UTC">UTC</SelectItem>
                                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
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
                              onClick={() => setShowNewStoreForm(false)}
                              data-testid="button-cancel-store"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createStoreMutation.isPending}
                              data-testid="button-save-store"
                            >
                              {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* API & Webhooks Tab */}
            <TabsContent value="api">
              <div className="space-y-6">
                {/* API Keys Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Key className="h-5 w-5" />
                        <span>API Keys</span>
                      </CardTitle>
                      <Button onClick={generateApiKey} data-testid="button-generate-api-key">
                        Generate New Key
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        API keys provide access to your forecast data. Keep them secure and never share them publicly.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex-1">
                            <div className="font-medium">{apiKey.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {apiKey.key.substring(0, 20)}...
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {apiKey.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key)}
                              data-testid={`button-copy-api-key-${apiKey.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-delete-api-key-${apiKey.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Webhooks Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Webhook className="h-5 w-5" />
                        <span>Webhooks</span>
                      </CardTitle>
                      <Button onClick={() => setShowNewWebhookForm(true)} data-testid="button-add-webhook">
                        Add Webhook
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex-1">
                            <div className="font-medium font-mono text-sm">{webhook.url}</div>
                            <div className="text-sm text-muted-foreground">
                              Events: {webhook.events.join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">
                          Receive email alerts for critical events
                        </div>
                      </div>
                      <Switch defaultChecked data-testid="switch-email-notifications" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Stock Alerts</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when items are running low
                        </div>
                      </div>
                      <Switch defaultChecked data-testid="switch-stock-alerts" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Forecast Completion</div>
                        <div className="text-sm text-muted-foreground">
                          Notification when forecasts are updated
                        </div>
                      </div>
                      <Switch defaultChecked data-testid="switch-forecast-alerts" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Anomaly Detection</div>
                        <div className="text-sm text-muted-foreground">
                          Alerts for unusual patterns in data
                        </div>
                      </div>
                      <Switch defaultChecked data-testid="switch-anomaly-alerts" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">
                          Summary of forecasting performance
                        </div>
                      </div>
                      <Switch data-testid="switch-weekly-reports" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}
