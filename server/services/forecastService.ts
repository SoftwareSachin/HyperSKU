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
      return this.generateBaseline(historicalData, horizonHours);
    }
    
    // Extract quantities for analysis
    const quantities = historicalData.map(d => d.quantity);
    const mean = this.calculateMean(quantities);
    
    // Detect mean-centered seasonality
    const seasonalityDeviations = this.detectSeasonality(historicalData, mean);
    
    // Calculate residuals from level + seasonal model
    const residuals = this.calculateResiduals(historicalData, mean, seasonalityDeviations);
    const residualStd = this.calculateStandardDeviation(residuals, 0);
    
    // Generate forecast points
    const forecastPoints = Math.ceil(horizonHours / 24); // Daily forecasts
    const median: number[] = [];
    const p10: number[] = [];
    const p90: number[] = [];
    
    // Align forecast start day with the day after last historical timestamp
    const lastTimestamp = historicalData[historicalData.length - 1]?.timestamp || new Date();
    const startDay = (lastTimestamp.getDay() + 1) % 7;
    
    for (let i = 0; i < forecastPoints; i++) {
      const dayOfWeek = (startDay + i) % 7;
      const baseValue = mean + seasonalityDeviations[dayOfWeek];
      const uncertainty = residualStd * Math.sqrt(i + 1); // Proper uncertainty scaling
      
      median.push(Math.max(0, baseValue));
      p10.push(Math.max(0, baseValue - 1.28 * uncertainty));
      p90.push(Math.max(0, baseValue + 1.28 * uncertainty));
    }
    
    // Calculate accuracy using proper backtesting
    const accuracy = await this.calculateBacktestAccuracy(historicalData);
    
    return {
      median,
      p10,
      p90,
      metadata: {
        model: "level-seasonal-with-residuals",
        accuracy,
        notes: `Forecast based on ${historicalData.length} historical data points with ${residuals.length} residuals`,
      },
    };
  }
  
  /**
   * Generate baseline forecast for SKUs with limited data
   */
  private generateBaseline(historicalData: Array<{ timestamp: Date; quantity: number }>, horizonHours: number): ForecastResult {
    const forecastPoints = Math.ceil(horizonHours / 24);
    
    // Use median of recent data if available, otherwise conservative baseline
    let baseValue = 5;
    if (historicalData.length > 0) {
      const quantities = historicalData.map(d => d.quantity).sort((a, b) => a - b);
      const medianIndex = Math.floor(quantities.length / 2);
      baseValue = quantities.length % 2 === 0 
        ? (quantities[medianIndex - 1] + quantities[medianIndex]) / 2
        : quantities[medianIndex];
      baseValue = Math.max(1, baseValue); // Ensure positive baseline
    }
    
    return {
      median: Array(forecastPoints).fill(baseValue),
      p10: Array(forecastPoints).fill(baseValue * 0.6),
      p90: Array(forecastPoints).fill(baseValue * 1.8),
      metadata: {
        model: "baseline-median",
        accuracy: 60, // Conservative accuracy estimate for baseline
        notes: `Insufficient historical data - using ${historicalData.length > 0 ? 'median' : 'default'} baseline forecast`,
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
   * Detect weekly seasonality patterns as deviations from mean
   */
  private detectSeasonality(data: Array<{ timestamp: Date; quantity: number }>, overallMean: number): number[] {
    const weeklyPattern = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    data.forEach(({ timestamp, quantity }) => {
      const dayOfWeek = timestamp.getDay();
      weeklyPattern[dayOfWeek] += quantity;
      weeklyCounts[dayOfWeek]++;
    });
    
    // Calculate average for each day of week, then subtract overall mean to get deviations
    return weeklyPattern.map((total, i) => {
      if (weeklyCounts[i] === 0) return 0;
      const dayAverage = total / weeklyCounts[i];
      return dayAverage - overallMean; // Mean-centered seasonality
    });
  }
  
  /**
   * Calculate residuals from level + seasonal model
   */
  private calculateResiduals(data: Array<{ timestamp: Date; quantity: number }>, mean: number, seasonalityDeviations: number[]): number[] {
    return data.map(({ timestamp, quantity }) => {
      const dayOfWeek = timestamp.getDay();
      const predicted = mean + seasonalityDeviations[dayOfWeek];
      return quantity - predicted;
    });
  }
  
  /**
   * Calculate forecast accuracy using backtesting
   */
  private async calculateBacktestAccuracy(data: Array<{ timestamp: Date; quantity: number }>): Promise<number> {
    if (data.length < 14) return 70; // Default for insufficient data
    
    // Hold out last 7 days for testing
    const trainData = data.slice(0, -7);
    const testData = data.slice(-7);
    
    if (trainData.length < 7) return 70;
    
    const trainQuantities = trainData.map(d => d.quantity);
    const trainMean = this.calculateMean(trainQuantities);
    const trainSeasonality = this.detectSeasonality(trainData, trainMean);
    
    // Generate forecasts for test period
    const lastTrainTimestamp = trainData[trainData.length - 1].timestamp;
    const startDay = (lastTrainTimestamp.getDay() + 1) % 7;
    
    let totalAPE = 0;
    let validPredictions = 0;
    
    for (let i = 0; i < testData.length; i++) {
      const dayOfWeek = (startDay + i) % 7;
      const forecast = trainMean + trainSeasonality[dayOfWeek];
      const actual = testData[i].quantity;
      
      if (actual > 0) {
        const ape = Math.abs((forecast - actual) / actual);
        totalAPE += ape;
        validPredictions++;
      }
    }
    
    if (validPredictions === 0) return 70;
    
    const mape = totalAPE / validPredictions;
    return Math.max(0, Math.min(100, (1 - mape) * 100)); // Convert to accuracy percentage
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
        const leadTimeDemand = medianForecast.slice(0, Math.min(leadTimeDays, medianForecast.length)).reduce((sum, val) => sum + val, 0);
        const conservativeDemand = p90Forecast.slice(0, Math.min(leadTimeDays, p90Forecast.length)).reduce((sum, val) => sum + val, 0);
        
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
