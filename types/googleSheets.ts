// types/googleSheets.ts

export interface GoogleSheetsSyncConfig {
  id?: string;
  tenantId: string;
  sheetId: string;
  range: string;
  apiKey: string;
  isActive: boolean;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'error';
  lastSyncMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SyncResult {
  success: boolean;
  newOrders: number;
  updatedOrders: number;
  errors: string[];
  message: string;
}

export interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface ColumnMapping {
  customerName: number;
  phone: number;
  address: number;
  product: number;
  price: number;
  status?: number;
  shippingCompany?: number;
  trackingNumber?: number;
  notes?: number;
}

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  customerName: 0,
  phone: 1,
  address: 2,
  product: 3,
  price: 4,
  status: 5,
  shippingCompany: 6,
  trackingNumber: 7,
  notes: 8
};