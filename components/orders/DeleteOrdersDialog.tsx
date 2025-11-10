// components/orders/DeleteOrdersDialog.tsx
'use client';

import { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { deleteOrders } from '@/lib/firebase/orders';

interface DeleteOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderIds: string[];
  tenantId: string;
}

export default function DeleteOrdersDialog({
  isOpen,
  onClose,
  onSuccess,
  orderIds,
  tenantId
}: DeleteOrdersDialogProps) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteOrders(orderIds, tenantId);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('خطأ في حذف الطلبات:', error);
      alert('حدث خطأ أثناء حذف الطلبات');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تأكيد الحذف</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            هل أنت متأكد من حذف{' '}
            <span className="font-bold text-red-600">{orderIds.length}</span>{' '}
            {orderIds.length === 1 ? 'طلب' : 'طلب'}؟
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الطلبات نهائياً من قاعدة البيانات.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                حذف نهائياً
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}