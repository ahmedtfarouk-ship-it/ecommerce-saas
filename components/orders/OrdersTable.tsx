// components/orders/OrdersTable.tsx
'use client';

import { useState } from 'react';
import { Order, OrderStatus, sendWhatsAppMessage } from '@/lib/firebase/orders';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageCircle, Edit, Trash2, CheckCircle } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onBulkDelete?: (orderIds: string[]) => void;
  onRefresh?: () => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  returned: 'مرتجع',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  returned: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onBulkDelete,
  onRefresh,
}: OrdersTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o.id));
    }
  };

  const handleWhatsApp = (order: Order) => {
    sendWhatsAppMessage(order);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '0 ج.م';
    return `${price.toLocaleString('ar-EG')} ج.م`;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.length} طلب محدد
          </span>
          <div className="flex gap-2 mr-auto">
            <Button size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 ml-2" />
              تأكيد الكل
            </Button>
            <Button size="sm" variant="outline">
              <MessageCircle className="h-4 w-4 ml-2" />
              واتساب للكل
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!confirm(`حذف ${selectedIds.length} طلب؟`)) return;
                
                if (onBulkDelete) {
                  await onBulkDelete(selectedIds);
                  setSelectedIds([]);
                } else {
                  // Fallback: delete one by one
                  for (const id of selectedIds) {
                    const order = orders.find(o => o.id === id);
                    if (order && onDelete) {
                      await onDelete(order);
                    }
                  }
                  setSelectedIds([]);
                  onRefresh?.();
                }
              }}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-right w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="p-3 text-right font-medium text-gray-700">الرقم المرجعي</th>
                <th className="p-3 text-right font-medium text-gray-700">العميل</th>
                <th className="p-3 text-right font-medium text-gray-700">الهاتف</th>
                <th className="p-3 text-right font-medium text-gray-700">المدينة</th>
                <th className="p-3 text-right font-medium text-gray-700">المنتج</th>
                <th className="p-3 text-right font-medium text-gray-700">القيمة</th>
                <th className="p-3 text-right font-medium text-gray-700">الحالة</th>
                <th className="p-3 text-right font-medium text-gray-700">التاريخ</th>
                <th className="p-3 text-right font-medium text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">لا توجد طلبات</p>
                      <p className="text-xs text-gray-400">قم برفع ملف Excel لإضافة طلبات</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr 
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {order.referenceNumber || '-'}
                    </td>
                    <td className="p-3 font-medium text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {formatPhone(order.phone)}
                    </td>
                    <td className="p-3 text-gray-600">
                      {order.city || '-'}
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-gray-600">
                      {order.product}
                    </td>
                    <td className="p-3 font-medium text-gray-900">
                      {formatPrice(order.price)}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWhatsApp(order)}
                          title="إرسال واتساب"
                          className="h-8 w-8 p-0"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(order)}
                            title="تعديل"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`حذف طلب ${order.customerName}؟`)) {
                                onDelete(order);
                              }
                            }}
                            title="حذف"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 px-2">
          <p>
            عرض <span className="font-medium text-gray-900">{orders.length}</span> طلب
          </p>
          {selectedIds.length > 0 && (
            <p>
              محدد: <span className="font-medium text-blue-600">{selectedIds.length}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}