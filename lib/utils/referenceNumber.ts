// lib/utils/referenceNumber.ts
// ===================================
// REFERENCE NUMBER GENERATOR
// ===================================

/**
 * Generate unique reference number
 * Format: YYYYMMDD-XXXX
 * Example: 20250128-0001
 */
export function generateReferenceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Generate random 4-digit sequence
  const sequence = Math.floor(1000 + Math.random() * 9000);
  
  return `${year}${month}${day}-${sequence}`;
}

/**
 * Validate reference number format
 */
export function isValidReferenceNumber(ref: string): boolean {
  const pattern = /^\d{8}-\d{4}$/;
  return pattern.test(ref);
}

/**
 * Format currency (Egyptian Pound)
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

/**
 * Format date
 */
export function formatDate(date: Date | any): string {
  if (!date) return '-';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Egyptian number
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}