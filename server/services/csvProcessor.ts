import { parse } from 'csv-parse/sync';
import { storage } from '../storage';
import { insertSalesSchema, insertInventorySchema, insertSkuSchema } from '@shared/schema';
import type { InsertSales, InsertInventory, InsertSku } from '@shared/schema';
import { z } from 'zod';

interface CSVProcessorOptions {
  organizationId: string;
  type: 'sales' | 'inventory' | 'skus';
  skipFirstRow?: boolean;
}

interface ProcessResult {
  recordsProcessed: number;
  recordsTotal: number;
  errors: string[];
}

class CSVProcessor {
  /**
   * Process CSV data based on type
   */
  async processCSV(csvContent: string, options: CSVProcessorOptions): Promise<ProcessResult> {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      switch (options.type) {
        case 'sales':
          return await this.processSalesCSV(records, options.organizationId);
        case 'inventory':
          return await this.processInventoryCSV(records, options.organizationId);
        case 'skus':
          return await this.processSkusCSV(records, options.organizationId);
        default:
          throw new Error(`Unsupported CSV type: ${options.type}`);
      }
    } catch (error) {
      throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process sales/POS CSV data
   * Expected format: store_id,order_id,timestamp,sku_code,qty,price,promo_flag
   */
  private async processSalesCSV(records: any[], organizationId: string): Promise<ProcessResult> {
    const errors: string[] = [];
    const validSales: InsertSales[] = [];

    // Get organization stores and SKUs for validation
    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    const storeMap = new Map(stores.map(s => [s.code, s.id]));
    const skuMap = new Map(skus.map(s => [s.code, s.id]));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (!record.store_id || !record.sku_code || !record.timestamp || !record.qty) {
          errors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Validate store exists
        const storeId = storeMap.get(record.store_id);
        if (!storeId) {
          errors.push(`Row ${rowNum}: Store '${record.store_id}' not found`);
          continue;
        }

        // Validate SKU exists
        const skuId = skuMap.get(record.sku_code);
        if (!skuId) {
          errors.push(`Row ${rowNum}: SKU '${record.sku_code}' not found`);
          continue;
        }

        // Parse timestamp
        const timestamp = new Date(record.timestamp);
        if (isNaN(timestamp.getTime())) {
          errors.push(`Row ${rowNum}: Invalid timestamp format`);
          continue;
        }

        // Parse quantity
        const quantity = parseInt(record.qty);
        if (isNaN(quantity) || quantity < 0) {
          errors.push(`Row ${rowNum}: Invalid quantity`);
          continue;
        }

        // Parse price (optional)
        let price = null;
        if (record.price) {
          const parsedPrice = parseFloat(record.price);
          if (!isNaN(parsedPrice)) {
            price = parsedPrice.toString();
          }
        }

        // Validate with Zod schema
        const salesData = {
          storeId,
          skuId,
          orderId: record.order_id || null,
          timestamp,
          quantity,
          price,
          promoFlag: record.promo_flag === '1' || record.promo_flag?.toLowerCase() === 'true',
        };

        const validationResult = insertSalesSchema.safeParse(salesData);
        if (!validationResult.success) {
          errors.push(`Row ${rowNum}: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        validSales.push(validationResult.data);

      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    }

    // Insert valid sales records in batches
    if (validSales.length > 0) {
      await storage.insertSales(validSales);
    }

    return {
      recordsProcessed: validSales.length,
      recordsTotal: records.length,
      errors,
    };
  }

  /**
   * Process inventory CSV data
   * Expected format: store_id,sku_code,on_hand,reserved,last_counted_at
   */
  private async processInventoryCSV(records: any[], organizationId: string): Promise<ProcessResult> {
    const errors: string[] = [];
    let processedCount = 0;

    // Get organization stores and SKUs for validation
    const stores = await storage.getStoresByOrganization(organizationId);
    const skus = await storage.getSkusByOrganization(organizationId);
    
    const storeMap = new Map(stores.map(s => [s.code, s.id]));
    const skuMap = new Map(skus.map(s => [s.code, s.id]));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (!record.store_id || !record.sku_code || record.on_hand === undefined) {
          errors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Validate store exists
        const storeId = storeMap.get(record.store_id);
        if (!storeId) {
          errors.push(`Row ${rowNum}: Store '${record.store_id}' not found`);
          continue;
        }

        // Validate SKU exists
        const skuId = skuMap.get(record.sku_code);
        if (!skuId) {
          errors.push(`Row ${rowNum}: SKU '${record.sku_code}' not found`);
          continue;
        }

        // Parse quantities
        const onHand = parseInt(record.on_hand);
        if (isNaN(onHand) || onHand < 0) {
          errors.push(`Row ${rowNum}: Invalid on_hand quantity`);
          continue;
        }

        const reserved = parseInt(record.reserved || '0');
        if (isNaN(reserved) || reserved < 0) {
          errors.push(`Row ${rowNum}: Invalid reserved quantity`);
          continue;
        }

        // Parse last counted date (optional)
        let lastCountedAt = null;
        if (record.last_counted_at) {
          const countedDate = new Date(record.last_counted_at);
          if (!isNaN(countedDate.getTime())) {
            lastCountedAt = countedDate;
          }
        }

        // Validate with Zod schema
        const inventoryData = {
          storeId,
          skuId,
          onHand,
          reserved,
          lastCountedAt,
        };

        const validationResult = insertInventorySchema.safeParse(inventoryData);
        if (!validationResult.success) {
          errors.push(`Row ${rowNum}: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        await storage.upsertInventory(validationResult.data);

        processedCount++;

      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    }

    return {
      recordsProcessed: processedCount,
      recordsTotal: records.length,
      errors,
    };
  }

  /**
   * Process SKUs CSV data
   * Expected format: sku_code,name,category,weight,shelf_life_days,lead_time_days,supplier_name,price
   */
  private async processSkusCSV(records: any[], organizationId: string): Promise<ProcessResult> {
    const errors: string[] = [];
    let processedCount = 0;

    // Get organization suppliers for validation
    const suppliers = await storage.getSuppliersByOrganization(organizationId);
    const supplierMap = new Map(suppliers.map(s => [s.name, s.id]));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (!record.sku_code || !record.name) {
          errors.push(`Row ${rowNum}: Missing required fields (sku_code, name)`);
          continue;
        }

        // Parse optional numeric fields
        let weight = null;
        if (record.weight) {
          const parsedWeight = parseFloat(record.weight);
          if (!isNaN(parsedWeight)) {
            weight = parsedWeight.toString();
          }
        }

        let price = null;
        if (record.price) {
          const parsedPrice = parseFloat(record.price);
          if (!isNaN(parsedPrice)) {
            price = parsedPrice.toString();
          }
        }

        let shelfLifeDays = null;
        if (record.shelf_life_days) {
          const parsed = parseInt(record.shelf_life_days);
          if (!isNaN(parsed)) {
            shelfLifeDays = parsed;
          }
        }

        let leadTimeDays = null;
        if (record.lead_time_days) {
          const parsed = parseInt(record.lead_time_days);
          if (!isNaN(parsed)) {
            leadTimeDays = parsed;
          }
        }

        // Find supplier ID
        let supplierId = null;
        if (record.supplier_name) {
          supplierId = supplierMap.get(record.supplier_name) || null;
        }

        // Validate with Zod schema
        const skuData = {
          organizationId,
          code: record.sku_code,
          name: record.name,
          category: record.category || null,
          weight,
          shelfLifeDays,
          leadTimeDays,
          supplierId,
          price,
          isActive: true,
        };

        const validationResult = insertSkuSchema.safeParse(skuData);
        if (!validationResult.success) {
          errors.push(`Row ${rowNum}: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        await storage.createSku(validationResult.data);

        processedCount++;

      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    }

    return {
      recordsProcessed: processedCount,
      recordsTotal: records.length,
      errors,
    };
  }

  /**
   * Validate CSV format and return sample data - FLEXIBLE VERSION
   */
  validateCSVFormat(csvContent: string, type: string): { isValid: boolean; errors: string[]; sample: any[] } {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const errors: string[] = [];
      
      if (records.length === 0) {
        errors.push('CSV file is empty or has no valid records');
        return { isValid: false, errors, sample: [] };
      }

      // BYPASS: Accept any CSV format - just show expected formats as info
      const expectedFormats: Record<string, string[]> = {
        sales: ['store_id', 'sku_code', 'timestamp', 'qty'],
        inventory: ['store_id', 'sku_code', 'on_hand'],
        skus: ['sku_code', 'name'],
      };

      const firstRecord = records[0] as Record<string, any>;
      const currentColumns = Object.keys(firstRecord);
      
      // Show informational message about expected vs actual columns
      if (expectedFormats[type]) {
        const expectedCols = expectedFormats[type];
        const hasExpectedCols = expectedCols.every(col => col in firstRecord);
        
        if (!hasExpectedCols) {
          // Don't fail - just provide info
          errors.push(`Info: For ${type} data, expected columns are: ${expectedCols.join(', ')}. Your CSV has: ${currentColumns.join(', ')}`);
        }
      }

      return {
        isValid: true, // Always pass validation now
        errors, // Show as info, not errors
        sample: records.slice(0, 5), // Return first 5 records as sample
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sample: [],
      };
    }
  }
}

export const csvProcessor = new CSVProcessor();
