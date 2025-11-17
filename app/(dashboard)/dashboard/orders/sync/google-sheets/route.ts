// app/api/sync/google-sheets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { syncOrdersFromGoogleSheets } from '@/services/googleSheetsSync';
import { GoogleSheetsSyncConfig } from '@/types';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { tenantId, userId } = body;

    console.log('🔄 بدء المزامنة التلقائية...');
    
    let q = query(
      collection(db, 'google_sheets_sync_configs'),
      where('isActive', '==', true)
    );

    if (tenantId) {
      q = query(
        collection(db, 'google_sheets_sync_configs'),
        where('isActive', '==', true),
        where('tenantId', '==', tenantId)
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'لا توجد إعدادات مزامنة نشطة',
        results: []
      });
    }

    const results = [];

    for (const doc of snapshot.docs) {
      const config = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastSyncAt: doc.data().lastSyncAt?.toDate()
      } as GoogleSheetsSyncConfig;

      try {
        console.log(`🔄 مزامنة الشركة ${config.tenantId}...`);
        
        const result = await syncOrdersFromGoogleSheets(
          config,
          config.tenantId,
          userId || config.createdBy
        );

        results.push({
          tenantId: config.tenantId,
          success: result.success,
          message: result.message,
          newOrders: result.newOrders,
          updatedOrders: result.updatedOrders,
          errors: result.errors
        });

        console.log(`✅ انتهت مزامنة ${config.tenantId}: ${result.message}`);
      } catch (error) {
        console.error(`❌ خطأ في مزامنة ${config.tenantId}:`, error);
        results.push({
          tenantId: config.tenantId,
          success: false,
          message: error instanceof Error ? error.message : 'خطأ غير معروف',
          newOrders: 0,
          updatedOrders: 0,
          errors: [error instanceof Error ? error.message : 'خطأ غير معروف']
        });
      }
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalFailed = results.length - totalSuccess;

    console.log(`✅ انتهت المزامنة التلقائية: ${totalSuccess} نجح، ${totalFailed} فشل`);

    return NextResponse.json({
      success: totalSuccess > 0,
      message: `تمت مزامنة ${totalSuccess} من ${results.length} شركة بنجاح`,
      totalSynced: totalSuccess,
      totalFailed,
      results
    });

  } catch (error) {
    console.error('❌ خطأ في المزامنة التلقائية:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'خطأ في المزامنة التلقائية',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Google Sheets Sync API is running',
    endpoint: '/api/sync/google-sheets',
    method: 'POST',
    authentication: process.env.SYNC_API_KEY ? 'Required' : 'Not required'
  });
}