import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  organizationId: uuid("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stores table
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull(),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  address: text("address"),
  timezone: varchar("timezone").default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SKU master data
export const skus = pgTable("skus", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull(),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  category: varchar("category"),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  shelfLifeDays: integer("shelf_life_days"),
  leadTimeDays: integer("lead_time_days"),
  supplierId: uuid("supplier_id"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull(),
  name: varchar("name").notNull(),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  leadTimeDays: integer("lead_time_days").default(7),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales/POS data
export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").notNull(),
  skuId: uuid("sku_id").notNull(),
  orderId: varchar("order_id"),
  timestamp: timestamp("timestamp").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  promoFlag: boolean("promo_flag").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory tracking
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").notNull(),
  skuId: uuid("sku_id").notNull(),
  onHand: integer("on_hand").default(0),
  reserved: integer("reserved").default(0),
  lastCountedAt: timestamp("last_counted_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forecasts
export const forecasts = pgTable("forecasts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").notNull(),
  skuId: uuid("sku_id").notNull(),
  horizonHours: integer("horizon_hours").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  medianForecast: jsonb("median_forecast"),
  p10Forecast: jsonb("p10_forecast"),
  p90Forecast: jsonb("p90_forecast"),
  metadata: jsonb("metadata"),
});

// Reorder suggestions
export const reorders = pgTable("reorders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").notNull(),
  skuId: uuid("sku_id").notNull(),
  suggestedQty: integer("suggested_qty").notNull(),
  safetyStock: integer("safety_stock"),
  leadTimeDays: integer("lead_time_days"),
  rationaleJson: jsonb("rationale_json"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Anomalies
export const anomalies = pgTable("anomalies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: uuid("store_id").notNull(),
  skuId: uuid("sku_id").notNull(),
  type: varchar("type").notNull(),
  severity: varchar("severity").default("medium"),
  description: text("description"),
  status: varchar("status").default("pending"),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Data ingestion jobs
export const dataJobs = pgTable("data_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull(),
  type: varchar("type").notNull(),
  status: varchar("status").default("pending"),
  fileName: varchar("file_name"),
  recordsProcessed: integer("records_processed").default(0),
  recordsTotal: integer("records_total").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  stores: many(stores),
  skus: many(skus),
  suppliers: many(suppliers),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [stores.organizationId],
    references: [organizations.id],
  }),
  sales: many(sales),
  inventory: many(inventory),
  forecasts: many(forecasts),
  reorders: many(reorders),
  anomalies: many(anomalies),
}));

export const skusRelations = relations(skus, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [skus.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [skus.supplierId],
    references: [suppliers.id],
  }),
  sales: many(sales),
  inventory: many(inventory),
  forecasts: many(forecasts),
  reorders: many(reorders),
  anomalies: many(anomalies),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  skus: many(skus),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  store: one(stores, {
    fields: [sales.storeId],
    references: [stores.id],
  }),
  sku: one(skus, {
    fields: [sales.skuId],
    references: [skus.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  store: one(stores, {
    fields: [inventory.storeId],
    references: [stores.id],
  }),
  sku: one(skus, {
    fields: [inventory.skuId],
    references: [skus.id],
  }),
}));

export const forecastsRelations = relations(forecasts, ({ one }) => ({
  store: one(stores, {
    fields: [forecasts.storeId],
    references: [stores.id],
  }),
  sku: one(skus, {
    fields: [forecasts.skuId],
    references: [skus.id],
  }),
}));

export const reordersRelations = relations(reorders, ({ one }) => ({
  store: one(stores, {
    fields: [reorders.storeId],
    references: [stores.id],
  }),
  sku: one(skus, {
    fields: [reorders.skuId],
    references: [skus.id],
  }),
}));

export const anomaliesRelations = relations(anomalies, ({ one }) => ({
  store: one(stores, {
    fields: [anomalies.storeId],
    references: [stores.id],
  }),
  sku: one(skus, {
    fields: [anomalies.skuId],
    references: [skus.id],
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkuSchema = createInsertSchema(skus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  updatedAt: true,
});

export const insertForecastSchema = createInsertSchema(forecasts).omit({
  id: true,
  generatedAt: true,
});

export const insertReorderSchema = createInsertSchema(reorders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnomalySchema = createInsertSchema(anomalies).omit({
  id: true,
  detectedAt: true,
});

export const insertDataJobSchema = createInsertSchema(dataJobs).omit({
  id: true,
  startedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Sku = typeof skus.$inferSelect;
export type InsertSku = z.infer<typeof insertSkuSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Sales = typeof sales.$inferSelect;
export type InsertSales = z.infer<typeof insertSalesSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;
export type Reorder = typeof reorders.$inferSelect;
export type InsertReorder = z.infer<typeof insertReorderSchema>;
export type Anomaly = typeof anomalies.$inferSelect;
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type DataJob = typeof dataJobs.$inferSelect;
export type InsertDataJob = z.infer<typeof insertDataJobSchema>;
