import {
  users,
  organizations,
  stores,
  skus,
  suppliers,
  sales,
  inventory,
  forecasts,
  reorders,
  anomalies,
  dataJobs,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Store,
  type InsertStore,
  type Sku,
  type InsertSku,
  type Supplier,
  type InsertSupplier,
  type Sales,
  type InsertSales,
  type Inventory,
  type InsertInventory,
  type Forecast,
  type InsertForecast,
  type Reorder,
  type InsertReorder,
  type Anomaly,
  type InsertAnomaly,
  type DataJob,
  type InsertDataJob,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, ne, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  
  // Store operations
  createStore(store: InsertStore): Promise<Store>;
  getStoresByOrganization(organizationId: string): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  updateStore(id: string, store: Partial<InsertStore>): Promise<Store>;
  
  // SKU operations
  createSku(sku: InsertSku): Promise<Sku>;
  getSkusByOrganization(organizationId: string): Promise<Sku[]>;
  getSku(id: string): Promise<Sku | undefined>;
  updateSku(id: string, sku: Partial<InsertSku>): Promise<Sku>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  
  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSuppliersByOrganization(organizationId: string): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  
  // Sales operations
  insertSales(sales: InsertSales[]): Promise<Sales[]>;
  getSalesByStore(storeId: string, startDate?: Date, endDate?: Date): Promise<Sales[]>;
  
  // Inventory operations
  upsertInventory(inventory: InsertInventory): Promise<Inventory>;
  getInventoryByStore(storeId: string): Promise<Inventory[]>;
  getInventoryItem(storeId: string, skuId: string): Promise<Inventory | undefined>;
  
  // Forecast operations
  createForecast(forecast: InsertForecast): Promise<Forecast>;
  getForecast(storeId: string, skuId: string): Promise<Forecast | undefined>;
  getForecastsByStore(storeId: string): Promise<Forecast[]>;
  
  // Reorder operations
  createReorder(reorder: InsertReorder): Promise<Reorder>;
  getReordersByStore(storeId: string): Promise<Reorder[]>;
  updateReorderStatus(id: string, status: string): Promise<Reorder>;
  
  // Anomaly operations
  createAnomaly(anomaly: InsertAnomaly): Promise<Anomaly>;
  getAnomaliesByStore(storeId: string): Promise<Anomaly[]>;
  updateAnomalyStatus(id: string, status: string): Promise<Anomaly>;
  getAnomaly(id: string): Promise<Anomaly | undefined>;
  getReorder(id: string): Promise<Reorder | undefined>;
  
  // Data job operations
  createDataJob(job: InsertDataJob): Promise<DataJob>;
  updateDataJob(id: string, updates: Partial<InsertDataJob>): Promise<DataJob>;
  getDataJob(id: string): Promise<DataJob | undefined>;
  
  // Dashboard analytics
  getDashboardMetrics(organizationId: string, storeId?: string): Promise<{
    activeAlerts: number;
    reorderSuggestions: number;
    forecastAccuracy: number;
    stockCoverage: number;
  }>;
  
  getTopRiskSkus(storeId: string, limit?: number): Promise<Array<{
    sku: Sku;
    inventory: Inventory;
    riskLevel: string;
    stockDays: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(organization).returning();
    return org;
  }
  
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
  
  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }
  
  // Store operations
  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }
  
  async getStoresByOrganization(organizationId: string): Promise<Store[]> {
    return await db
      .select()
      .from(stores)
      .where(and(eq(stores.organizationId, organizationId), eq(stores.isActive, true)))
      .orderBy(asc(stores.name));
  }
  
  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }
  
  async updateStore(id: string, store: Partial<InsertStore>): Promise<Store> {
    const [updated] = await db
      .update(stores)
      .set({ ...store, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updated;
  }
  
  // SKU operations
  async createSku(sku: InsertSku): Promise<Sku> {
    const [newSku] = await db.insert(skus).values(sku).returning();
    return newSku;
  }
  
  async getSkusByOrganization(organizationId: string): Promise<Sku[]> {
    return await db
      .select()
      .from(skus)
      .where(and(eq(skus.organizationId, organizationId), eq(skus.isActive, true)))
      .orderBy(asc(skus.name));
  }
  
  async getSku(id: string): Promise<Sku | undefined> {
    const [sku] = await db.select().from(skus).where(eq(skus.id, id));
    return sku;
  }
  
  async updateSku(id: string, sku: Partial<InsertSku>): Promise<Sku> {
    const [updated] = await db
      .update(skus)
      .set({ ...sku, updatedAt: new Date() })
      .where(eq(skus.id, id))
      .returning();
    return updated;
  }
  
  // Supplier operations
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }
  
  async getSuppliersByOrganization(organizationId: string): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.organizationId, organizationId), eq(suppliers.isActive, true)))
      .orderBy(asc(suppliers.name));
  }
  
  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updated] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }
  
  // Sales operations
  async insertSales(salesData: InsertSales[]): Promise<Sales[]> {
    if (salesData.length === 0) return [];
    return await db.insert(sales).values(salesData).returning();
  }
  
  async getSalesByStore(storeId: string, startDate?: Date, endDate?: Date): Promise<Sales[]> {
    let conditions = [eq(sales.storeId, storeId)];
    
    if (startDate && endDate) {
      conditions.push(gte(sales.timestamp, startDate));
      conditions.push(lte(sales.timestamp, endDate));
    }
    
    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.timestamp));
  }
  
  // Inventory operations
  async upsertInventory(inventoryData: InsertInventory): Promise<Inventory> {
    const [inv] = await db
      .insert(inventory)
      .values(inventoryData)
      .onConflictDoUpdate({
        target: [inventory.storeId, inventory.skuId],
        set: {
          ...inventoryData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return inv;
  }
  
  async getInventoryByStore(storeId: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.storeId, storeId));
  }
  
  async getInventoryItem(storeId: string, skuId: string): Promise<Inventory | undefined> {
    const [inv] = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.storeId, storeId), eq(inventory.skuId, skuId)));
    return inv;
  }
  
  // Forecast operations
  async createForecast(forecast: InsertForecast): Promise<Forecast> {
    const [newForecast] = await db.insert(forecasts).values(forecast).returning();
    return newForecast;
  }
  
  async getForecast(storeId: string, skuId: string): Promise<Forecast | undefined> {
    const [forecast] = await db
      .select()
      .from(forecasts)
      .where(and(eq(forecasts.storeId, storeId), eq(forecasts.skuId, skuId)))
      .orderBy(desc(forecasts.generatedAt))
      .limit(1);
    return forecast;
  }
  
  async getForecastsByStore(storeId: string): Promise<Forecast[]> {
    return await db
      .select()
      .from(forecasts)
      .where(eq(forecasts.storeId, storeId))
      .orderBy(desc(forecasts.generatedAt));
  }
  
  // Reorder operations
  async createReorder(reorder: InsertReorder): Promise<Reorder> {
    const [newReorder] = await db.insert(reorders).values(reorder).returning();
    return newReorder;
  }
  
  async getReordersByStore(storeId: string): Promise<Reorder[]> {
    return await db
      .select()
      .from(reorders)
      .where(eq(reorders.storeId, storeId))
      .orderBy(desc(reorders.createdAt));
  }
  
  async updateReorderStatus(id: string, status: string): Promise<Reorder> {
    const [updated] = await db
      .update(reorders)
      .set({ status, updatedAt: new Date() })
      .where(eq(reorders.id, id))
      .returning();
    return updated;
  }
  
  // Anomaly operations
  async createAnomaly(anomaly: InsertAnomaly): Promise<Anomaly> {
    const [newAnomaly] = await db.insert(anomalies).values(anomaly).returning();
    return newAnomaly;
  }
  
  async getAnomaliesByStore(storeId: string): Promise<Anomaly[]> {
    return await db
      .select()
      .from(anomalies)
      .where(eq(anomalies.storeId, storeId))
      .orderBy(desc(anomalies.detectedAt));
  }
  
  async updateAnomalyStatus(id: string, status: string): Promise<Anomaly> {
    const [updated] = await db
      .update(anomalies)
      .set({ status, resolvedAt: status === 'resolved' ? new Date() : null })
      .where(eq(anomalies.id, id))
      .returning();
    return updated;
  }

  async getAnomaly(id: string): Promise<Anomaly | undefined> {
    const [anomaly] = await db.select().from(anomalies).where(eq(anomalies.id, id));
    return anomaly;
  }

  async getReorder(id: string): Promise<Reorder | undefined> {
    const [reorder] = await db.select().from(reorders).where(eq(reorders.id, id));
    return reorder;
  }
  
  // Data job operations
  async createDataJob(job: InsertDataJob): Promise<DataJob> {
    const [newJob] = await db.insert(dataJobs).values(job).returning();
    return newJob;
  }
  
  async updateDataJob(id: string, updates: Partial<InsertDataJob>): Promise<DataJob> {
    const [updated] = await db
      .update(dataJobs)
      .set(updates)
      .where(eq(dataJobs.id, id))
      .returning();
    return updated;
  }
  
  async getDataJob(id: string): Promise<DataJob | undefined> {
    const [job] = await db.select().from(dataJobs).where(eq(dataJobs.id, id));
    return job;
  }
  
  // Dashboard analytics
  async getDashboardMetrics(organizationId: string, storeId?: string): Promise<{
    activeAlerts: number;
    reorderSuggestions: number;
    forecastAccuracy: number;
    stockCoverage: number;
  }> {
    // Get active alerts count
    let alertsConditions = [eq(anomalies.status, 'pending')];
    if (storeId) {
      alertsConditions.push(eq(anomalies.storeId, storeId));
    }
    
    const [alertsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(anomalies)
      .where(and(...alertsConditions));
    
    // Get reorder suggestions count
    let reordersConditions = [eq(reorders.status, 'pending')];
    if (storeId) {
      reordersConditions.push(eq(reorders.storeId, storeId));
    }
    
    const [reordersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reorders)
      .where(and(...reordersConditions));
    
    return {
      activeAlerts: alertsResult.count,
      reorderSuggestions: reordersResult.count,
      forecastAccuracy: 87.3, // This would be calculated from actual forecast vs sales data
      stockCoverage: 4.2, // This would be calculated from inventory levels
    };
  }
  
  async getTopRiskSkus(storeId: string, limit = 10): Promise<Array<{
    sku: Sku;
    inventory: Inventory;
    riskLevel: string;
    stockDays: number;
  }>> {
    const result = await db
      .select({
        sku: skus,
        inventory: inventory,
      })
      .from(inventory)
      .innerJoin(skus, eq(inventory.skuId, skus.id))
      .where(eq(inventory.storeId, storeId))
      .orderBy(asc(inventory.onHand))
      .limit(limit);
    
    return result.map(({ sku, inventory: inv }) => {
      const onHand = inv.onHand || 0;
      return {
        sku,
        inventory: inv,
        riskLevel: onHand < 10 ? 'High Risk' : onHand < 50 ? 'Medium Risk' : 'Low Risk',
        stockDays: Math.max(0.1, onHand / 10), // Simplified calculation
      };
    });
  }
}

export const storage = new DatabaseStorage();
