// types/order.ts

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface Order {
  id: string;
  referenceNumber: string;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  price: number;
  status: OrderStatus;
  shippingCompany?: string;
  trackingNumber?: string;
  governorate?: string;
  city?: string;
  district?: string;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface OrderUploadData {
  customerName: string;
  phone: string;
  address: string;
  product: string;
  price: number | string;
  status?: string;
  shippingCompany?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface AddressAnalysis {
  governorate: string;
  city: string;
  district?: string;
  confidence: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  returned: 'مرتجع'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-gray-100 text-gray-800'
};