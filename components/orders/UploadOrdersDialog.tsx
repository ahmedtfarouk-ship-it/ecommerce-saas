// components/orders/UploadOrdersDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '@/lib/parsers/excelParser';
import { uploadOrders } from '@/lib/firebase/orders';

interface UploadOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tenantId?: string;
}

export function UploadOrdersDialog({
  open,
  onOpenChange,
  onSuccess,
  tenantId,
}: UploadOrdersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10);

      // Parse file
      const parseResult = await parseExcelFile(file);
      setProgress(40);

      if (parseResult.orders.length === 0) {
        setResult({
          success: false,
          message: 'لم يتم العثور على طلبات صالحة في الملف',
          errors: parseResult.errors,
        });
        setUploading(false);
        return;
      }

      // Upload to Firebase
      setProgress(60);
      const uploadResult = await uploadOrders(parseResult.orders, tenantId);
      setProgress(100);

      // Success
      setResult({
        success: uploadResult.success,
        message: `تم رفع ${uploadResult.count} طلب بنجاح`,
        total: parseResult.total,
        valid: uploadResult.count,
        errors: [...parseResult.errors, ...uploadResult.errors],
      });

      // Refresh parent
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ أثناء الرفع',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع طلبات جديدة
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            قم برفع ملف Excel يحتوي على الطلبات
          </p>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">اختر ملف Excel</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-sm"
              />
              {file && (
                <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            {file && (
              <p className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Instructions */}
          {!result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-2">تنسيق الملف المطلوب:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• العمود 1: اسم العميل (إلزامي)</li>
                    <li>• العمود 2: رقم الهاتف (إلزامي)</li>
                    <li>• العمود 3: العنوان (إلزامي)</li>
                    <li>• العمود 4: المدينة (اختياري)</li>
                    <li>• العمود 5: المنتج (إلزامي)</li>
                    <li>• العمود 6: السعر (إلزامي)</li>
                    <li>• العمود 7: ملاحظات (اختياري)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-gray-600">
                جاري الرفع... {progress}%
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.message}
                  </p>
                  {result.total && (
                    <p className="text-sm mt-2 text-gray-700">
                      إجمالي الصفوف: {result.total} | 
                      صالح: {result.valid} | 
                      أخطاء: {result.errors?.length || 0}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                        عرض الأخطاء ({result.errors.length})
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 mr-4">
                        {result.errors.slice(0, 5).map((err: any, i: number) => (
                          <li key={i} className="list-disc">
                            {err.row ? `الصف ${err.row}: ` : ''}{err.error}
                          </li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-gray-500 italic">
                            ... و {result.errors.length - 5} أخطاء أخرى
                          </li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={uploading}
              type="button"
            >
              {result?.success ? 'إغلاق' : 'إلغاء'}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || result?.success}
              type="button"
            >
              {uploading ? 'جاري الرفع...' : 'رفع الطلبات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}