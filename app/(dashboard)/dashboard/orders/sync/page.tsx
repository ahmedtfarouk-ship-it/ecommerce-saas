// app/(dashboard)/dashboard/orders/sync/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  Settings,
  Info
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  Timestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface SyncConfig {
  sheetId: string;
  range: string;
  apiKey: string;
  lastSyncedEasyOrderId?: string;
  lastSyncedAt?: Date;
}

interface SyncResult {
  success: boolean;
  newOrders: number;
  skipped: number;
  duplicates: number;
  errors: string[];
  message: string;
}

interface TestResult {
  success: boolean;
  message: string;
  rowCount?: number;
  columnCount?: number;
  data?: string[][];
  headers?: string[];
}

export default function SyncPage() {
  const { user, isAuthenticated } = useAuthContext();
  
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A1:Y');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [lastSyncedOrderId, setLastSyncedOrderId] = useState<string>('');

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      // Load from localStorage
      const savedConfig = localStorage.getItem('syncConfig');
      if (savedConfig) {
        try {
          const config: SyncConfig = JSON.parse(savedConfig);
          setSheetId(config.sheetId || '');
          setRange(config.range || 'Sheet1!A1:Y');
          setApiKey(config.apiKey || '');
          setLastSyncedOrderId(config.lastSyncedEasyOrderId || '');
          if (config.lastSyncedAt) {
            setLastSync(new Date(config.lastSyncedAt));
          }
          console.log('✅ Loaded config from localStorage');
        } catch (err) {
          console.error('❌ Failed to load from localStorage:', err);
        }
      }

      // Also try to load from Firebase
      if (user?.tenantId) {
        try {
          const configDoc = await getDoc(doc(db, 'google_sheets_sync_configs', user.tenantId));
          if (configDoc.exists()) {
            const data = configDoc.data();
            setLastSyncedOrderId(data.lastSyncedEasyOrderId || '');
            if (data.lastSyncedAt) {
              setLastSync(data.lastSyncedAt.toDate());
            }
            console.log('✅ Loaded last sync info from Firebase');
          }
        } catch (err) {
          console.error('❌ Failed to load from Firebase:', err);
        }
      }
    };

    if (user?.tenantId) {
      loadConfig();
    }
  }, [user?.tenantId]);

  const saveConfig = (config: Partial<SyncConfig>) => {
    try {
      const currentConfig: SyncConfig = {
        sheetId,
        range,
        apiKey,
        lastSyncedEasyOrderId: lastSyncedOrderId,
        lastSyncedAt: lastSync || undefined,
        ...config
      };
      localStorage.setItem('syncConfig', JSON.stringify(currentConfig));
      console.log('💾 Config saved');
    } catch (err) {
      console.error('❌ Failed to save config:', err);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg border p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 mb-4">
            يرجى تسجيل الدخول للوصول إلى صفحة المزامنة
          </p>
        </div>
      </div>
    );
  }

  const generateReferenceNumber = async (tenantId: string): Promise<string> => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const datePrefix = `${day}${month}${year}`;

    try {
      const collectionName = `orders_${tenantId}`;
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const q = query(
        collection(db, collectionName),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      let sequence = 1;
      if (!snapshot.empty) {
        const lastOrder = snapshot.docs[0].data();
        if (lastOrder.referenceNumber?.startsWith(datePrefix)) {
          const lastSequence = parseInt(lastOrder.referenceNumber.split('-')[1]);
          sequence = lastSequence + 1;
        }
      }

      return `${datePrefix}-${String(sequence).padStart(4, '0')}`;
    } catch (err) {
      console.error('Error generating reference number:', err);
      return `${datePrefix}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    }
  };

  const checkIfOrderExists = async (tenantId: string, easyOrderId: string): Promise<boolean> => {
    try {
      const collectionName = `orders_${tenantId}`;
      const q = query(
        collection(db, collectionName),
        where('easyOrderId', '==', easyOrderId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (err) {
      console.error('Error checking order:', err);
      return false;
    }
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
      
      console.log('🔍 Testing connection...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'فشل الاتصال';
        
        if (response.status === 403) {
          errorMessage = 'خطأ في الصلاحيات';
        } else if (response.status === 404) {
          errorMessage = 'Sheet ID أو Range غير صحيح';
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        throw new Error('لا توجد بيانات في النطاق المحدد');
      }

      const headers = data.values[0];
      const dataRows = data.values.slice(1);

      console.log('✅ Connection successful!');

      saveConfig({ sheetId, range, apiKey });

      setTestResult({
        success: true,
        message: 'تم الاتصال بنجاح!',
        rowCount: dataRows.length,
        columnCount: headers.length,
        data: dataRows,
        headers: headers
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

    if (!user?.tenantId || !user?.id) {
      setError('خطأ في بيانات المستخدم');
      return;
    }

    setSaving(true);
    setError('');

    try {
      console.log('💾 Saving config to Firebase...');

      const configData = {
        tenantId: user.tenantId,
        sheetId: sheetId,
        range: range,
        apiKey: apiKey,
        lastSyncedEasyOrderId: lastSyncedOrderId,
        lastSyncedAt: lastSync ? Timestamp.fromDate(lastSync) : null,
        isActive: true,
        updatedAt: Timestamp.now(),
        updatedBy: user.id
      };

      await setDoc(doc(db, 'google_sheets_sync_configs', user.tenantId), configData, { merge: true });

      saveConfig({ sheetId, range, apiKey });

      console.log('✅ Config saved');
      alert('✅ تم حفظ الإعدادات بنجاح!');

    } catch (err: any) {
      console.error('❌ Save failed:', err);
      setError(`خطأ في الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!testResult?.success || !testResult.data || !testResult.headers) {
      setError('يرجى اختبار الاتصال أولاً');
      return;
    }

    if (!user?.tenantId || !user?.id) {
      setError('خطأ في بيانات المستخدم');
      return;
    }

    setSyncing(true);
    setError('');
    setSyncResult(null);

    try {
      console.log('🔄 Starting sync...');
      console.log('📋 Last synced order ID:', lastSyncedOrderId || 'None');

      const headers = testResult.headers;
      const rows = testResult.data;
      
      const orders = await parseOrdersFromSheet(rows, headers, user.tenantId);
      
      console.log(`📊 Parsed ${orders.length} orders`);

      if (orders.length === 0) {
        throw new Error('لا توجد طلبات جديدة للمزامنة');
      }

      const collectionName = `orders_${user.tenantId}`;
      let successCount = 0;
      let skippedCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];
      let latestEasyOrderId = lastSyncedOrderId;

      for (let i = 0; i < orders.length; i++) {
        try {
          const order = orders[i];
          
          // Skip if we haven't reached new orders yet
          if (lastSyncedOrderId && order.easyOrderId) {
            if (order.easyOrderId <= lastSyncedOrderId) {
              console.log(`⏭️ Skipping already synced order: ${order.easyOrderId}`);
              skippedCount++;
              continue;
            }
          }

          // Check for duplicates
          const exists = await checkIfOrderExists(user.tenantId, order.easyOrderId);
          if (exists) {
            console.log(`⚠️ Duplicate found: ${order.easyOrderId}`);
            duplicateCount++;
            continue;
          }

          const orderToSave = {
            ...order,
            source: 'sync', // Mark as synced from Google Sheets
            tenantId: user.tenantId,
            createdBy: user.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          await addDoc(collection(db, collectionName), orderToSave);
          successCount++;
          
          // Track latest order ID
          if (order.easyOrderId && (!latestEasyOrderId || order.easyOrderId > latestEasyOrderId)) {
            latestEasyOrderId = order.easyOrderId;
          }
          
          console.log(`✅ Order ${i + 1}/${orders.length} saved: ${order.referenceNumber}`);

        } catch (err: any) {
          errors.push(`الصف ${i + 2}: ${err.message}`);
          console.error(`❌ Order ${i + 1} failed:`, err);
        }
      }

      // Update last synced order ID
      if (successCount > 0 && latestEasyOrderId) {
        const now = new Date();
        setLastSyncedOrderId(latestEasyOrderId);
        setLastSync(now);
        
        // Save to Firebase
        await updateDoc(doc(db, 'google_sheets_sync_configs', user.tenantId), {
          lastSyncedEasyOrderId: latestEasyOrderId,
          lastSyncedAt: Timestamp.fromDate(now)
        });

        // Save to localStorage
        saveConfig({
          lastSyncedEasyOrderId: latestEasyOrderId,
          lastSyncedAt: now
        });
      }

      console.log(`✅ Sync complete: ${successCount} new, ${skippedCount} skipped, ${duplicateCount} duplicates`);

      setSyncResult({
        success: successCount > 0,
        newOrders: successCount,
        skipped: skippedCount,
        duplicates: duplicateCount,
        errors: errors,
        message: successCount > 0
          ? `تمت مزامنة ${successCount} طلب جديد! ${skippedCount > 0 ? `(تم تجاهل ${skippedCount + duplicateCount} طلب موجود مسبقاً)` : ''}`
          : skippedCount > 0 || duplicateCount > 0
          ? `لا توجد طلبات جديدة. جميع الطلبات موجودة مسبقاً (${skippedCount + duplicateCount})`
          : 'فشلت المزامنة'
      });

    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      setError(err.message || 'فشل في المزامنة');
      setSyncResult({
        success: false,
        newOrders: 0,
        skipped: 0,
        duplicates: 0,
        errors: [err.message],
        message: 'فشلت المزامنة'
      });
    } finally {
      setSyncing(false);
    }
  };

  const EASYORDER_COLUMNS: Record<string, string> = {
    'Full Name': 'customerName',
    'Phone': 'phone',
    'Governorate': 'governorate',
    'City': 'city',
    'Address': 'address',
    'Product Name': 'product',
    'Product Quantity': 'quantity',
    'Order Total Cost': 'price',
    'Order ID': 'easyOrderId',
    'Date': 'orderDate',
    'Payment Method': 'paymentMethod',
    'Customer note': 'notes'
  };

  const parseOrdersFromSheet = async (rows: string[][], headers: string[], tenantId: string) => {
    const orders: any[] = [];
    
    const columnMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      const trimmedHeader = header.trim();
      if (EASYORDER_COLUMNS[trimmedHeader]) {
        columnMap[EASYORDER_COLUMNS[trimmedHeader]] = index;
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.every(cell => !cell || cell.trim() === '')) continue;

      try {
        const customerName = row[columnMap.customerName]?.toString().trim() || '';
        const phoneRaw = row[columnMap.phone]?.toString().trim() || '';
        const governorate = row[columnMap.governorate]?.toString().trim() || '';
        const city = row[columnMap.city]?.toString().trim() || '';
        const address = row[columnMap.address]?.toString().trim() || '';
        const product = row[columnMap.product]?.toString().trim() || '';
        const easyOrderId = row[columnMap.easyOrderId]?.toString().trim() || '';
        const notes = row[columnMap.notes]?.toString().trim() || '';
        const paymentMethod = row[columnMap.paymentMethod]?.toString().trim() || '';
        const orderDateStr = row[columnMap.orderDate]?.toString().trim() || '';
        
        let phone = phoneRaw.replace(/\D/g, '');
        if (phone.length === 10 && !phone.startsWith('0')) {
          phone = '0' + phone;
        }
        
        const priceRaw = row[columnMap.price]?.toString() || '0';
        const price = parseFloat(priceRaw.replace(/[^\d.-]/g, '')) || 0;
        
        const quantityRaw = row[columnMap.quantity]?.toString() || '1';
        const quantity = parseInt(quantityRaw.replace(/\D/g, '')) || 1;

        // Parse order date
        let orderDate = new Date();
        if (orderDateStr) {
          try {
            orderDate = new Date(orderDateStr);
            if (isNaN(orderDate.getTime())) {
              orderDate = new Date();
            }
          } catch {
            orderDate = new Date();
          }
        }

        const referenceNumber = await generateReferenceNumber(tenantId);

        if (!customerName || customerName.length < 2) continue;
        if (!phone || phone.length < 10) continue;
        if (!address || address.length < 5) continue;

        const order = {
          referenceNumber,
          orderNumber: easyOrderId || referenceNumber,
          easyOrderId,
          customerName,
          phone,
          governorate,
          city,
          address,
          product: product || 'غير محدد',
          quantity,
          price,
          paymentMethod,
          status: 'pending',
          notes,
          orderDate: Timestamp.fromDate(orderDate)
        };

        orders.push(order);

      } catch (err) {
        console.error(`❌ Error parsing row ${i + 2}:`, err);
        continue;
      }
    }

    // Sort by EasyOrder ID to maintain order
    orders.sort((a, b) => {
      if (a.easyOrderId && b.easyOrderId) {
        return a.easyOrderId.localeCompare(b.easyOrderId);
      }
      return 0;
    });

    return orders;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">مزامنة Google Sheets</h1>
          <p className="text-gray-500 mt-1">مزامنة الطلبات من EasyOrder تلقائياً</p>
          {lastSync && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>
                آخر مزامنة: {lastSync.toLocaleString('ar-EG')}
                {lastSyncedOrderId && ` | آخر طلب: ${lastSyncedOrderId}`}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-xl font-semibold">إعدادات الاتصال</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google Sheet ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => {
                setSheetId(e.target.value);
                saveConfig({ sheetId: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="19x5A48zRy3j1vmIYnLA6ErjtXGP6YeQlbHQCfH06uX4"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Range <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                saveConfig({ range: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="Sheet1!A1:Y"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                saveConfig({ apiKey: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="AIzaSy..."
            />
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
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
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className={testResult.success ? 'text-green-800 font-medium' : 'text-red-800'}>
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

        {syncResult && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              {syncResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <h2 className="text-xl font-semibold">نتيجة المزامنة</h2>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${
              syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={syncResult.success ? 'text-green-800 font-medium' : 'text-red-800'}>
                {syncResult.message}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-700">
                  {syncResult.newOrders}
                </div>
                <div className="text-sm text-green-600 mt-1">طلبات جديدة</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-700">
                  {syncResult.skipped}
                </div>
                <div className="text-sm text-yellow-600 mt-1">تم تجاهلها</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {syncResult.duplicates}
                </div>
                <div className="text-sm text-blue-600 mt-1">مكررة</div>
              </div>
            </div>

            {syncResult.success && (
              <div className="pt-4 border-t">
                <a
                  href="/dashboard/orders"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  عرض الطلبات →
                </a>
              </div>
            )}

            {syncResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">الأخطاء ({syncResult.errors.length}):</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {syncResult.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700 mb-1">
                      • {error}
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