// services/googleSheetsSyncService.ts

import { 
  GoogleSheetsResponse, 
  SyncResult,
  ColumnMapping,
  DEFAULT_COLUMN_MAPPING,
  GoogleSheetsSyncConfig
} from '@/types/googleSheets';
import { OrderUploadData } from '@/types/order';
import { uploadOrders } from '@/lib/firebase/orders';
import { updateSyncStatus } from './googleSheetsService';

export async function fetchGoogleSheetsData(
  sheetId: string,
  range: string,
  apiKey: string
): Promise<GoogleSheetsResponse> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

function parseGoogleSheetsRows(
  rows: string[][],
  mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING
): OrderUploadData[] {
  const dataRows = rows.slice(1);
  const orders: OrderUploadData[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    if (!row || row.length < 5) continue;

    const order: OrderUploadData = {
      customerName: String(row[mapping.customerName] || '').trim(),
      phone: String(row[mapping.phone] || '').trim(),
      address: String(row[mapping.address] || '').trim(),
      product: String(row[mapping.product] || '').trim(),
      price: row[mapping.price] || 0,
    };

    if (mapping.status !== undefined && row[mapping.status]) {
      order.status = String(row[mapping.status]).trim();
    }
    if (mapping.shippingCompany !== undefined && row[mapping.shippingCompany]) {
      order.shippingCompany = String(row[mapping.shippingCompany]).trim();
    }
    if (mapping.trackingNumber !== undefined && row[mapping.trackingNumber]) {
      order.trackingNumber = String(row[mapping.trackingNumber]).trim();
    }
    if (mapping.notes !== undefined && row[mapping.notes]) {
      order.notes = String(row[mapping.notes]).trim();
    }

    if (order.customerName && order.phone && order.address) {
      orders.push(order);
    }
  }

  return orders;
}

export async function syncOrdersFromGoogleSheets(
  config: GoogleSheetsSyncConfig,
  tenantId: string,
  userId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    newOrders: 0,
    updatedOrders: 0,
    errors: [],
    message: ''
  };

  try {
    const sheetsData = await fetchGoogleSheetsData(
      config.sheetId,
      config.range,
      config.apiKey
    );

    if (!sheetsData.values || sheetsData.values.length === 0) {
      result.message = 'لا توجد بيانات في Google Sheet';
      return result;
    }

    const orders = parseGoogleSheetsRows(sheetsData.values, DEFAULT_COLUMN_MAPPING);

    if (orders.length === 0) {
      result.message = 'لم يتم العثور على طلبات صالحة';
      return result;
    }

    const uploadResult = await uploadOrders(orders, tenantId, userId);

    result.success = uploadResult.success > 0;
    result.newOrders = uploadResult.success;
    result.errors = uploadResult.errors;
    
    if (uploadResult.success > 0 && uploadResult.failed === 0) {
      result.message = `تم مزامنة ${uploadResult.success} طلب بنجاح`;
    } else if (uploadResult.success > 0 && uploadResult.failed > 0) {
      result.message = `تم مزامنة ${uploadResult.success} طلب، وفشل ${uploadResult.failed} طلب`;
    } else {
      result.message = `فشل في مزامنة جميع الطلبات`;
    }

    if (config.id) {
      await updateSyncStatus(
        config.id,
        new Date(),
        result.success ? 'success' : 'error',
        result.message
      );
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    result.message = `فشل في المزامنة: ${errorMessage}`;
    result.errors.push(errorMessage);

    if (config.id) {
      try {
        await updateSyncStatus(config.id, new Date(), 'error', result.message);
      } catch (e) {
        console.error('Error updating status:', e);
      }
    }

    return result;
  }
}

export async function testGoogleSheetsConnection(
  sheetId: string,
  range: string,
  apiKey: string
): Promise<{ success: boolean; message: string; rowCount?: number }> {
  try {
    const data = await fetchGoogleSheetsData(sheetId, range, apiKey);
    
    return {
      success: true,
      message: 'تم الاتصال بنجاح!',
      rowCount: data.values?.length || 0
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطأ في الاتصال';
    return {
      success: false,
      message: `فشل الاتصال: ${errorMessage}`
    };
  }
}