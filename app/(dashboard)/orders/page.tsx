// app/(dashboard)/dashboard/orders/sync/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface SyncResult {
  success: boolean;
  newOrders: number;
  updatedOrders: number;
  errors: string[];
  message: string;
}

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Form states
  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A2:Y');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Mock user data - TODO: استبدل بـ useAuth الحقيقي
  const mockUser = {
    id: 'user123',
    tenantId: 'tenant_' + Date.now()
  };

  const handleTestConnection = async () => {
    if (!sheetId || !range || !apiKey) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      
      console.log('🔍 Testing connection...', { sheetId, range });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'فشل الاتصال';
        
        if (response.status === 403) {
          errorMessage = 'خطأ في الصلاحيات - تأكد من:\n1. تفعيل Google Sheets API\n2. API Key صحيح\n3. Google Sheet مشارك للعامة';
        } else if (response.status === 404) {
          errorMessage = 'Sheet ID أو Range غير صحيح';
        } else if (response.status === 400) {
          errorMessage = 'خطأ في الـ Range - تأكد من الصيغة: Sheet1!A2:Y';
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        throw new Error('لا توجد بيانات في النطاق المحدد');
      }

      console.log('✅ Connection successful!', {
        rows: data.values.length,
        columns: data.values[0]?.length
      });

      setTestResult({
        success: true,
        message: 'تم الاتصال بنجاح!',
        rowCount: data.values.length,
        columnCount: data.values[0]?.length || 0,
        data: data.values
      });
      
    } catch (err: any) {
      console.error('❌ Connection failed:', err);
      const errorMessage = err.message || 'خطأ في الاتصال';
      setError(errorMessage);
      setTestResult({ 
        success: false, 
        message: errorMessage 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!testResult?.success) {
      setError('يرجى اختبار الاتصال أولاً');
      return;
    }

    setSaving(true);
    setError('');

    try {
      console.log('💾 Saving config to Firebase...');

      const configData = {
        tenantId: mockUser.tenantId,
        sheetId: sheetId,
        range: range,
        apiKey: apiKey,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: mockUser.id
      };

      const docRef = await addDoc(
        collection(db, 'google_sheets_sync_configs'), 
        configData
      );

      console.log('✅ Config saved with ID:', docRef.id);
      
      alert('تم حفظ الإعدادات بنجاح! ✅');

    } catch (err: any) {
      console.error('❌ Save failed:', err);
      const errorMessage = err.message || 'فشل في الحفظ';
      setError(`خطأ في الحفظ: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!testResult?.success || !testResult.data) {
      setError('يرجى اختبار الاتصال أولاً');
      return;
    }

    setSyncing(true);
    setError('');
    setSyncResult(null);

    try {
      console.log('🔄 Starting sync...');

      const rows = testResult.data;
      const orders = parseOrdersFromSheet(rows);
      
      console.log(`📊 Parsed ${orders.length} orders from ${rows.length} rows`);

      if (orders.length === 0) {
        throw new Error('لا توجد طلبات صالحة للمزامنة');
      }

      // Save orders to Firebase
      const collectionName = `orders_${mockUser.tenantId}`;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < orders.length; i++) {
        try {
          const orderData = {
            ...orders[i],
            tenantId: mockUser.tenantId,
            createdBy: mockUser.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          await addDoc(collection(db, collectionName), orderData);
          successCount++;
          console.log(`✅ Order ${i + 1}/${orders.length} saved`);

        } catch (err: any) {
          errorCount++;
          const errorMsg = `الصف ${i + 2}: ${err.message}`;
          errors.push(errorMsg);
          console.error(`❌ Order ${i + 1} failed:`, err);
        }
      }

      console.log(`✅ Sync complete: ${successCount} success, ${errorCount} failed`);

      setSyncResult({
        success: successCount > 0,
        newOrders: successCount,
        updatedOrders: 0,
        errors: errors,
        message: `تمت مزامنة ${successCount} طلب بنجاح!` + 
                 (errorCount > 0 ? ` (فشل ${errorCount})` : '')
      });

    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      const errorMessage = err.message || 'فشل في المزامنة';
      setError(errorMessage);
      setSyncResult({
        success: false,
        newOrders: 0,
        updatedOrders: 0,
        errors: [errorMessage],
        message: 'فشلت المزامنة'
      });
    } finally {
      setSyncing(false);
    }
  };

  const parseOrdersFromSheet = (rows: string[][]) => {
    const orders = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.length < 4) continue;

      try {
        // تنظيف رقم الهاتف
        let phone = String(row[2] || '').replace(/\D/g, '');
        if (phone && !phone.startsWith('0') && phone.length === 10) {
          phone = '0' + phone;
        }

        // تنظيف السعر
        const priceStr = String(row[6] || '0').replace(/[^\d.-]/g, '');
        const price = parseFloat(priceStr) || 0;

        const order = {
          referenceNumber: '', // سيتم توليده تلقائياً
          orderNumber: row[0] || '',
          customerName: row[1] || '',
          phone: phone,
          address: row[3] || '',
          product: row[4] || '',
          quantity: parseInt(row[5]) || 1,
          price: price,
          shippingCost: parseFloat(row[7]) || 0,
          totalPrice: parseFloat(row[8]) || price,
          status: 'pending',
          notes: row[10] || '',
          // EasyOrder specific fields
          governorate: '',
          city: '',
          district: ''
        };

        // Validate
        if (order.customerName && order.phone && order.address && order.phone.length >= 10) {
          orders.push(order);
        } else {
          console.warn(`⚠️ Skipping row ${i + 2}: missing required fields`);
        }
      } catch (err) {
        console.warn(`⚠️ Error parsing row ${i + 2}:`, err);
      }
    }

    return orders;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">مزامنة Google Sheets</h1>
          <p className="text-gray-500 mt-1">
            مزامنة الطلبات من Google Sheets تلقائياً
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 whitespace-pre-line">{error}</p>
                {error.includes('403') && (
                  <a 
                    href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-700 underline text-sm mt-2 inline-flex items-center gap-1 hover:text-red-900"
                  >
                    فعّل Google Sheets API
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Setup Form */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-xl font-semibold">إعدادات الاتصال</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google Sheet ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="19x5A4BzRy3j1vmYnLA6ErjXGP6YeQibHQCfH06uX4"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Range (النطاق) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Sheet1!A2:Y"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing || !sheetId || !range || !apiKey}
            className="w-full py-2 px-4 border rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                اختبار الاتصال
              </>
            )}
          </button>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={testResult.success ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
                    {testResult.message}
                  </p>
                  {testResult.success && (
                    <div className="text-sm text-green-700 mt-2">
                      <p>• عدد الصفوف: {testResult.rowCount}</p>
                      <p>• عدد الأعمدة: {testResult.columnCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {testResult?.success && (
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  حفظ الإعدادات
                </>
              )}
            </button>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  مزامنة الآن
                </>
              )}
            </button>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              {syncResult.success ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <h2 className="text-xl font-semibold">نتيجة المزامنة</h2>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-semibold">فشلت المزامنة</h2>
                </>
              )}
            </div>

            <div className={`p-4 rounded-lg mb-4 ${
              syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={syncResult.success ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
                {syncResult.message}
              </p>
            </div>

            {syncResult.success && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-700">
                    {syncResult.newOrders}
                  </div>
                  <div className="text-sm text-green-600 mt-1">طلبات جديدة</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {syncResult.updatedOrders}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">طلبات محدثة</div>
                </div>
              </div>
            )}

            {syncResult.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-sm">الأخطاء ({syncResult.errors.length}):</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {syncResult.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700 mb-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}