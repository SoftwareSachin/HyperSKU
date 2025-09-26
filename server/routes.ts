import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { forecastService } from "./services/forecastService";
import { csvProcessor } from "./services/csvProcessor";
import { anomalyDetectionService } from "./services/anomalyDetection";
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
  app.get('/api/organizations/:id', isAuthenticated, async (req, res) => {
    try {
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
  app.get('/api/stores', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }
      
      const stores = await storage.getStoresByOrganization(user.organizationId);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/stores', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }

      const storeData = {
        ...req.body,
        organizationId: user.organizationId,
      };

      const store = await storage.createStore(storeData);
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  // SKU routes
  app.get('/api/skus', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }
      
      const skus = await storage.getSkusByOrganization(user.organizationId);
      res.json(skus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SKUs" });
    }
  });

  app.post('/api/skus', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }

      const skuData = {
        ...req.body,
        organizationId: user.organizationId,
      };

      const sku = await storage.createSku(skuData);
      res.json(sku);
    } catch (error) {
      res.status(500).json({ message: "Failed to create SKU" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }
      
      const suppliers = await storage.getSuppliersByOrganization(user.organizationId);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Inventory routes
  app.get('/api/inventory/:storeId', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByStore(req.params.storeId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Forecast routes
  app.get('/api/forecasts/:storeId/:skuId', isAuthenticated, async (req, res) => {
    try {
      const { storeId, skuId } = req.params;
      const forecast = await storage.getForecast(storeId, skuId);
      
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forecast" });
    }
  });

  app.get('/api/forecasts/:storeId', isAuthenticated, async (req, res) => {
    try {
      const forecasts = await storage.getForecastsByStore(req.params.storeId);
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forecasts" });
    }
  });

  app.post('/api/forecasts/run/:storeId', isAuthenticated, async (req, res) => {
    try {
      await forecastService.runStoreForecasts(req.params.storeId);
      await forecastService.generateReorderSuggestions(req.params.storeId);
      res.json({ message: "Forecasts completed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to run forecasts" });
    }
  });

  // Reorder routes
  app.get('/api/reorders/:storeId', isAuthenticated, async (req, res) => {
    try {
      const reorders = await storage.getReordersByStore(req.params.storeId);
      res.json(reorders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reorder suggestions" });
    }
  });

  app.patch('/api/reorders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const reorder = await storage.updateReorderStatus(req.params.id, status);
      res.json(reorder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reorder status" });
    }
  });

  // Anomaly routes
  app.get('/api/anomalies/:storeId', isAuthenticated, async (req, res) => {
    try {
      const anomalies = await storage.getAnomaliesByStore(req.params.storeId);
      res.json(anomalies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch anomalies" });
    }
  });

  app.post('/api/anomalies/detect/:storeId', isAuthenticated, async (req, res) => {
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

  app.patch('/api/anomalies/:id/action', isAuthenticated, async (req, res) => {
    try {
      const { action } = req.body;
      await anomalyDetectionService.processAnomalyAction(req.params.id, action);
      res.json({ message: "Anomaly action processed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to process anomaly action" });
    }
  });

  // Data import routes
  app.post('/api/data/validate-csv', isAuthenticated, async (req, res) => {
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

  app.post('/api/data/import-csv', isAuthenticated, async (req: any, res) => {
    try {
      const { csvContent, type } = req.body;
      
      if (!csvContent || !type) {
        return res.status(400).json({ message: "CSV content and type are required" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }

      // Create data job
      const job = await storage.createDataJob({
        organizationId: user.organizationId,
        type: `csv_${type}`,
        status: 'processing',
        fileName: `import_${Date.now()}.csv`,
      });

      try {
        const result = await csvProcessor.processCSV(csvContent, {
          organizationId: user.organizationId,
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

  // Dashboard routes
  app.get('/api/dashboard/metrics/:storeId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with organization" });
      }

      const metrics = await storage.getDashboardMetrics(user.organizationId, req.params.storeId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/top-risk-skus/:storeId', isAuthenticated, async (req, res) => {
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
