// lib/services/googleSheetsSync.ts

import { 
  GoogleSheetsResponse, 
  GoogleSheetsRow,
  SyncResult,
  ColumnMapping,
  DEFAULT_COLUMN_MAPPING,
  GoogleSheetsSyncConfig
} from '@/types/googleSheets';
import { OrderUploadData } from '@/types/order';
import { uploadOrders } from '@/lib/firebase/orders';
import { updateSyncStatus } from '@/lib/firebase/googleSheetsConfig';

/**
 * جلب البيانات من Google Sheets
 */
export async function fetchGoogleSheetsData(
  sheetId: string,
  range: string,
  apiKey: string
): Promise<GoogleSheetsResponse> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    
    console.log('📊 جلب البيانات من Google Sheets...');
    console.log('  - Sheet ID:', sheetId);
    console.log('  - Range:', range);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'فشل في جلب البيانات من Google Sheets');
    }

    const data = await response.json();
    console.log('✅ تم جلب البيانات بنجاح:', data.values?.length || 0, 'صف');
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات من Google Sheets:', error);
    throw error;
  }
}

/**
 * تحويل صفوف Google Sheets إلى OrderUploadData
 */
function parseGoogleSheetsRows(
  rows: string[][],
  mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING,
  hasHeaders: boolean = true
): OrderUploadData[] {
  const dataRows = hasHeaders ? rows.slice(1) : rows;
  const orders: OrderUploadData[] = [];

  console.log('🔄 تحويل البيانات من Google Sheets...');
  console.log('  - عدد الصفوف:', dataRows.length);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    try {
      // التحقق من أن الصف يحتوي على بيانات كافية
      if (!row || row.length < 5) {
        console.log(`⚠️ صف ${i + 2}: بيانات غير كافية`);
        continue;
      }

      const order: OrderUploadData = {
        customerName: String(row[mapping.customerName] || '').trim(),
        phone: String(row[mapping.phone] || '').trim(),
        address: String(row[mapping.address] || '').trim(),
        product: String(row[mapping.product] || '').trim(),
        price: row[mapping.price] || 0,
      };

      // إضافة الحقول الاختيارية إذا كانت موجودة
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

      // التحقق من البيانات الأساسية
      if (order.customerName && order.phone && order.address) {
        orders.push(order);
      } else {
        console.log(`⚠️ صف ${i + 2}: بيانات ناقصة (الاسم: ${order.customerName}, الهاتف: ${order.phone})`);
      }

    } catch (error) {
      console.error(`❌ خطأ في معالجة الصف ${i + 2}:`, error);
    }
  }

  console.log('✅ تم تحويل', orders.length, 'طلب بنجاح');
  return orders;
}

/**
 * مزامنة الطلبات من Google Sheets إلى Firebase
 */
export async function syncOrdersFromGoogleSheets(
  config: GoogleSheetsSyncConfig,
  tenantId: string,
  userId: string,
  columnMapping?: ColumnMapping
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    newOrders: 0,
    updatedOrders: 0,
    errors: [],
    message: ''
  };

  try {
    console.log('🔄 بدء مزامنة Google Sheets...');
    
    // جلب البيانات من Google Sheets
    const sheetsData = await fetchGoogleSheetsData(
      config.sheetId,
      config.range,
      config.apiKey
    );

    if (!sheetsData.values || sheetsData.values.length === 0) {
      result.message = 'لا توجد بيانات في Google Sheet';
      return result;
    }

    // تحويل البيانات إلى طلبات
    const orders = parseGoogleSheetsRows(
      sheetsData.values,
      columnMapping || DEFAULT_COLUMN_MAPPING,
      true // نفترض أن الصف الأول يحتوي على العناوين
    );

    if (orders.length === 0) {
      result.message = 'لم يتم العثور على طلبات صالحة للاستيراد';
      return result;
    }

    console.log('📤 رفع الطلبات إلى Firebase...');
    
    // رفع الطلبات إلى Firebase
    const uploadResult = await uploadOrders(orders, tenantId, userId);

    result.success = uploadResult.success > 0;
    result.newOrders = uploadResult.success;
    result.errors = uploadResult.errors;
    
    if (uploadResult.success > 0 && uploadResult.failed === 0) {
      result.message = `تم مزامنة ${uploadResult.success} طلب بنجاح`;
    } else if (uploadResult.success > 0 && uploadResult.failed > 0) {
      result.message = `تم مزامنة ${uploadResult.success} طلب بنجاح، وفشل ${uploadResult.failed} طلب`;
    } else {
      result.message = `فشل في مزامنة جميع الطلبات`;
    }

    // تحديث حالة المزامنة
    if (config.id) {
      await updateSyncStatus(
        config.id,
        new Date(),
        result.success ? 'success' : 'error',
        result.message
      );
    }

    console.log('✅ انتهت عملية المزامنة:', result);
    return result;

  } catch (error) {
    console.error('❌ خطأ في مزامنة Google Sheets:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    result.message = `فشل في المزامنة: ${errorMessage}`;
    result.errors.push(errorMessage);

    // تحديث حالة المزامنة كخطأ
    if (config.id) {
      try {
        await updateSyncStatus(
          config.id,
          new Date(),
          'error',
          result.message
        );
      } catch (updateError) {
        console.error('❌ خطأ في تحديث حالة المزامنة:', updateError);
      }
    }

    return result;
  }
}

/**
 * اختبار الاتصال بـ Google Sheets
 */
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