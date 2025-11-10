// app/api/sheets/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface SheetRow {
  date: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  productName: string;
  productVariant: string;
  productQuantity: number;
  productTotalCost: number;
  sku?: string;
  shippingCost: number;
  orderTotalCost: number;
  discount: number;
  coupon?: string;
  paymentMethod: string;
  utmSource?: string;
  utmCampaign?: string;
  easyOrderId: string;
}

function parseRow(row: any[]): SheetRow | null {
  try {
    return {
      date: row[0] || new Date().toISOString(),
      fullName: row[1] || '',
      phone: cleanPhone(row[2] || ''),
      altPhone: row[3] ? cleanPhone(row[3]) : undefined,
      address: row[4] || '',
      city: row[5] || '',
      productName: row[6] || '',
      productVariant: row[7] || '',
      productQuantity: parseInt(row[8]) || 1,
      productTotalCost: parseNumber(row[9]),
      sku: row[10] || undefined,
      shippingCost: parseNumber(row[11]),
      orderTotalCost: parseNumber(row[12]),
      discount: parseNumber(row[13]),
      coupon: row[14] || undefined,
      paymentMethod: row[15] || 'COD',
      utmSource: row[16] || undefined,
      utmCampaign: row[17] || undefined,
      easyOrderId: row[18] || `SHEET-${Date.now()}-${Math.random()}`,
    };
  } catch (error) {
    console.error('Error parsing row:', error);
    return null;
  }
}

function cleanPhone(phone: string): string {
  return phone
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const cleaned = String(value).replace(/,/g, '').replace(/\s/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

async function checkDuplicate(easyOrderId: string, tenantId: string): Promise<boolean> {
  const ordersRef = collection(db, `orders_${tenantId}`);
  const q = query(ordersRef, where('easyOrderId', '==', easyOrderId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetId, range, apiKey, tenantId } = await request.json();

    if (!sheetId || !range || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch data from Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({
        success: false,
        message: error.error?.message || 'فشل جلب البيانات من Google Sheets',
      }, { status: response.status });
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'الشيت فارغ أو Range غير صحيح',
      }, { status: 400 });
    }

    // Process orders
    let created = 0;
    let duplicates = 0;
    let errors = 0;

    const ordersRef = collection(db, `orders_${tenantId || 'default'}`);

    for (const row of rows) {
      try {
        const orderData = parseRow(row);
        
        if (!orderData || !orderData.fullName || !orderData.phone) {
          errors++;
          continue;
        }

        // Check for duplicate
        const isDuplicate = await checkDuplicate(orderData.easyOrderId, tenantId || 'default');
        
        if (isDuplicate) {
          duplicates++;
          continue;
        }

        // Create order in Firebase
        await addDoc(ordersRef, {
          referenceNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          easyOrderId: orderData.easyOrderId,
          customerName: orderData.fullName,
          phone: orderData.phone,
          altPhone: orderData.altPhone,
          address: orderData.address,
          governorate: '', // Will be analyzed
          city: orderData.city,
          district: '',
          product: orderData.productName,
          variant: orderData.productVariant,
          quantity: orderData.productQuantity,
          sku: orderData.sku,
          price: orderData.productTotalCost,
          productCost: orderData.productTotalCost,
          shippingCost: orderData.shippingCost,
          discount: orderData.discount,
          coupon: orderData.coupon,
          totalAmount: orderData.orderTotalCost,
          status: 'pending',
          paymentMethod: orderData.paymentMethod,
          isPaid: false,
          utmSource: orderData.utmSource,
          utmCampaign: orderData.utmCampaign,
          source: 'google_sheets',
          tenantId: tenantId || 'default',
          isDuplicate: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        created++;
      } catch (error) {
        console.error('Error creating order:', error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      duplicates,
      errors,
      total: rows.length,
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'خطأ في المزامنة',
    }, { status: 500 });
  }
}