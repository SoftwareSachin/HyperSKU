import { storage } from "../storage";
import type { InsertForecast } from "@shared/schema";

interface ForecastInput {
  storeId: string;
  skuId: string;
  historicalData: Array<{
    timestamp: Date;
    quantity: number;
  }>;
  horizonHours: number;
}

interface ForecastResult {
  median: number[];
  p10: number[];
  p90: number[];
  metadata: {
    model: string;
    accuracy?: number;
    notes?: string;
  };
}

class ForecastService {
  /**
   * Generate demand forecasts using statistical models
   */
  async generateForecast(input: ForecastInput): Promise<ForecastResult> {
    const { historicalData, horizonHours } = input;
    
    if (historicalData.length < 7) {
      return this.generateBaseline(horizonHours);
    }
    
    // Extract quantities for analysis
    const quantities = historicalData.map(d => d.quantity);
    
    // Calculate moving averages
    const mean = this.calculateMean(quantities);
    const std = this.calculateStandardDeviation(quantities, mean);
    
    // Detect seasonality (simplified)
    const seasonality = this.detectSeasonality(historicalData);
    
    // Generate forecast points
    const forecastPoints = Math.ceil(horizonHours / 24); // Daily forecasts
    const median: number[] = [];
    const p10: number[] = [];
    const p90: number[] = [];
    
    for (let i = 0; i < forecastPoints; i++) {
      const baseValue = mean + (seasonality[i % 7] || 0);
      const uncertainty = std * Math.sqrt(i + 1) * 0.1; // Increasing uncertainty
      
      median.push(Math.max(0, baseValue));
      p10.push(Math.max(0, baseValue - 1.28 * uncertainty));
      p90.push(Math.max(0, baseValue + 1.28 * uncertainty));
    }
    
    return {
      median,
      p10,
      p90,
      metadata: {
        model: "moving-average-with-seasonality",
        accuracy: this.calculateMAPE(quantities),
        notes: `Forecast based on ${historicalData.length} historical data points`,
      },
    };
  }
  
  /**
   * Generate baseline forecast for SKUs with limited data
   */
  private generateBaseline(horizonHours: number): ForecastResult {
    const forecastPoints = Math.ceil(horizonHours / 24);
    const baseValue = 5; // Conservative baseline
    
    return {
      median: Array(forecastPoints).fill(baseValue),
      p10: Array(forecastPoints).fill(baseValue * 0.5),
      p90: Array(forecastPoints).fill(baseValue * 2),
      metadata: {
        model: "baseline",
        notes: "Insufficient historical data - using baseline forecast",
      },
    };
  }
  
  /**
   * Calculate mean of an array
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Detect weekly seasonality patterns
   */
  private detectSeasonality(data: Array<{ timestamp: Date; quantity: number }>): number[] {
    const weeklyPattern = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    data.forEach(({ timestamp, quantity }) => {
      const dayOfWeek = timestamp.getDay();
      weeklyPattern[dayOfWeek] += quantity;
      weeklyCounts[dayOfWeek]++;
    });
    
    // Calculate average for each day of week
    return weeklyPattern.map((total, i) => 
      weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 0
    );
  }
  
  /**
   * Calculate Mean Absolute Percentage Error
   */
  private calculateMAPE(values: number[]): number {
    if (values.length < 2) return 0;
    
    let totalError = 0;
    let count = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > 0) {
        const error = Math.abs((values[i] - values[i-1]) / values[i]);
        totalError += error;
        count++;
      }
    }
    
    return count > 0 ? (1 - totalError / count) * 100 : 80; // Default 80% accuracy
  }
  
  /**
   * Run forecasts for all active SKUs in a store
   */
  async runStoreForecasts(storeId: string): Promise<void> {
    try {
      // Get store and its organization
      const store = await storage.getStore(storeId);
      if (!store) throw new Error(`Store ${storeId} not found`);
      
      // Get all SKUs for the organization
      const skus = await storage.getSkusByOrganization(store.organizationId);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // 30 days of history
      
      for (const sku of skus) {
        try {
          // Get historical sales data
          const salesData = await storage.getSalesByStore(storeId, startDate, endDate);
          const skuSales = salesData
            .filter(sale => sale.skuId === sku.id)
            .map(sale => ({
              timestamp: sale.timestamp,
              quantity: sale.quantity,
            }));
          
          // Generate forecast
          const forecast = await this.generateForecast({
            storeId,
            skuId: sku.id,
            historicalData: skuSales,
            horizonHours: 168, // 7 days
          });
          
          // Save forecast
          await storage.createForecast({
            storeId,
            skuId: sku.id,
            horizonHours: 168,
            medianForecast: forecast.median,
            p10Forecast: forecast.p10,
            p90Forecast: forecast.p90,
            metadata: forecast.metadata,
          });
          
        } catch (error) {
          console.error(`Error forecasting SKU ${sku.code}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`Error running forecasts for store ${storeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate reorder suggestions based on forecasts
   */
  async generateReorderSuggestions(storeId: string): Promise<void> {
    try {
      // Get current inventory
      const inventoryItems = await storage.getInventoryByStore(storeId);
      
      for (const inv of inventoryItems) {
        // Get forecast
        const forecast = await storage.getForecast(storeId, inv.skuId);
        if (!forecast) continue;
        
        // Get SKU details
        const sku = await storage.getSku(inv.skuId);
        if (!sku) continue;
        
        const leadTimeDays = sku.leadTimeDays || 7;
        const medianForecast = forecast.medianForecast as number[];
        const p90Forecast = forecast.p90Forecast as number[];
        
        // Calculate demand during lead time
        const leadTimeDemand = medianForecast.slice(0, leadTimeDays).reduce((sum, val) => sum + val, 0);
        const conservativeDemand = p90Forecast.slice(0, leadTimeDays).reduce((sum, val) => sum + val, 0);
        
        // Calculate safety stock (20% of lead time demand)
        const safetyStock = Math.ceil(leadTimeDemand * 0.2);
        
        // Check if reorder is needed
        const availableStock = (inv.onHand || 0) - (inv.reserved || 0);
        const reorderPoint = leadTimeDemand + safetyStock;
        
        if (availableStock <= reorderPoint) {
          // Conservative suggestion
          const conservativeQty = Math.ceil(conservativeDemand + safetyStock - availableStock);
          
          // Aggressive suggestion
          const aggressiveQty = Math.ceil(leadTimeDemand * 1.5 + safetyStock - availableStock);
          
          await storage.createReorder({
            storeId,
            skuId: inv.skuId,
            suggestedQty: conservativeQty,
            safetyStock,
            leadTimeDays,
            rationaleJson: {
              type: "conservative",
              leadTimeDemand,
              availableStock,
              reorderPoint,
              alternatives: {
                aggressive: aggressiveQty,
              },
            },
            status: "pending",
          });
        }
      }
      
    } catch (error) {
      console.error(`Error generating reorder suggestions for store ${storeId}:`, error);
      throw error;
    }
  }
}

export const forecastService = new ForecastService();
