'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { GoogleSheetsService } from '@/lib/services/googleSheetsService';
import { uploadOrders } from '@/lib/firebase/orders';

interface SyncConfig {
  sheetId: string;
  range: string;
  apiKey: string;
  tenantId: string;
  userId: string;
}

interface SyncResult {
  success: boolean;
  created?: number;
  failed?: number;
  errors?: string[];
  message?: string;
}

export default function OrdersSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [config, setConfig] = useState<SyncConfig>({
    sheetId: '',
    range: 'Sheet1!A2:S',
    apiKey: '',
    tenantId: 'default',
    userId: 'user-id',
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
    
    const savedLastSync = localStorage.getItem('lastSync');
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }
  }, []);

  const handleTestConnection = async () => {
    if (!config.sheetId || !config.apiKey) {
      setTestResult({
        success: false,
        message: '❌ الرجاء إدخال Sheet ID و API Key أولاً',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      console.log('🔍 Testing connection...');
      const service = new GoogleSheetsService({
        spreadsheetId: config.sheetId,
        range: config.range,
        apiKey: config.apiKey,
      });

      const info = await service.getSheetInfo();
      const rowCount = await service.getRowCount();
      
      console.log('✅ Connection successful:', info);
      
      setTestResult({
        success: true,
        message: `✅ تم الاتصال بنجاح!\n\n📊 اسم الشيت: ${info.title}\n📋 عدد الصفوف: ${rowCount}`,
      });
    } catch (error) {
      const err = error as Error;
      console.error('❌ Connection failed:', err);
      setTestResult({
        success: false,
        message: `❌ ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.sheetId || !config.apiKey) {
      alert('❌ الرجاء إدخال Sheet ID و API Key');
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Saving config...');
      
      const service = new GoogleSheetsService({
        spreadsheetId: config.sheetId,
        range: config.range,
        apiKey: config.apiKey,
      });

      const info = await service.getSheetInfo();
      
      localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
      
      console.log('✅ Config saved');
      
      alert(`✅ تم حفظ الإعدادات بنجاح!\n\n📊 اسم الشيت: ${info.title}`);
      
      setTestResult({
        success: true,
        message: `✅ تم حفظ الإعدادات بنجاح!\n\n📊 اسم الشيت: ${info.title}`,
      });
    } catch (error) {
      const err = error as Error;
      console.error('❌ Save failed:', err);
      alert(`❌ فشل حفظ الإعدادات:\n\n${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!config.sheetId || !config.apiKey) {
      alert('❌ الرجاء حفظ الإعدادات أولاً');
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    
    try {
      console.log('📥 جاري جلب البيانات من Google Sheets...');
      
      const service = new GoogleSheetsService({
        spreadsheetId: config.sheetId,
        range: config.range,
        apiKey: config.apiKey,
      });

      const sheetRows = await service.fetchOrders();
      
      if (sheetRows.length === 0) {
        throw new Error('الشيت فارغ أو Range غير صحيح');
      }

      console.log(`📦 تم جلب ${sheetRows.length} سجل من Google Sheets`);

      const orders = sheetRows.map(row => ({
        customerName: row.fullName,
        phone: row.phone,
        address: row.address,
        product: row.productName,
        price: row.orderTotalCost,
        status: undefined,
        shippingCompany: undefined,
        trackingNumber: undefined,
        notes: row.coupon ? `Coupon: ${row.coupon}` : undefined,
      }));

      console.log('📤 جاري رفع الطلبات إلى Firebase...');
      
      // Call uploadOrders - handle both possible return types
      const result = await uploadOrders(
        orders,
        config.tenantId
      ) as any;

      console.log('✅ اكتملت المزامنة:', result);

      // Handle both return type formats:
      // Format 1: { success: number, failed: number, errors: string[] }
      // Format 2: { success: boolean, count: number, errors: any[] }
      let successCount = 0;
      let failedCount = 0;
      
      if (typeof result.success === 'number') {
        // Format 1
        successCount = result.success;
        failedCount = result.failed || 0;
      } else {
        // Format 2
        successCount = result.count || 0;
        failedCount = 0;
      }

      setSyncResult({
        success: true,
        created: successCount,
        failed: failedCount,
        errors: result.errors || [],
      });
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastSync', now.toISOString());
      
      alert(`✅ تمت المزامنة بنجاح!\n\n📊 تم رفع ${successCount} طلب${failedCount > 0 ? `\n❌ فشل ${failedCount} طلب` : ''}`);
      
    } catch (error) {
      const err = error as Error;
      console.error('❌ Sync error:', err);
      
      setSyncResult({
        success: false,
        message: err.message || 'خطأ غير معروف',
      });
      
      alert(`❌ فشلت المزامنة:\n\n${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مزامنة Google Sheets</h1>
        <p className="text-gray-600 mt-2">مزامنة الطلبات من Google Sheets تلقائياً</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">حالة المزامنة</h2>
            {lastSync && (
              <p className="text-sm text-gray-600 mt-1">
                آخر مزامنة: {lastSync.toLocaleString('ar-EG', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || !config.sheetId || !config.apiKey}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-bold"
          >
            {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
          </button>
        </div>

        {syncResult && (
          <div className={`p-4 rounded-lg border-2 ${syncResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-start gap-3">
              {syncResult.success ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${syncResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {syncResult.success ? '✅ تمت المزامنة بنجاح!' : '❌ فشلت المزامنة'}
                </h3>
                {syncResult.success && syncResult.created !== undefined && (
                  <div className="mt-3 space-y-2">
                    <p className="text-green-800 text-sm font-medium">
                      ✨ طلبات تم رفعها بنجاح: <span className="text-lg font-bold text-blue-600">{syncResult.created}</span>
                    </p>
                    {syncResult.failed !== undefined && syncResult.failed > 0 && (
                      <>
                        <p className="text-red-700 text-sm font-medium">
                          ❌ فشل رفعها: <span className="text-lg font-bold">{syncResult.failed}</span>
                        </p>
                        {syncResult.errors && syncResult.errors.length > 0 && (
                          <div className="mt-2 p-3 bg-red-100 rounded text-xs max-h-32 overflow-y-auto">
                            {syncResult.errors.slice(0, 5).map((err, i) => (
                              <div key={i} className="text-red-800 mb-1">• {err}</div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {!syncResult.success && (
                  <p className="mt-2 text-sm text-red-800 font-medium">{syncResult.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">إعدادات المزامنة</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Google Sheet ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.sheetId}
              onChange={(e) => setConfig({ ...config, sheetId: e.target.value.trim() })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="19x5A48zRy3j1vmIYnLA6ErjtXGP6YeQlbHQCfH06uX4"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Range (النطاق) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.range}
              onChange={(e) => setConfig({ ...config, range: e.target.value.trim() })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Sheet1!A2:S"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Google API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="AIza..."
              dir="ltr"
            />
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border-2 ${testResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm font-medium text-right">{testResult.message}</pre>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.sheetId || !config.apiKey}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
            
            <button
              onClick={handleSaveConfig}
              disabled={saving || !config.sheetId || !config.apiKey}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
        <h3 className="font-bold text-blue-900 mb-3">📋 ترتيب الأعمدة:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 font-medium">
          <div>• A: التاريخ</div>
          <div>• B: الاسم الكامل</div>
          <div>• C: رقم الهاتف</div>
          <div>• D: هاتف بديل</div>
          <div>• E: العنوان</div>
          <div>• F: المدينة</div>
          <div>• G: اسم المنتج</div>
          <div>• H: نوع المنتج</div>
          <div>• I: الكمية</div>
          <div>• J: سعر المنتج</div>
        </div>
      </div>

      <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        <div className="text-sm text-yellow-900 font-medium">
          <strong>⚠️ مهم:</strong> الصف الأول headers، البيانات تبدأ من الصف الثاني
        </div>
      </div>
    </div>
  );
}