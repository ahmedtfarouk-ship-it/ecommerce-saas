// lib/firebase/orders.ts

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from './config';
import { parseAddress } from '../utils/addressParser';
import { Order, OrderStatus, OrderUploadData } from '@/types';

export function generateReferenceNumber(phone: string, existingOrders: number = 0): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const phoneDigits = phone.replace(/\D/g, '').slice(-4);
  const sequence = String(existingOrders + 1).padStart(4, '0');
  
  return `ORD-${year}${month}-${phoneDigits}${sequence}`;
}

function cleanOrderData(data: OrderUploadData, tenantId: string, userId: string): Omit<Order, 'id'> {
  const addressAnalysis = parseAddress(data.address);
  
  let price = 0;
  if (typeof data.price === 'string') {
    price = parseFloat(data.price.replace(/[^\d.-]/g, '')) || 0;
  } else {
    price = Number(data.price) || 0;
  }

  let status: OrderStatus = 'pending';
  if (data.status) {
    const statusLower = data.status.toLowerCase();
    if (statusLower.includes('confirm') || statusLower.includes('تأكيد')) {
      status = 'confirmed';
    } else if (statusLower.includes('ship') || statusLower.includes('شحن')) {
      status = 'shipped';
    } else if (statusLower.includes('deliver') || statusLower.includes('تسليم')) {
      status = 'delivered';
    } else if (statusLower.includes('cancel') || statusLower.includes('ملغ')) {
      status = 'cancelled';
    } else if (statusLower.includes('return') || statusLower.includes('مرتجع')) {
      status = 'returned';
    }
  }

  let cleanPhone = String(data.phone || '')
    .replace(/[\s\-\(\)]/g, '')
    .replace(/\D/g, '');
  
  if (cleanPhone && !cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '0' + cleanPhone;
  }

  return {
    referenceNumber: '',
    customerName: String(data.customerName || '').trim(),
    phone: cleanPhone,
    address: String(data.address || '').trim(),
    product: String(data.product || '').trim(),
    price,
    status,
    shippingCompany: data.shippingCompany?.trim() || undefined,
    trackingNumber: data.trackingNumber?.trim() || undefined,
    governorate: addressAnalysis.governorate || undefined,
    city: addressAnalysis.city || undefined,
    district: addressAnalysis.district,
    notes: data.notes?.trim() || undefined,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId
  };
}

export async function uploadOrders(
  ordersData: OrderUploadData[], 
  tenantId: string,
  userId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const collectionName = `orders_${tenantId}`;
  
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  const existingOrdersSnapshot = await getDocs(collection(db, collectionName));
  let orderCount = existingOrdersSnapshot.size;

  for (let i = 0; i < ordersData.length; i++) {
    try {
      const orderData = ordersData[i];
      
      if (!orderData.customerName || !orderData.phone || !orderData.address) {
        errors.push(`الصف ${i + 2}: بيانات ناقصة`);
        failed++;
        continue;
      }

      const cleanedOrder = cleanOrderData(orderData, tenantId, userId);
      
      cleanedOrder.referenceNumber = generateReferenceNumber(
        cleanedOrder.phone, 
        orderCount + success
      );

      const orderToSave: any = {
        ...cleanedOrder,
        createdAt: Timestamp.fromDate(cleanedOrder.createdAt),
        updatedAt: Timestamp.fromDate(cleanedOrder.updatedAt)
      };

      Object.keys(orderToSave).forEach(key => {
        if (orderToSave[key] === undefined) {
          delete orderToSave[key];
        }
      });

      await addDoc(collection(db, collectionName), orderToSave);

      success++;

    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      errors.push(`الصف ${i + 2}: ${errorMsg}`);
    }
  }

  return { success, failed, errors };
}

export async function fetchOrders(
  tenantId: string,
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ orders: Order[]; lastVisible: QueryDocumentSnapshot | null }> {
  const collectionName = `orders_${tenantId}`;
  
  let q = query(
    collection(db, collectionName),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  
  const orders: Order[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Order;
  });

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { orders, lastVisible };
}

export async function deleteOrders(orderIds: string[], tenantId: string): Promise<void> {
  const collectionName = `orders_${tenantId}`;
  const batch = writeBatch(db);

  orderIds.forEach(orderId => {
    const orderDoc = doc(db, collectionName, orderId);
    batch.delete(orderDoc);
  });

  await batch.commit();
}