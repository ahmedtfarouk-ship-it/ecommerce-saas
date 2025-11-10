// lib/firebase/orderService.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// INLINE TYPE DEFINITIONS (No external imports)
// ============================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'failed_delivery';

export type PaymentMethod = 'COD' | 'prepaid' | 'bank_transfer';
export type OrderSource = 'google_sheets' | 'manual' | 'api';

export interface AddressAnalysis {
  governorate: string;
  city: string;
  district: string;
  confidence: 'high' | 'medium' | 'low';
  needsReview: boolean;
}

export interface Order {
  id: string;
  referenceNumber: string;
  easyOrderId?: string;
  
  // Customer info
  customerName: string;
  phone: string;
  altPhone?: string;
  address: string;
  governorate: string;
  city: string;
  district: string;
  addressAnalysis?: AddressAnalysis;
  
  // Product info
  product: string;
  variant?: string;
  quantity: number;
  sku?: string;
  
  // Financial
  price: number;
  productCost: number;
  shippingCost: number;
  discount: number;
  coupon?: string;
  totalAmount: number;
  
  // Status & Tracking
  status: OrderStatus;
  trackingNumber?: string;
  shippingCompany?: string;
  
  // Payment
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paidAt?: Date;
  
  // Marketing
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  
  // System
  source: OrderSource;
  tenantId: string;
  createdBy?: string;
  isDuplicate: boolean;
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;
}

export interface CreateOrderInput {
  referenceNumber: string;
  easyOrderId?: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  address: string;
  governorate: string;
  city: string;
  district: string;
  product: string;
  variant?: string;
  quantity: number;
  sku?: string;
  price: number;
  productCost: number;
  shippingCost: number;
  discount: number;
  coupon?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  source: OrderSource;
  tenantId: string;
  notes?: string;
  isDuplicate: boolean;
}

export interface UpdateOrderInput {
  id: string;
  customerName?: string;
  phone?: string;
  altPhone?: string;
  address?: string;
  governorate?: string;
  city?: string;
  district?: string;
  product?: string;
  variant?: string;
  quantity?: number;
  price?: number;
  shippingCost?: number;
  discount?: number;
  status?: OrderStatus;
  trackingNumber?: string;
  shippingCompany?: string;
  notes?: string;
}

export interface OrderFilters {
  status?: OrderStatus[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  governorate?: string;
  city?: string;
  shippingCompany?: string;
  source?: OrderSource;
  isPaid?: boolean;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  returned: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
  deliveryRate: number;
  returnRate: number;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

const ORDERS_COLLECTION = 'orders';

/**
 * Get collection name for tenant
 */
function getOrdersCollection(tenantId: string) {
  return `orders_${tenantId}`;
}

/**
 * Create a new order
 */
export async function createOrder(
  input: CreateOrderInput,
  tenantId: string
): Promise<string> {
  const ordersRef = collection(db, getOrdersCollection(tenantId));
  
  const totalAmount = input.price + input.shippingCost - input.discount;
  
  const orderData = {
    ...input,
    totalAmount,
    isPaid: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(ordersRef, orderData);
  return docRef.id;
}

/**
 * Get all orders with filters
 */
export async function getOrders(
  tenantId: string,
  filters?: OrderFilters,
  pageSize: number = 50,
  lastDoc?: any
): Promise<Order[]> {
  const ordersRef = collection(db, getOrdersCollection(tenantId));
  const constraints: QueryConstraint[] = [];

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    constraints.push(where('status', 'in', filters.status));
  }

  if (filters?.governorate) {
    constraints.push(where('governorate', '==', filters.governorate));
  }

  if (filters?.city) {
    constraints.push(where('city', '==', filters.city));
  }

  if (filters?.source) {
    constraints.push(where('source', '==', filters.source));
  }

  if (filters?.isPaid !== undefined) {
    constraints.push(where('isPaid', '==', filters.isPaid));
  }

  if (filters?.shippingCompany) {
    constraints.push(where('shippingCompany', '==', filters.shippingCompany));
  }

  // Date range
  if (filters?.dateFrom) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
  }

  if (filters?.dateTo) {
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
  }

  // Order by and pagination
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(ordersRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    confirmedAt: doc.data().confirmedAt?.toDate(),
    shippedAt: doc.data().shippedAt?.toDate(),
    deliveredAt: doc.data().deliveredAt?.toDate(),
    returnedAt: doc.data().returnedAt?.toDate(),
    paidAt: doc.data().paidAt?.toDate(),
  })) as Order[];
}

/**
 * Get single order by ID
 */
export async function getOrderById(
  orderId: string,
  tenantId: string
): Promise<Order | null> {
  const orderRef = doc(db, getOrdersCollection(tenantId), orderId);
  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
    confirmedAt: snapshot.data().confirmedAt?.toDate(),
    shippedAt: snapshot.data().shippedAt?.toDate(),
    deliveredAt: snapshot.data().deliveredAt?.toDate(),
    returnedAt: snapshot.data().returnedAt?.toDate(),
    paidAt: snapshot.data().paidAt?.toDate(),
  } as Order;
}

/**
 * Update order
 */
export async function updateOrder(
  input: UpdateOrderInput,
  tenantId: string
): Promise<void> {
  const orderRef = doc(db, getOrdersCollection(tenantId), input.id);
  
  const updateData: any = {
    ...input,
    updatedAt: Timestamp.now(),
  };

  // Update status timestamps
  if (input.status === 'confirmed' && !updateData.confirmedAt) {
    updateData.confirmedAt = Timestamp.now();
  }
  if (input.status === 'shipped' && !updateData.shippedAt) {
    updateData.shippedAt = Timestamp.now();
  }
  if (input.status === 'delivered' && !updateData.deliveredAt) {
    updateData.deliveredAt = Timestamp.now();
  }
  if (input.status === 'returned' && !updateData.returnedAt) {
    updateData.returnedAt = Timestamp.now();
  }

  delete updateData.id;
  await updateDoc(orderRef, updateData);
}

/**
 * Delete order
 */
export async function deleteOrder(
  orderId: string,
  tenantId: string
): Promise<void> {
  const orderRef = doc(db, getOrdersCollection(tenantId), orderId);
  await deleteDoc(orderRef);
}

/**
 * Bulk delete orders
 */
export async function bulkDeleteOrders(
  orderIds: string[],
  tenantId: string
): Promise<void> {
  const promises = orderIds.map(id => deleteOrder(id, tenantId));
  await Promise.all(promises);
}

/**
 * Get order statistics
 */
export async function getOrderStats(tenantId: string): Promise<OrderStats> {
  const orders = await getOrders(tenantId, {}, 1000);

  const stats: OrderStats = {
    total: orders.length,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    deliveryRate: 0,
    returnRate: 0,
  };

  orders.forEach(order => {
    // Count by status
    if (order.status === 'pending') stats.pending++;
    if (order.status === 'confirmed') stats.confirmed++;
    if (order.status === 'shipped') stats.shipped++;
    if (order.status === 'delivered') stats.delivered++;
    if (order.status === 'returned') stats.returned++;
    if (order.status === 'cancelled') stats.cancelled++;

    // Calculate revenue (only delivered orders)
    if (order.status === 'delivered') {
      stats.totalRevenue += order.totalAmount;
    }
  });

  // Calculate rates
  stats.averageOrderValue = stats.total > 0 ? stats.totalRevenue / stats.delivered : 0;
  stats.deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
  stats.returnRate = stats.total > 0 ? (stats.returned / stats.total) * 100 : 0;

  return stats;
}

/**
 * Check if order exists by EasyOrder ID (for duplicate detection)
 */
export async function checkDuplicateOrder(
  easyOrderId: string,
  tenantId: string
): Promise<boolean> {
  const ordersRef = collection(db, getOrdersCollection(tenantId));
  const q = query(ordersRef, where('easyOrderId', '==', easyOrderId), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Bulk create orders (for Google Sheets sync)
 */
export async function bulkCreateOrders(
  orders: CreateOrderInput[],
  tenantId: string
): Promise<{ created: number; duplicates: number; errors: number }> {
  let created = 0;
  let duplicates = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      // Check for duplicates if easyOrderId exists
      if (order.easyOrderId) {
        const isDuplicate = await checkDuplicateOrder(order.easyOrderId, tenantId);
        if (isDuplicate) {
          duplicates++;
          continue;
        }
      }

      await createOrder(order, tenantId);
      created++;
    } catch (error) {
      console.error('Error creating order:', error);
      errors++;
    }
  }

  return { created, duplicates, errors };
}

/**
 * Search orders by customer name or phone
 */
export async function searchOrders(
  searchTerm: string,
  tenantId: string
): Promise<Order[]> {
  const ordersRef = collection(db, getOrdersCollection(tenantId));
  
  // Search by phone (exact match)
  const phoneQuery = query(
    ordersRef,
    where('phone', '==', searchTerm),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const phoneSnapshot = await getDocs(phoneQuery);
  
  if (!phoneSnapshot.empty) {
    return phoneSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Order[];
  }

  // If no phone match, get all and filter by name (client-side)
  const allOrders = await getOrders(tenantId, {}, 100);
  return allOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}