'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-gray-600 mt-2">رفع وإدارة طلباتك اليومية</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 ml-2" />
            رفع ملف Excel
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 ml-2" />
            إضافة طلب يدوياً
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">لا توجد طلبات حتى الآن</p>
            <p className="text-sm mt-2">ابدأ برفع ملف Excel يحتوي على طلباتك</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}