'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Settings } from 'lucide-react';

export default function OrdersSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      // Simulate sync (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        success: true,
        newOrders: 15,
        updatedOrders: 3,
        errors: 0,
      };
      
      setSyncResult(result);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        error: 'فشلت المزامنة',
      });
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

      {/* Sync Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">حالة المزامنة</h2>
            {lastSync && (
              <p className="text-sm text-gray-600 mt-1">
                آخر مزامنة: {lastSync.toLocaleString('ar-EG')}
              </p>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`p-4 rounded-lg ${
            syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {syncResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  syncResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {syncResult.success ? 'تمت المزامنة بنجاح!' : 'فشلت المزامنة'}
                </h3>
                {syncResult.success && (
                  <div className="mt-2 space-y-1 text-sm text-green-800">
                    <p>• طلبات جديدة: {syncResult.newOrders}</p>
                    <p>• طلبات محدثة: {syncResult.updatedOrders}</p>
                    {syncResult.errors > 0 && (
                      <p className="text-red-600">• أخطاء: {syncResult.errors}</p>
                    )}
                  </div>
                )}
                {!syncResult.success && (
                  <p className="mt-1 text-sm text-red-800">{syncResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">إعدادات المزامنة</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheet ID
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              dir="ltr"
            />
            <p className="mt-1 text-xs text-gray-500">
              ID الخاص بالشيت من رابط Google Sheets
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range (النطاق)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sheet1!A2:S"
              dir="ltr"
            />
            <p className="mt-1 text-xs text-gray-500">
              مثال: Sheet1!A2:S (من A2 إلى S بدون الهيدر)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google API Key
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="AIza..."
              dir="ltr"
            />
            <p className="mt-1 text-xs text-gray-500">
              API Key من Google Cloud Console
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="autoSync"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              defaultChecked
            />
            <label htmlFor="autoSync" className="text-sm text-gray-700">
              مزامنة تلقائية كل 15 دقيقة
            </label>
          </div>

          <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            حفظ الإعدادات
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 كيفية الإعداد:</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. افتح Google Cloud Console وأنشئ مشروع جديد</li>
          <li>2. فعّل Google Sheets API</li>
          <li>3. أنشئ API Key</li>
          <li>4. اجعل Google Sheet عام (Anyone with link - Viewer)</li>
          <li>5. انسخ Sheet ID من الرابط</li>
          <li>6. احفظ الإعدادات واضغط "مزامنة الآن"</li>
        </ol>
      </div>
    </div>
  );
}