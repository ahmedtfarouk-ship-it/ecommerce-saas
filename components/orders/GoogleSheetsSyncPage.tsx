// components/orders/GoogleSheetsSyncPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getGoogleSheetsConfig, disableGoogleSheetsSync } from '@/lib/firebase/googleSheetsConfig';
import { syncOrdersFromGoogleSheets } from '@/services/googleSheetsSync';
import { GoogleSheetsSyncConfig, SyncResult } from '@/types';
import GoogleSheetsSyncDialog from './GoogleSheetsSyncDialog';

export default function GoogleSheetsSyncPage() {
  const { user } = useAuthContext();
  const [config, setConfig] = useState<GoogleSheetsSyncConfig | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.tenantId) {
      loadConfig();
    }
  }, [user?.tenantId]);

  const loadConfig = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    setError('');

    try {
      const syncConfig = await getGoogleSheetsConfig(user.tenantId);
      setConfig(syncConfig);
    } catch (err) {
      console.error('خطأ في تحميل الإعدادات:', err);
      setError('فشل في تحميل إعدادات المزامنة');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!config || !user?.tenantId || !user?.id) return;

    setSyncing(true);
    setError('');
    setSyncResult(null);

    try {
      const result = await syncOrdersFromGoogleSheets(
        config,
        user.tenantId,
        user.id
      );
      
      setSyncResult(result);
      await loadConfig();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      setError(`فشل في المزامنة: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisableSync = async () => {
    if (!config?.id) return;

    if (!confirm('هل أنت متأكد من تعطيل المزامنة؟')) {
      return;
    }

    setLoading(true);
    try {
      await disableGoogleSheetsSync(config.id);
      setConfig(null);
      setSyncResult(null);
    } catch (err) {
      console.error('خطأ في تعطيل المزامنة:', err);
      setError('فشل في تعطيل المزامنة');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'لم يتم بعد';
    return new Date(date).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مزامنة Google Sheets</h1>
          <p className="text-gray-500 mt-1">
            مزامنة الطلبات من Google Sheets تلقائياً
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            config 
              ? 'border border-gray-300 hover:bg-gray-50' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          {config ? 'تعديل الإعدادات' : 'إعداد المزامنة'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Sync Status Card */}
      {config ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">حالة المزامنة</h2>
              <p className="text-gray-500 text-sm mt-1">
                آخر مزامنة: {formatDate(config.lastSyncAt)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              config.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {config.isActive ? 'مفعل' : 'معطل'}
            </span>
          </div>

          {/* Sheet Info */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Google Sheet ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {config.sheetId}
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Range:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {config.range}
              </code>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing || !config.isActive}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  مزامنة الآن
                </>
              )}
            </button>
            <button
              onClick={handleDisableSync}
              disabled={loading || syncing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              تعطيل
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">لم يتم إعداد المزامنة بعد</h3>
              <p className="text-gray-500 mt-2">
                قم بإعداد الاتصال مع Google Sheets لبدء مزامنة الطلبات تلقائياً
              </p>
            </div>
            <button 
              onClick={() => setDialogOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              إعداد المزامنة الآن
            </button>
          </div>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            {syncResult.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-semibold">نتيجة المزامنة</h2>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-semibold">فشلت المزامنة</h2>
              </>
            )}
          </div>

          <div className={`p-4 rounded-lg mb-4 ${
            syncResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={syncResult.success ? 'text-green-800' : 'text-red-800'}>
              {syncResult.message}
            </p>
          </div>

          {syncResult.success && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {syncResult.newOrders}
                </div>
                <div className="text-sm text-green-600">طلبات جديدة</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {syncResult.updatedOrders}
                </div>
                <div className="text-sm text-blue-600">طلبات محدثة</div>
              </div>
            </div>
          )}

          {syncResult.errors.length > 0 && (
            <div className="space-y-2">
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

      {/* Instructions Card */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">كيفية الإعداد</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
          <li>
            <strong>إنشاء Google API Key:</strong>
            <ul className="list-disc list-inside mr-6 mt-2 space-y-1 text-gray-600">
              <li>اذهب إلى Google Cloud Console</li>
              <li>قم بإنشاء مشروع جديد أو اختر مشروع موجود</li>
              <li>فعّل Google Sheets API</li>
              <li>أنشئ API Key من Credentials</li>
            </ul>
          </li>
          <li>
            <strong>إعداد Google Sheet:</strong>
            <ul className="list-disc list-inside mr-6 mt-2 space-y-1 text-gray-600">
              <li>اجعل الملف مشاركاً للعامة (Anyone with link can view)</li>
              <li>تأكد من أن الصف الأول يحتوي على العناوين</li>
              <li>البيانات تبدأ من الصف الثاني</li>
            </ul>
          </li>
          <li>
            <strong>ترتيب الأعمدة المتوقع:</strong>
            <ul className="list-disc list-inside mr-6 mt-2 space-y-1 text-gray-600">
              <li>A: اسم العميل</li>
              <li>B: رقم الهاتف</li>
              <li>C: العنوان</li>
              <li>D: المنتج</li>
              <li>E: السعر</li>
              <li>F: الحالة (اختياري)</li>
              <li>G: شركة الشحن (اختياري)</li>
              <li>H: رقم التتبع (اختياري)</li>
              <li>I: ملاحظات (اختياري)</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Settings Dialog */}
      <GoogleSheetsSyncDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={user?.tenantId || ''}
        userId={user?.id || ''}
        onSyncConfigured={loadConfig}
      />
    </div>
  );
}