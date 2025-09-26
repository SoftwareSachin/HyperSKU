import { storage } from '../storage';
import type { InsertAnomaly } from '@shared/schema';

interface AnomalyDetectionResult {
  anomalies: InsertAnomaly[];
  summary: {
    total: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
}

class AnomalyDetectionService {
  /**
   * Run anomaly detection for a store
   */
  async detectAnomalies(storeId: string): Promise<AnomalyDetectionResult> {
    const anomalies: InsertAnomaly[] = [];

    try {
      // Get historical sales data for analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // 30 days

      const salesData = await storage.getSalesByStore(storeId, startDate, endDate);
      
      // Group sales by SKU
      const skuSalesMap = new Map<string, Array<{ timestamp: Date; quantity: number }>>();
      
      salesData.forEach(sale => {
        if (!skuSalesMap.has(sale.skuId)) {
          skuSalesMap.set(sale.skuId, []);
        }
        skuSalesMap.get(sale.skuId)!.push({
          timestamp: sale.timestamp,
          quantity: sale.quantity,
        });
      });

      // Run anomaly detection for each SKU
      for (const [skuId, sales] of Array.from(skuSalesMap.entries())) {
        const skuAnomalies = await this.detectSkuAnomalies(storeId, skuId, sales);
        anomalies.push(...skuAnomalies);
      }

      // Check for inventory anomalies
      const inventoryAnomalies = await this.detectInventoryAnomalies(storeId);
      anomalies.push(...inventoryAnomalies);

      // Calculate summary
      const summary = {
        total: anomalies.length,
        highSeverity: anomalies.filter(a => a.severity === 'high').length,
        mediumSeverity: anomalies.filter(a => a.severity === 'medium').length,
        lowSeverity: anomalies.filter(a => a.severity === 'low').length,
      };

      return { anomalies, summary };

    } catch (error) {
      console.error(`Error detecting anomalies for store ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Detect anomalies for a specific SKU
   */
  private async detectSkuAnomalies(
    storeId: string,
    skuId: string,
    sales: Array<{ timestamp: Date; quantity: number }>
  ): Promise<InsertAnomaly[]> {
    const anomalies: InsertAnomaly[] = [];

    if (sales.length < 7) {
      return anomalies; // Not enough data
    }

    // Sort sales by timestamp
    sales.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate daily aggregates
    const dailySales = this.aggregateByDay(sales);
    const quantities = dailySales.map(d => d.quantity);

    // Calculate statistics
    const mean = this.calculateMean(quantities);
    const std = this.calculateStandardDeviation(quantities, mean);
    const threshold = mean + 2 * std; // 2 standard deviations

    // Detect demand spikes
    const recentSales = dailySales.slice(-3); // Last 3 days
    for (const daySales of recentSales) {
      if (daySales.quantity > threshold && daySales.quantity > mean * 2) {
        anomalies.push({
          storeId,
          skuId,
          type: 'demand_spike',
          severity: daySales.quantity > mean * 3 ? 'high' : 'medium',
          description: `Demand spike detected: ${daySales.quantity} units (${Math.round((daySales.quantity / mean - 1) * 100)}% above average)`,
          status: 'pending',
        });
      }
    }

    // Detect demand drops
    const recentAvg = this.calculateMean(recentSales.map(d => d.quantity));
    if (recentAvg < mean * 0.3 && mean > 5) {
      anomalies.push({
        storeId,
        skuId,
        type: 'demand_drop',
        severity: recentAvg < mean * 0.1 ? 'high' : 'medium',
        description: `Significant demand drop detected: ${Math.round((1 - recentAvg / mean) * 100)}% below average`,
        status: 'pending',
      });
    }

    // Detect unusual patterns (weekday vs weekend)
    const weekdayPattern = this.analyzeWeekdayPattern(sales);
    if (weekdayPattern.anomaly) {
      anomalies.push({
        storeId,
        skuId,
        type: 'pattern_change',
        severity: 'medium',
        description: weekdayPattern.description,
        status: 'pending',
      });
    }

    return anomalies;
  }

  /**
   * Detect inventory-related anomalies
   */
  private async detectInventoryAnomalies(storeId: string): Promise<InsertAnomaly[]> {
    const anomalies: InsertAnomaly[] = [];

    try {
      const inventoryItems = await storage.getInventoryByStore(storeId);

      for (const inv of inventoryItems) {
        // Check for negative stock
        if ((inv.onHand || 0) < 0) {
          anomalies.push({
            storeId,
            skuId: inv.skuId,
            type: 'negative_stock',
            severity: 'high',
            description: `Negative stock detected: ${inv.onHand} units`,
            status: 'pending',
          });
        }

        // Check for stale inventory (not counted recently)
        if (inv.lastCountedAt) {
          const daysSinceCount = Math.floor(
            (Date.now() - inv.lastCountedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceCount > 30) {
            anomalies.push({
              storeId,
              skuId: inv.skuId,
              type: 'stale_inventory',
              severity: daysSinceCount > 60 ? 'medium' : 'low',
              description: `Inventory not counted for ${daysSinceCount} days`,
              status: 'pending',
            });
          }
        }

        // Check for excessive reserved stock
        const onHand = inv.onHand || 0;
        const reserved = inv.reserved || 0;
        if (reserved > onHand * 0.8 && onHand > 0) {
          anomalies.push({
            storeId,
            skuId: inv.skuId,
            type: 'excessive_reserved',
            severity: 'medium',
            description: `High reserved stock: ${reserved}/${onHand} units (${Math.round((reserved / onHand) * 100)}%)`,
            status: 'pending',
          });
        }
      }

    } catch (error) {
      console.error(`Error detecting inventory anomalies:`, error);
    }

    return anomalies;
  }

  /**
   * Aggregate sales data by day
   */
  private aggregateByDay(sales: Array<{ timestamp: Date; quantity: number }>): Array<{ date: string; quantity: number }> {
    const dailyMap = new Map<string, number>();

    sales.forEach(sale => {
      const dateKey = sale.timestamp.toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + sale.quantity);
    });

    return Array.from(dailyMap.entries()).map(([date, quantity]) => ({
      date,
      quantity,
    })).sort((a, b) => a.date.localeCompare(b.date));
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
   * Analyze weekday vs weekend patterns
   */
  private analyzeWeekdayPattern(sales: Array<{ timestamp: Date; quantity: number }>): {
    anomaly: boolean;
    description: string;
  } {
    const weekdaySales: number[] = [];
    const weekendSales: number[] = [];

    sales.forEach(sale => {
      const dayOfWeek = sale.timestamp.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendSales.push(sale.quantity);
      } else {
        weekdaySales.push(sale.quantity);
      }
    });

    if (weekdaySales.length < 3 || weekendSales.length < 2) {
      return { anomaly: false, description: '' };
    }

    const weekdayAvg = this.calculateMean(weekdaySales);
    const weekendAvg = this.calculateMean(weekendSales);

    // Check for unusual weekend vs weekday patterns
    const ratio = weekendAvg / weekdayAvg;
    
    if (ratio > 2) {
      return {
        anomaly: true,
        description: `Unusual weekend pattern: ${Math.round((ratio - 1) * 100)}% higher than weekdays`,
      };
    }

    if (ratio < 0.3) {
      return {
        anomaly: true,
        description: `Unusual weekend pattern: ${Math.round((1 - ratio) * 100)}% lower than weekdays`,
      };
    }

    return { anomaly: false, description: '' };
  }

  /**
   * Process anomaly action (accept/ignore)
   */
  async processAnomalyAction(anomalyId: string, action: 'accept' | 'ignore'): Promise<void> {
    try {
      const status = action === 'accept' ? 'accepted' : 'ignored';
      await storage.updateAnomalyStatus(anomalyId, status);
    } catch (error) {
      console.error(`Error processing anomaly action:`, error);
      throw error;
    }
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
