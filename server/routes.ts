import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { forecastService } from "./services/forecastService";
import { csvProcessor } from "./services/csvProcessor";
import { anomalyDetectionService } from "./services/anomalyDetection";
import { withAuth, withResourceAuth, type AuthenticatedRequest } from "./middleware/rbac";
import { 
  insertSkuSchema, 
  insertSupplierSchema, 
  insertInventorySchema,
  insertStoreSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.get('/api/organizations/:id', isAuthenticated, ...withAuth(), async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.id !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to organization" });
      }
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Store routes
  app.get('/api/stores', isAuthenticated, ...withAuth(), async (req: AuthenticatedRequest, res) => {
    try {
      const stores = await storage.getStoresByOrganization(req.user.organizationId!);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/stores', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertStoreSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });

      const store = await storage.createStore(validatedData);
      res.json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid store data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.patch('/api/stores/:id', isAuthenticated, ...withResourceAuth('store', 'manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(req.params.id, validatedData);
      res.json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid store data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  // SKU routes
  app.get('/api/skus', isAuthenticated, ...withAuth(), async (req: AuthenticatedRequest, res) => {
    try {
      const skus = await storage.getSkusByOrganization(req.user.organizationId!);
      res.json(skus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SKUs" });
    }
  });

  app.post('/api/skus', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertSkuSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });

      const sku = await storage.createSku(validatedData);
      res.json(sku);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SKU data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create SKU" });
    }
  });

  app.patch('/api/skus/:id', isAuthenticated, ...withResourceAuth('sku', 'manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertSkuSchema.partial().parse(req.body);
      const sku = await storage.updateSku(req.params.id, validatedData);
      res.json(sku);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SKU data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update SKU" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, ...withAuth(), async (req: AuthenticatedRequest, res) => {
    try {
      const suppliers = await storage.getSuppliersByOrganization(req.user.organizationId!);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertSupplierSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
      });

      const supplier = await storage.createSupplier(validatedData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch('/api/suppliers/:id', isAuthenticated, ...withResourceAuth('supplier', 'manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  // Inventory routes
  app.get('/api/inventory/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const inventory = await storage.getInventoryByStore(req.params.storeId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory/upsert', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      
      // Verify the store belongs to the user's organization
      const store = await storage.getStore(validatedData.storeId);
      if (!store || store.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Verify the SKU belongs to the user's organization
      const sku = await storage.getSku(validatedData.skuId);
      if (!sku || sku.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "SKU not found" });
      }

      const inventory = await storage.upsertInventory(validatedData);
      res.json(inventory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upsert inventory" });
    }
  });

  // Forecast routes
  app.get('/api/forecasts/:storeId/:skuId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const { storeId, skuId } = req.params;
      
      // Validate SKU ownership as well
      const sku = await storage.getSku(skuId);
      if (!sku || sku.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      const forecast = await storage.getForecast(storeId, skuId);
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forecast" });
    }
  });

  app.get('/api/forecasts/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const forecasts = await storage.getForecastsByStore(req.params.storeId);
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forecasts" });
    }
  });

  app.post('/api/forecasts/run/:storeId', isAuthenticated, ...withResourceAuth('store', 'manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      await forecastService.runStoreForecasts(req.params.storeId);
      await forecastService.generateReorderSuggestions(req.params.storeId);
      res.json({ message: "Forecasts completed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to run forecasts" });
    }
  });

  // Reorder routes
  app.get('/api/reorders/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const reorders = await storage.getReordersByStore(req.params.storeId);
      res.json(reorders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reorder suggestions" });
    }
  });

  app.patch('/api/reorders/:id/status', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      
      // Validate reorder ownership
      const reorder = await storage.getReorder(req.params.id);
      if (!reorder) {
        return res.status(404).json({ message: "Reorder not found" });
      }
      
      // Check if the reorder's store belongs to user's organization
      const store = await storage.getStore(reorder.storeId);
      if (!store || store.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Reorder not found" });
      }
      
      const updatedReorder = await storage.updateReorderStatus(req.params.id, status);
      res.json(updatedReorder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reorder status" });
    }
  });

  // Anomaly routes
  app.get('/api/anomalies/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const anomalies = await storage.getAnomaliesByStore(req.params.storeId);
      res.json(anomalies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch anomalies" });
    }
  });

  app.post('/api/anomalies/detect/:storeId', isAuthenticated, ...withResourceAuth('store', 'manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const result = await anomalyDetectionService.detectAnomalies(req.params.storeId);
      
      // Save detected anomalies
      for (const anomaly of result.anomalies) {
        await storage.createAnomaly(anomaly);
      }
      
      res.json(result.summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });

  app.patch('/api/anomalies/:id/action', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { action } = req.body;
      
      // Validate anomaly ownership
      const anomaly = await storage.getAnomaly(req.params.id);
      if (!anomaly) {
        return res.status(404).json({ message: "Anomaly not found" });
      }
      
      // Check if the anomaly's store belongs to user's organization
      const store = await storage.getStore(anomaly.storeId);
      if (!store || store.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Anomaly not found" });
      }
      
      await anomalyDetectionService.processAnomalyAction(req.params.id, action);
      res.json({ message: "Anomaly action processed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to process anomaly action" });
    }
  });

  // Data import routes
  app.post('/api/data/validate-csv', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { csvContent, type } = req.body;
      
      if (!csvContent || !type) {
        return res.status(400).json({ message: "CSV content and type are required" });
      }

      const validation = csvProcessor.validateCSVFormat(csvContent, type);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate CSV" });
    }
  });

  app.post('/api/data/import-csv', isAuthenticated, ...withAuth('manager', 'admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { csvContent, type } = req.body;
      
      if (!csvContent || !type) {
        return res.status(400).json({ message: "CSV content and type are required" });
      }

      // Create data job
      const job = await storage.createDataJob({
        organizationId: req.user.organizationId!,
        type: `csv_${type}`,
        status: 'processing',
        fileName: `import_${Date.now()}.csv`,
      });

      try {
        const result = await csvProcessor.processCSV(csvContent, {
          organizationId: req.user.organizationId!,
          type: type as 'sales' | 'inventory' | 'skus',
        });

        await storage.updateDataJob(job.id, {
          status: 'completed',
          recordsProcessed: result.recordsProcessed,
          recordsTotal: result.recordsTotal,
          errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
        });

        res.json({
          jobId: job.id,
          ...result,
        });

      } catch (error) {
        await storage.updateDataJob(job.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }

    } catch (error) {
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });

  // Data job status tracking
  app.get('/api/data/jobs/:id', isAuthenticated, ...withAuth(), async (req: AuthenticatedRequest, res) => {
    try {
      const job = await storage.getDataJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Data job not found" });
      }

      // Verify job belongs to user's organization
      if (job.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Data job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data job" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.user.organizationId!, req.params.storeId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/top-risk-skus/:storeId', isAuthenticated, ...withResourceAuth('store'), async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topRiskSkus = await storage.getTopRiskSkus(req.params.storeId, limit);
      res.json(topRiskSkus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top risk SKUs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
