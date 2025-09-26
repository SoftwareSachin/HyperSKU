import type { 
  User, 
  Organization, 
  Store, 
  Sku, 
  Supplier, 
  Sales, 
  Inventory, 
  Forecast, 
  Reorder, 
  Anomaly, 
  DataJob 
} from "@shared/schema";

export type {
  User,
  Organization,
  Store,
  Sku,
  Supplier,
  Sales,
  Inventory,
  Forecast,
  Reorder,
  Anomaly,
  DataJob,
};

export interface DashboardMetrics {
  activeAlerts: number;
  reorderSuggestions: number;
  forecastAccuracy: number;
  stockCoverage: number;
}

export interface TopRiskSku {
  sku: Sku;
  inventory: Inventory;
  riskLevel: string;
  stockDays: number;
}

export interface ForecastData {
  median: number[];
  p10: number[];
  p90: number[];
  metadata: {
    model: string;
    accuracy?: number;
    notes?: string;
  };
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  sample: any[];
}

export interface CSVProcessResult {
  recordsProcessed: number;
  recordsTotal: number;
  errors: string[];
  jobId?: string;
}
