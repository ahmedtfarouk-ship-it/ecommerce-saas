// services/orderService.ts
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Order {
  id?: string;
  tenantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  governorate: string;
  city: string;
  district?: string;
  productName: string;
  quantity: number;
  price: number;
  shippingFee: number;
  totalAmount: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  whatsappSent: boolean;
  whatsappSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createOrders(orders: any[], tenantId: string) {
  const ordersCollection = collection(db, 'orders');
  const createdOrders = [];

  for (const order of orders) {
    // دعم أسماء أعمدة مختلفة (عربي/إنجليزي)
    const customerName = order['Consignee Name'] || order.customerName || order['اسم العميل'] || order.name || order['الاسم'] || '';
    const customerPhone = order.Phone_1 || order.phone || order['التليفون'] || order.mobile || order['الموبايل'] || order.customerPhone || '';
    
    // في الشيت: City = المحافظة, Area = المدينة
    const governorate = order.governorate || order['المحافظة'] || order.City || 'غير محدد';
    const city = order.city || order['المدينة'] || order.Area || 'غير محدد';
    
    const address = order.Address || order.address || order['العنوان'] || '';
    const productName = order['Item Name'] || order.product || order['المنتج'] || order.productName || order['اسم المنتج'] || '';
    const quantity = parseInt(order.Quantity || order.quantity || order['الكمية'] || order.qty || '1');
    const price = parseFloat(order.COD || order.price || order['السعر'] || order.amount || order['المبلغ'] || '0');
    
    const orderData: any = {
      tenantId,
      orderNumber: order['Order ID'] || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerName,
      customerPhone,
      address: address || `${governorate} ${city}`.trim(),
      governorate,
      city,
      productName,
      quantity,
      price,
      shippingFee: parseFloat(order.shippingFee || order['الشحن'] || order.shipping || '0'),
      totalAmount: price,
      status: 'new' as const,
      whatsappSent: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // أضف الحقول الاختيارية فقط لو موجودة
    if (order['Item Description']) orderData.productDescription = order['Item Description'];
    if (order.notes) orderData.notes = order.notes;
    if (order['E-mail']) orderData.customerEmail = order['E-mail'];
    if (order.Phone_2) orderData.customerPhone2 = order.Phone_2;

    const docRef = await addDoc(ordersCollection, orderData);
    createdOrders.push({ id: docRef.id, ...orderData });
  }

  return createdOrders;
}

export async function getOrders(tenantId: string) {
  const ordersCollection = collection(db, 'orders');
  const q = query(
    ordersCollection,
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    whatsappSentAt: doc.data().whatsappSentAt?.toDate(),
  }));
}