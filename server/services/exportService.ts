import { storage } from '../storage';
import type { Store, Sku, Forecast, Reorder } from '@shared/schema';

interface ExportOptions {
  format: 'csv' | 'pdf';
  organizationId: string;
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
}

class ExportService {
  /**
   * Export forecasts to CSV format
   */
  async exportForecastsCSV(options: ExportOptions): Promise<string> {
    const { organizationId, storeId } = options;
    
    // Get forecasts based on filters
    let forecasts;
    if (storeId) {
      forecasts = await storage.getForecastsByStore(storeId);
    } else {
      // Get all stores for organization and their forecasts
      const stores = await storage.getStoresByOrganization(organizationId);
      forecasts = [];
      for (const store of stores) {
        const storeForecasts = await storage.getForecastsByStore(store.id);
        forecasts.push(...storeForecasts);
      }
    }
    
    // Get related data
    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    const storeMap = new Map(stores.map(s => [s.id, s]));
    const skuMap = new Map(skus.map(s => [s.id, s]));
    
    // Generate CSV headers
    const headers = [
      'Store Code',
      'Store Name', 
      'SKU Code',
      'SKU Name',
      'Forecast Date',
      'Horizon (Hours)',
      'Median Forecast (JSON)',
      'P10 Forecast (JSON)',
      'P90 Forecast (JSON)',
      'Model',
      'Accuracy (%)',
      'Notes'
    ];
    
    // Generate CSV rows
    const rows = forecasts.map(forecast => {
      const store = storeMap.get(forecast.storeId);
      const sku = skuMap.get(forecast.skuId);
      const metadata = forecast.metadata as any;
      
      return [
        store?.code || '',
        store?.name || '',
        sku?.code || '',
        sku?.name || '',
        forecast.generatedAt?.toISOString() || '',
        forecast.horizonHours.toString(),
        JSON.stringify(forecast.medianForecast),
        JSON.stringify(forecast.p10Forecast),
        JSON.stringify(forecast.p90Forecast),
        metadata?.model || '',
        metadata?.accuracy?.toString() || '',
        metadata?.notes || ''
      ];
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  /**
   * Export reorder suggestions to CSV format
   */
  async exportReordersCSV(options: ExportOptions): Promise<string> {
    const { organizationId, storeId } = options;
    
    // Get reorders based on filters
    let reorders;
    if (storeId) {
      reorders = await storage.getReordersByStore(storeId);
    } else {
      // Get all stores for organization and their reorders
      const stores = await storage.getStoresByOrganization(organizationId);
      reorders = [];
      for (const store of stores) {
        const storeReorders = await storage.getReordersByStore(store.id);
        reorders.push(...storeReorders);
      }
    }
    
    // Get related data
    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    const storeMap = new Map(stores.map(s => [s.id, s]));
    const skuMap = new Map(skus.map(s => [s.id, s]));
    
    // Generate CSV headers
    const headers = [
      'Store Code',
      'Store Name',
      'SKU Code', 
      'SKU Name',
      'Suggested Quantity',
      'Safety Stock',
      'Lead Time (Days)',
      'Status',
      'Created Date',
      'Rationale Type',
      'Lead Time Demand',
      'Available Stock',
      'Reorder Point',
      'Alternative Quantity'
    ];
    
    // Generate CSV rows
    const rows = reorders.map(reorder => {
      const store = storeMap.get(reorder.storeId);
      const sku = skuMap.get(reorder.skuId);
      const rationale = reorder.rationaleJson as any;
      
      return [
        store?.code || '',
        store?.name || '',
        sku?.code || '',
        sku?.name || '',
        reorder.suggestedQty.toString(),
        reorder.safetyStock?.toString() || '',
        reorder.leadTimeDays?.toString() || '',
        reorder.status || '',
        reorder.createdAt?.toISOString() || '',
        rationale?.type || '',
        rationale?.leadTimeDemand?.toString() || '',
        rationale?.availableStock?.toString() || '',
        rationale?.reorderPoint?.toString() || '',
        rationale?.alternatives?.aggressive?.toString() || ''
      ];
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  /**
   * Generate PDF export (simplified implementation)
   */
  async exportToPDF(data: any[], title: string): Promise<string> {
    // This is a simplified PDF implementation
    // In production, you would use a library like puppeteer or jsPDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-top: 30px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <strong>Summary:</strong> ${data.length} records exported
      </div>
      
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>`;
    
    return htmlContent;
  }
  
  /**
   * Export inventory report
   */
  async exportInventoryCSV(storeId: string, organizationId: string): Promise<string> {
    const inventory = await storage.getInventoryByStore(storeId);
    const skus = await storage.getSkusByOrganization(organizationId);
    const store = await storage.getStore(storeId);
    
    const skuMap = new Map(skus.map(s => [s.id, s]));
    
    const headers = [
      'Store Code',
      'Store Name',
      'SKU Code',
      'SKU Name',
      'Category',
      'On Hand',
      'Reserved',
      'Available',
      'Last Counted',
      'Stock Value ($)',
      'Lead Time (Days)'
    ];
    
    const rows = inventory.map(inv => {
      const sku = skuMap.get(inv.skuId);
      const available = (inv.onHand || 0) - (inv.reserved || 0);
      const stockValue = available * parseFloat(sku?.price || '0');
      
      return [
        store?.code || '',
        store?.name || '',
        sku?.code || '',
        sku?.name || '',
        sku?.category || '',
        inv.onHand?.toString() || '0',
        inv.reserved?.toString() || '0',
        available.toString(),
        inv.lastCountedAt?.toISOString().split('T')[0] || '',
        stockValue.toFixed(2),
        sku?.leadTimeDays?.toString() || ''
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}

export const exportService = new ExportService();
