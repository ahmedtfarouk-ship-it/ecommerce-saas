// lib/parsers/excelParser.ts
import * as XLSX from 'xlsx';

export interface ParsedOrder {
  customerName: string;
  phone: string;
  address: string;
  city?: string;
  governorate?: string;
  product: string;
  price: number;
  quantity?: number;
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  orders: ParsedOrder[];
  errors: Array<{
    row: number;
    error: string;
  }>;
  total: number;
  valid: number;
}

/**
 * Parse Excel file and extract orders
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            orders: [],
            errors: [{ row: 0, error: 'الملف فارغ' }],
            total: 0,
            valid: 0,
          });
          return;
        }
        
        // Parse rows
        const result = parseRows(jsonData as any[][]);
        resolve(result);
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse rows from Excel data
 */
function parseRows(rows: any[][]): ParseResult {
  const orders: ParsedOrder[] = [];
  const errors: Array<{ row: number; error: string }> = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const order = parseRow(row, i);
      if (order) {
        orders.push(order);
      }
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
  
  return {
    success: errors.length === 0,
    orders,
    errors,
    total: rows.length - 1,
    valid: orders.length,
  };
}

/**
 * Parse single row to Order
 */
function parseRow(row: any[], rowIndex: number): ParsedOrder | null {
  // Skip empty rows
  if (!row || row.length === 0) return null;
  if (row.every(cell => !cell)) return null;
  
  // Expected columns (flexible):
  // 0: Name, 1: Phone, 2: Address, 3: City, 4: Product, 5: Price, 6: Notes
  
  const name = String(row[0] || '').trim();
  const phone = String(row[1] || '').trim();
  const address = String(row[2] || '').trim();
  const city = String(row[3] || '').trim();
  const product = String(row[4] || '').trim();
  const price = parseFloat(String(row[5] || '0'));
  const notes = String(row[6] || '').trim();
  
  // Validation
  if (!name) {
    throw new Error('الاسم مطلوب');
  }
  
  if (!phone) {
    throw new Error('رقم الهاتف مطلوب');
  }
  
  if (!address) {
    throw new Error('العنوان مطلوب');
  }
  
  if (!product) {
    throw new Error('المنتج مطلوب');
  }
  
  if (!price || price <= 0) {
    throw new Error('السعر غير صحيح');
  }
  
  // Create order object
  const order: ParsedOrder = {
    customerName: name,
    phone: cleanPhone(phone),
    address: address,
    city: city || undefined,
    product: product,
    price: price,
    notes: notes || undefined,
  };
  
  return order;
}

/**
 * Clean phone number
 */
function cleanPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 2 (country code), remove it
  if (cleaned.startsWith('2')) {
    cleaned = cleaned.substring(1);
  }
  
  // Ensure starts with 0
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}