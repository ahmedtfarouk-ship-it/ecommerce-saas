// app/(dashboard)/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Order, getOrders, deleteOrder } from '@/lib/firebase/orders';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { UploadOrdersDialog } from '@/components/orders/UploadOrdersDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Upload, Search, Package } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrders();
      console.log('Loaded orders:', ordersData.length); // للتأكد
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrders(orders);
      setCurrentPage(1); // Reset to first page
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order =>
      order.customerName?.toLowerCase().includes(query) ||
      order.phone?.includes(query) ||
      order.referenceNumber?.toLowerCase().includes(query) ||
      order.address?.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page
  }, [searchQuery, orders]);

  // Handlers
  const handleRefresh = () => {
    loadData();
  };

  const handleDelete = async (order: Order) => {
    if (!confirm(`حذف طلب ${order.customerName}؟`)) return;

    try {
      console.log('Deleting order:', order.id); // للتأكد
      
      // احذف من Firebase
      await deleteOrder(order.id);
      
      console.log('Deleted successfully from Firebase');
      
      // احذف من الـ state فوراً (بدون ما تستنى loadData)
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setFilteredOrders(prev => prev.filter(o => o.id !== order.id));
      
      // عرض رسالة نجاح
      alert('تم الحذف بنجاح');
      
    } catch (error) {
      console.error('Error deleting:', error);
      alert('فشل الحذف: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  };

  const handleBulkDelete = async (orderIds: string[]) => {
    try {
      console.log('Bulk deleting orders:', orderIds);
      
      // احذف كل الطلبات من Firebase
      for (const orderId of orderIds) {
        await deleteOrder(orderId);
      }
      
      console.log('All orders deleted successfully');
      
      // احذف من الـ state فوراً
      setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
      setFilteredOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
      
      alert(`تم حذف ${orderIds.length} طلب بنجاح`);
      
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('فشل حذف بعض الطلبات');
    }
  };

  const handleEdit = (order: Order) => {
    // TODO: Open edit dialog
    console.log('Edit:', order);
  };

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.price || 0), 0),
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-gray-600">
            إدارة وتتبع جميع طلبات العملاء
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 ml-2" />
            رفع طلبات
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قيد الانتظار</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Package className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تم التسليم</p>
              <p className="text-2xl font-bold">{stats.delivered}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
              <p className="text-xl font-bold">
                {stats.totalRevenue.toLocaleString('ar-EG')} ج.م
              </p>
            </div>
            <Package className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="بحث بالاسم، الهاتف، الرقم المرجعي..."
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Items per page selector */}
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={50}>50 طلب</option>
          <option value={100}>100 طلب</option>
          <option value={250}>250 طلب</option>
          <option value={500}>500 طلب</option>
          <option value={1000}>1000 طلب</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      ) : (
        <>
          <OrdersTable
            orders={paginatedOrders}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onRefresh={handleRefresh}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-600">
                عرض {startIndex + 1} إلى {Math.min(endIndex, filteredOrders.length)} من {filteredOrders.length} طلب
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages}
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <UploadOrdersDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}