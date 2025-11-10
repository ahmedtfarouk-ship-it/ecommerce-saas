// app/(dashboard)/integrations/google-sheets/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Link as LinkIcon, RefreshCw } from 'lucide-react';

export default function GoogleSheetsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-green-600" />
          ربط Google Sheets
        </h1>
        <p className="text-gray-600 mt-2">
          قم بربط حسابك في Google Sheets لمزامنة الطلبات تلقائياً
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">حالة الاتصال</h2>
            <p className="text-sm text-gray-600">غير متصل</p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <LinkIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        <Button className="w-full" size="lg">
          <FileSpreadsheet className="h-5 w-5 ml-2" />
          ربط حساب Google
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <RefreshCw className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold mb-2">مزامنة تلقائية</h3>
          <p className="text-sm text-gray-600">
            مزامنة الطلبات من Google Sheets تلقائياً كل فترة
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-2">ربط متعدد</h3>
          <p className="text-sm text-gray-600">
            يمكنك ربط أكثر من Sheet في نفس الوقت
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <LinkIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">ربط الأعمدة</h3>
          <p className="text-sm text-gray-600">
            حدد أي الأعمدة تتوافق مع بيانات الطلبات
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">كيفية الربط:</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>اضغط على "ربط حساب Google" وقم بتسجيل الدخول</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>اختر الـ Spreadsheet الذي تريد ربطه</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>حدد الأعمدة التي تحتوي على بيانات الطلبات</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>فعّل المزامنة التلقائية أو اليدوية</span>
          </li>
        </ol>
      </div>
    </div>
  );
}