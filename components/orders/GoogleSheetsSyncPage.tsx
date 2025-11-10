'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getGoogleSheetsConfig, disableGoogleSheetsSync } from '@/lib/firebase/googleSheetsConfig';
import { syncOrdersFromGoogleSheets } from '@/lib/services/googleSheetsSync';
import { GoogleSheetsSyncConfig, SyncResult } from '@/types/googleSheets';
import GoogleSheetsSyncDialog from '@/components/orders/GoogleSheetsSyncDialog';

export default function GoogleSheetsSyncPage() {
  const { user, tenant } = useAuth();
  const [config, setConfig] = useState<GoogleSheetsSyncConfig | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenant?.id) {
      loadConfig();
    }
  }, [tenant?.id]);

  const loadConfig = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    setError('');

    try {
      const syncConfig = await getGoogleSheetsConfig(tenant.id);
      setConfig(syncConfig);
    } catch (err) {
      console.error('خطأ في تحميل الإعدادات:', err);
      setError('فشل في تحميل إعدادات المزامنة');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!config || !tenant?.id || !user?.uid) return;

    setSyncing(true);
    setError('');
    setSyncResult(null);

    try {
      const result = await syncOrdersFromGoogleSheets(
        config,
        tenant.id,
        user.uid
      );
      
      setSyncResult(result);
      
      // إعادة تحميل الإعدادات لتحديث آخر وقت مزامنة
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

  if (loading) {
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
        <Button
          onClick={() => setDialogOpen(true)}
          variant={config ? "outline" : "default"}
        >
          <Settings className="ml-2 h-4 w-4" />
          {config ? 'تعديل الإعدادات' : 'إعداد المزامنة'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Status Card */}
      {config ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>حالة المزامنة</CardTitle>
                <CardDescription>
                  آخر مزامنة: {formatDate(config.lastSyncAt)}
                </CardDescription>
              </div>
              <Badge variant={config.isActive ? "default" : "secondary"}>
                {config.isActive ? 'مفعل' : 'معطل'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sheet Info */}
            <div className="space-y-2">
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
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSync}
                disabled={syncing || !config.isActive}
                className="flex-1"
              >
                {syncing ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري المزامنة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="ml-2 h-4 w-4" />
                    مزامنة الآن
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisableSync}
                variant="destructive"
                disabled={loading || syncing}
              >
                تعطيل
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">لم يتم إعداد المزامنة بعد</h3>
                <p className="text-gray-500 mt-2">
                  قم بإعداد الاتصال مع Google Sheets لبدء مزامنة الطلبات تلقائياً
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <Settings className="ml-2 h-4 w-4" />
                إعداد المزامنة الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Result */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  نتيجة المزامنة
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  فشلت المزامنة
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              <AlertDescription>{syncResult.message}</AlertDescription>
            </Alert>

            {syncResult.success && (
              <div className="grid grid-cols-2 gap-4">
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
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية الإعداد</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <GoogleSheetsSyncDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={tenant?.id || ''}
        userId={user?.uid || ''}
        onSyncConfigured={loadConfig}
      />
    </div>
  );
}