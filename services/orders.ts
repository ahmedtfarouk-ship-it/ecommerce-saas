// lib/firebase/orders.ts (أو services/orders.ts)
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; // Update path as needed
import { ParsedOrder } from '@/lib/parsers/excelParser';

// Types
export type OrderStatus = 
  | 'pending'
  | 'confirmed' 
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface Order {
  id: string;
  referenceNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city?: string;
  governorate?: string;
  district?: string;
  product: string;
  price: number;
  status: OrderStatus;
  shippingCompany?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
  tenantId?: string;
}

export interface OrderUploadData extends ParsedOrder {
  referenceNumber: string;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
  tenantId?: string;
}

/**
 * Generate reference number
 * Format: ORD-YYYYMMDD-XXXX
 */
export function generateReferenceNumber(
  phone: string,
  existingOrders: number = 0
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Get last 4 digits of phone
  const phoneDigits = phone.replace(/\D/g, '').slice(-4);
  
  // Sequence based on existing orders
  const sequence = String(existingOrders + 1).padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${phoneDigits}${sequence}`;
}

/**
 * Create orders collection name for tenant
 */
function getOrdersCollection(tenantId?: string): string {
  return tenantId ? `orders_${tenantId}` : 'orders';
}

/**
 * Upload multiple orders
 */
export async function uploadOrders(
  orders: ParsedOrder[],
  tenantId?: string
): Promise<{ success: boolean; count: number; errors: any[] }> {
  try {
    const collectionName = getOrdersCollection(tenantId);
    const batch = writeBatch(db);
    const errors: any[] = [];
    let count = 0;

    for (const orderData of orders) {
      try {
        const docRef = doc(collection(db, collectionName));
        
        // Generate reference number
        const refNumber = generateReferenceNumber(orderData.phone, count);
        
        const order: Partial<Order> = {
          referenceNumber: refNumber,
          customerName: orderData.customerName,
          phone: orderData.phone,
          address: orderData.address,
          city: orderData.city,
          product: orderData.product,
          price: orderData.price,
          status: 'pending',
          notes: orderData.notes,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        if (tenantId) {
          (order as any).tenantId = tenantId;
        }

        batch.set(docRef, order);
        count++;
      } catch (error) {
        errors.push({
          order: orderData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await batch.commit();

    return {
      success: errors.length === 0,
      count,
      errors,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload orders: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all orders
 */
export async function getOrders(tenantId?: string): Promise<Order[]> {
  const collectionName = getOrdersCollection(tenantId);
  const q = query(
    collection(db, collectionName),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Order));
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  tenantId?: string
): Promise<void> {
  const collectionName = getOrdersCollection(tenantId);
  const orderRef = doc(db, collectionName, orderId);
  
  await updateDoc(orderRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete order
 */
export async function deleteOrder(
  orderId: string,
  tenantId?: string
): Promise<void> {
  const collectionName = getOrdersCollection(tenantId);
  await deleteDoc(doc(db, collectionName, orderId));
}

/**
 * Delete multiple orders
 */
export async function bulkDeleteOrders(
  orderIds: string[],
  tenantId?: string
): Promise<void> {
  const collectionName = getOrdersCollection(tenantId);
  const batch = writeBatch(db);
  
  orderIds.forEach(orderId => {
    const orderRef = doc(db, collectionName, orderId);
    batch.delete(orderRef);
  });
  
  await batch.commit();
}

/**
 * Generate WhatsApp message
 */
export function generateWhatsAppMessage(order: Order): string {
  return `مرحباً ${order.customerName} 👋

شكراً لطلبك رقم: ${order.referenceNumber}

📦 المنتج: ${order.product}
💰 الإجمالي: ${order.price} جنيه
📍 العنوان: ${order.address}

للتأكيد، يرجى الرد بـ "تأكيد" ✅
للإلغاء، يرجى الرد بـ "إلغاء" ❌

شكراً لثقتكم 🌟`;
}

/**
 * Send WhatsApp message
 */
export function sendWhatsAppMessage(order: Order): void {
  const phone = order.phone.replace(/\D/g, '');
  const message = generateWhatsAppMessage(order);
  const url = `https://wa.me/2${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}