// Using javascript_sendgrid integration
import { MailService } from '@sendgrid/mail';
import { storage } from '../storage';
import type { Store, Sku, Forecast, Reorder, Anomaly, User, Inventory } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not configured - email notifications disabled');
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationSettings {
  stockoutAlerts: boolean;
  anomalyAlerts: boolean;
  weeklyReports: boolean;
  forecastAccuracyAlerts: boolean;
  email: string;
}

// Typed interfaces for notification data
interface CriticalSkuData {
  sku: Sku;
  store: Store;
  inventory: Inventory;
  forecast?: Forecast;
}

interface AnomalyData {
  anomaly: Anomaly;
  sku: Sku;
  store: Store;
}

interface LowAccuracyForecastData {
  forecast: Forecast;
  sku: Sku;
  store: Store;
}

class NotificationService {
  private fromEmail = 'noreply@hyperlocal-forecast.com';

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid not configured, skipping email:', notification.subject);
      return false;
    }

    try {
      await mailService.send({
        to: notification.to,
        from: this.fromEmail,
        subject: notification.subject,
        html: notification.html,
        text: notification.text || notification.html.replace(/<[^>]*>/g, ''),
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Send stockout alert for critical inventory levels
   */
  async sendStockoutAlert(organizationId: string, criticalSkus: CriticalSkuData[]) {
    const orgUsers = await storage.getUsersByOrganization(organizationId);
    const alertUsers = orgUsers.filter(user => 
      ['admin', 'manager'].includes(user.role || '') && user.email
    );

    if (alertUsers.length === 0) return;

    const skuRows = criticalSkus.map(({sku, store, inventory, forecast}) => {
      const daysLeft = Math.floor((inventory.onHand || 0) / (Array.isArray(forecast?.medianForecast) ? forecast.medianForecast[0] || 1 : 1));
      return `
        <tr>
          <td>${store.code}</td>
          <td>${sku.code}</td>
          <td>${sku.name}</td>
          <td>${inventory.onHand || 0}</td>
          <td style="color: red; font-weight: bold;">${daysLeft} days</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚨 Critical Stock Alert</h2>
        <p>The following SKUs are at critical inventory levels and require immediate attention:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Store</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">SKU Code</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Stock</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Days Left</th>
            </tr>
          </thead>
          <tbody>
            ${skuRows}
          </tbody>
        </table>
        
        <p>Please review and initiate purchase orders as needed.</p>
        <p><strong>HyperLocal Forecast Platform</strong></p>
      </div>
    `;

    for (const user of alertUsers) {
      await this.sendEmail({
        to: user.email!,
        subject: `🚨 Critical Stock Alert - ${criticalSkus.length} SKUs Need Attention`,
        html,
      });
    }
  }

  /**
   * Send anomaly detection alert
   */
  async sendAnomalyAlert(organizationId: string, anomalies: AnomalyData[]) {
    const orgUsers = await storage.getUsersByOrganization(organizationId);
    const alertUsers = orgUsers.filter(user => 
      ['admin', 'manager', 'analyst'].includes(user.role || '') && user.email
    );

    if (alertUsers.length === 0) return;

    const anomalyRows = anomalies.map(({anomaly, sku, store}) => {
      const severity = anomaly.severity || 'medium';
      const severityColor = severity === 'high' ? '#e74c3c' : severity === 'medium' ? '#f39c12' : '#3498db';
      
      return `
        <tr>
          <td>${store.code}</td>
          <td>${sku.code}</td>
          <td>${sku.name}</td>
          <td style="color: ${severityColor}; font-weight: bold;">${severity.toUpperCase()}</td>
          <td>${anomaly.type}</td>
          <td>${anomaly.detectedAt?.toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">📊 Demand Anomaly Alert</h2>
        <p>Unusual demand patterns have been detected for the following SKUs:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Store</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">SKU Code</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Severity</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${anomalyRows}
          </tbody>
        </table>
        
        <p>Please review these patterns and adjust forecasts if needed.</p>
        <p><strong>HyperLocal Forecast Platform</strong></p>
      </div>
    `;

    for (const user of alertUsers) {
      await this.sendEmail({
        to: user.email!,
        subject: `📊 Demand Anomaly Alert - ${anomalies.length} SKUs with Unusual Patterns`,
        html,
      });
    }
  }

  /**
   * Send forecast accuracy alert when models perform poorly
   */
  async sendForecastAccuracyAlert(organizationId: string, lowAccuracyForecasts: LowAccuracyForecastData[]) {
    const orgUsers = await storage.getUsersByOrganization(organizationId);
    const alertUsers = orgUsers.filter(user => 
      ['admin', 'manager'].includes(user.role || '') && user.email
    );

    if (alertUsers.length === 0) return;

    const forecastRows = lowAccuracyForecasts.map(({forecast, sku, store}) => {
      const accuracy = (forecast.metadata as any)?.accuracy || 0;
      return `
        <tr>
          <td>${store.code}</td>
          <td>${sku.code}</td>
          <td>${sku.name}</td>
          <td style="color: #e74c3c; font-weight: bold;">${(accuracy * 100).toFixed(1)}%</td>
          <td>${(forecast.metadata as any)?.model || 'Unknown'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">📈 Forecast Accuracy Alert</h2>
        <p>The following forecasts have accuracy below 70% and may need model adjustment:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Store</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">SKU Code</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Accuracy</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Model</th>
            </tr>
          </thead>
          <tbody>
            ${forecastRows}
          </tbody>
        </table>
        
        <p>Consider reviewing these forecasts and optimizing the models.</p>
        <p><strong>HyperLocal Forecast Platform</strong></p>
      </div>
    `;

    for (const user of alertUsers) {
      await this.sendEmail({
        to: user.email!,
        subject: `📈 Low Forecast Accuracy Alert - ${lowAccuracyForecasts.length} Models Need Attention`,
        html,
      });
    }
  }

  /**
   * Send weekly summary report
   */
  async sendWeeklySummary(organizationId: string) {
    const orgUsers = await storage.getUsersByOrganization(organizationId);
    const reportUsers = orgUsers.filter(user => 
      ['admin', 'manager'].includes(user.role || '') && user.email
    );

    if (reportUsers.length === 0) return;

    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    // Get recent forecasts and reorders
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let totalForecasts = 0;
    let totalReorders = 0;
    let totalAnomalies = 0;
    
    for (const store of stores) {
      const storeForecasts = await storage.getForecastsByStore(store.id);
      const storeReorders = await storage.getReordersByStore(store.id);
      const storeAnomalies = await storage.getAnomaliesByStore(store.id);
      
      totalForecasts += storeForecasts.filter(f => f.generatedAt && f.generatedAt >= weekAgo).length;
      totalReorders += storeReorders.filter(r => r.createdAt && r.createdAt >= weekAgo).length;
      totalAnomalies += storeAnomalies.filter(a => a.detectedAt && a.detectedAt >= weekAgo).length;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📊 Weekly Forecast Summary</h2>
        <p>Here's your inventory forecasting summary for the past week:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Key Metrics</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">🏪 <strong>${stores.length}</strong> stores monitored</li>
            <li style="margin: 10px 0;">📦 <strong>${skus.length}</strong> SKUs tracked</li>
            <li style="margin: 10px 0;">📈 <strong>${totalForecasts}</strong> forecasts generated</li>
            <li style="margin: 10px 0;">🛒 <strong>${totalReorders}</strong> purchase orders suggested</li>
            <li style="margin: 10px 0;">⚠️ <strong>${totalAnomalies}</strong> anomalies detected</li>
          </ul>
        </div>
        
        <p>Log in to your dashboard to review detailed reports and take action on recommendations.</p>
        <p><strong>HyperLocal Forecast Platform</strong></p>
      </div>
    `;

    for (const user of reportUsers) {
      await this.sendEmail({
        to: user.email!,
        subject: `📊 Weekly Forecast Summary - ${stores.length} Stores, ${totalForecasts} Forecasts`,
        html,
      });
    }
  }

  /**
   * Run daily checks for critical alerts
   */
  async runDailyChecks(organizationId: string) {
    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    const criticalSkus = [];
    const recentAnomalies = [];
    const lowAccuracyForecasts = [];
    
    for (const store of stores) {
      // Check for critical stock levels
      const inventory = await storage.getInventoryByStore(store.id);
      const forecasts = await storage.getForecastsByStore(store.id);
      
      for (const inv of inventory) {
        const sku = skus.find(s => s.id === inv.skuId);
        const forecast = forecasts.find(f => f.skuId === inv.skuId);
        
        if (sku && forecast && inv.onHand !== null) {
          const dailyDemand = Array.isArray(forecast.medianForecast) ? forecast.medianForecast[0] || 0 : 0;
          const daysLeft = dailyDemand > 0 ? inv.onHand / dailyDemand : 999;
          
          if (daysLeft <= 3) {  // Critical if less than 3 days
            criticalSkus.push({ sku, store, inventory: inv, forecast });
          }
        }
      }
      
      // Check for recent anomalies
      const anomalies = await storage.getAnomaliesByStore(store.id);
      const yesterdayAnomalies = anomalies.filter(a => 
        a.detectedAt && a.detectedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      for (const anomaly of yesterdayAnomalies) {
        const sku = skus.find(s => s.id === anomaly.skuId);
        if (sku) {
          recentAnomalies.push({ anomaly, sku, store });
        }
      }
      
      // Check for low accuracy forecasts
      for (const forecast of forecasts) {
        const accuracy = (forecast.metadata as any)?.accuracy as number;
        if (accuracy && accuracy < 0.7) {  // Less than 70% accuracy
          const sku = skus.find(s => s.id === forecast.skuId);
          if (sku) {
            lowAccuracyForecasts.push({ forecast, sku, store });
          }
        }
      }
    }
    
    // Send alerts if any critical issues found
    if (criticalSkus.length > 0) {
      await this.sendStockoutAlert(organizationId, criticalSkus);
    }
    
    if (recentAnomalies.length > 0) {
      await this.sendAnomalyAlert(organizationId, recentAnomalies);
    }
    
    if (lowAccuracyForecasts.length > 0) {
      await this.sendForecastAccuracyAlert(organizationId, lowAccuracyForecasts);
    }
  }
}

export const notificationService = new NotificationService();
