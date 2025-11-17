// components/orders/GoogleSheetsSyncDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { testGoogleSheetsConnection } from '@/services/googleSheetsSync';
import { 
  saveGoogleSheetsConfig, 
  getGoogleSheetsConfig 
} from '@/lib/firebase/googleSheetsConfig';
import { GoogleSheetsSyncConfig } from '@/types';

interface GoogleSheetsSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  userId: string;
  onSyncConfigured: () => void;
}

export default function GoogleSheetsSyncDialog({
  open,
  onOpenChange,
  tenantId,
  userId,
  onSyncConfigured
}: GoogleSheetsSyncDialogProps) {
  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A2:S');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [existingConfig, setExistingConfig] = useState<GoogleSheetsSyncConfig | null>(null);

  useEffect(() => {
    if (open && tenantId) {
      loadExistingConfig();
    }
  }, [open, tenantId]);

  const loadExistingConfig = async () => {
    try {
      const config = await getGoogleSheetsConfig(tenantId);
      if (config) {
        setExistingConfig(config);
        setSheetId(config.sheetId);
        setRange(config.range);
        setApiKey(config.apiKey);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
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
      const result = await testGoogleSheetsConnection(sheetId, range, apiKey);
      setTestResult(result);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في الاختبار';
      setError(errorMessage);
      setTestResult({ success: false, message: errorMessage });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!sheetId || !range || !apiKey) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    if (!testResult?.success) {
      setError('يرجى اختبار الاتصال أولاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config: Omit<GoogleSheetsSyncConfig, 'id'> = {
        tenantId,
        sheetId,
        range,
        apiKey,
        isActive: true,
        createdAt: existingConfig?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        ...(existingConfig?.lastSyncAt && { lastSyncAt: existingConfig.lastSyncAt })
      };

      await saveGoogleSheetsConfig(config, existingConfig?.id);
      
      onSyncConfigured();
      onOpenChange(false);
      
      setSheetId('');
      setRange('Sheet1!A2:S');
      setApiKey('');
      setTestResult(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في الحفظ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setError('');
      setTestResult(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">إعدادات مزامنة Google Sheets</h2>
          <p className="text-gray-600 mt-2">قم بتكوين الاتصال مع Google Sheets لمزامنة الطلبات تلقائياً</p>
        </div>

        <div className="space-y-6">
          {/* Google Sheet ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google Sheet ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              يمكن العثور على الـ ID في رابط Google Sheet بين /d/ و /edit
            </p>
          </div>

          {/* Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Range (النطاق) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: Sheet1!A2:S"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              النطاق من الصف 2 إلى آخر صف (من A إلى S حوالي 19 عمود)
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Google API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="أدخل API Key من Google Cloud Console"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              يجب تفعيل Google Sheets API في Google Cloud Console
            </p>
          </div>

          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={testing || loading || !sheetId || !range || !apiKey}
            className="w-full py-2 px-4 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </p>
                  {testResult.rowCount !== undefined && (
                    <p className="text-sm text-green-700 mt-1">
                      عدد الصفوف: {testResult.rowCount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> يجب أن يكون Google Sheet مشاركاً للعامة (Anyone with link can view) 
              أو استخدام Service Account للوصول الآمن.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !testResult?.success}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ الإعدادات'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}