// app/(dashboard)/dashboard/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit as firestoreLimit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Loader2, Package, AlertCircle, RefreshCw, Upload, Trash2, ChevronLeft, ChevronRight, Search, Calendar } from 'lucide-react';

interface Order {
  id: string;
  referenceNumber?: string;
  orderNumber: string;
  easyOrderId?: string;
  customerName: string;
  phone: string;
  address: string;
  governorate?: string;
  city?: string;
  product: string;
  quantity: number;
  price: number;
  status: string;
  notes?: string;
  paymentMethod?: string;
  source?: 'sync' | 'manual';
  orderDate?: any;
  createdAt: any;
  createdBy: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  const loadOrders = async (page: number = 1, size: number = pageSize) => {
    if (!user?.tenantId) {
      setError('خطأ في بيانات المستخدم');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const collectionName = `orders_${user.tenantId}`;
      console.log('📊 Loading orders from:', collectionName);

      // Get total count first
      const allOrdersSnapshot = await getDocs(collection(db, collectionName));
      setTotalOrders(allOrdersSnapshot.size);

      // Get paginated orders
      const q = query(
        collection(db, collectionName),
        orderBy('createdAt', 'desc'),
        firestoreLimit(size)
      );

      const snapshot = await getDocs(q);
      
      console.log('✅ Found', snapshot.size, 'orders');

      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          referenceNumber: data.referenceNumber || data.orderNumber,
          quantity: typeof data.quantity === 'number' ? data.quantity : 1,
          price: typeof data.price === 'number' ? data.price : 0,
        } as Order);
      });

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setCurrentPage(page);

      if (ordersData.length === 0) {
        setError('لا توجد طلبات حتى الآن. قم بمزامنة الطلبات من Google Sheets أو رفع ملف Excel.');
      }

    } catch (err: any) {
      console.error('❌ Error loading orders:', err);
      setError(`فشل في تحميل الطلبات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderRef: string) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب ${orderRef}؟\n\nلا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    if (!user?.tenantId) return;

    setDeleting(orderId);

    try {
      const collectionName = `orders_${user.tenantId}`;
      await deleteDoc(doc(db, collectionName, orderId));
      
      console.log('✅ Order deleted:', orderId);
      
      // Remove from state
      setOrders(orders.filter(o => o.id !== orderId));
      setFilteredOrders(filteredOrders.filter(o => o.id !== orderId));
      setTotalOrders(prev => prev - 1);
      
      alert('✅ تم حذف الطلب بنجاح');

    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      alert(`❌ فشل في حذف الطلب: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = orders.filter(order => 
      order.referenceNumber?.toLowerCase().includes(searchLower) ||
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.easyOrderId?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.phone?.includes(term) ||
      order.address?.toLowerCase().includes(searchLower)
    );

    setFilteredOrders(filtered);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadOrders(1, newSize);
  };

  useEffect(() => {
    if (isAuthenticated && user?.tenantId) {
      loadOrders();
    }
  }, [isAuthenticated, user?.tenantId]);

  // Calculate statistics
  const stats = {
    totalOrders: totalOrders,
    displayedOrders: filteredOrders.length,
    totalQuantity: filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0),
    totalValue: filteredOrders.reduce((sum, order) => sum + ((order.price || 0) * (order.quantity || 0)), 0),
    averagePrice: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, order) => sum + (order.price || 0), 0) / filteredOrders.length 
      : 0,
  };

  const totalPages = Math.ceil(stats.displayedOrders / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, stats.displayedOrders);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Format date helper
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.seconds 
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-lg border p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">يجب تسجيل الدخول</h2>
          <p className="text-gray-600">يرجى تسجيل الدخول لعرض الطلبات</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الطلبات</h1>
            <p className="text-gray-500 mt-1">
              إجمالي الطلبات: {stats.totalOrders}
              {searchTerm && ` | نتائج البحث: ${stats.displayedOrders}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadOrders()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </button>
            <a
              href="/dashboard/orders/sync"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              مزامنة
            </a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف، أو العنوان..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">الطلبات المعروضة</p>
              <p className="text-2xl font-bold text-gray-900">{stats.displayedOrders}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">إجمالي الكميات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalValue.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">متوسط السعر</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averagePrice.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800">{error}</p>
                {error.includes('مزامنة') && (
                  <a
                    href="/dashboard/orders/sync"
                    className="text-blue-600 underline text-sm mt-2 inline-block"
                  >
                    اذهب إلى صفحة المزامنة →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Size Selector */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-4 bg-white rounded-lg border p-4">
            <span className="text-sm text-gray-600">عدد الطلبات في الصفحة:</span>
            <div className="flex gap-2">
              {[50, 100, 200, 500].map(size => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pageSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 mr-auto">
              عرض {startIndex + 1} - {endIndex} من {stats.displayedOrders}
            </span>
          </div>
        )}

        {/* Orders Table */}
        {paginatedOrders.length > 0 ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      #
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      رقم الطلب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      تاريخ الطلب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      المصدر
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      اسم العميل
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      رقم الهاتف
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      العنوان
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      الكمية
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      السعر
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-blue-600">
                            {order.referenceNumber || order.orderNumber}
                          </span>
                          {order.easyOrderId && order.easyOrderId !== order.referenceNumber && (
                            <span className="text-xs text-gray-500">
                              EasyOrder: {order.easyOrderId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(order.orderDate || order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.source === 'sync' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.source === 'sync' ? '🔄 مزامنة' : '📤 يدوي'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                        {order.phone}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs">
                        <div className="flex flex-col">
                          {order.city && (
                            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                              {order.city}{order.governorate && `, ${order.governorate}`}
                            </span>
                          )}
                          <span className="truncate">
                            {order.address}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.product}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-semibold whitespace-nowrap">
                        {order.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                        {order.price.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'pending' ? 'قيد الانتظار' : order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.referenceNumber || order.orderNumber)}
                          disabled={deleting === order.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="حذف الطلب"
                        >
                          {deleting === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !error && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'لا توجد نتائج' : 'لا توجد طلبات'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'لم يتم العثور على طلبات تطابق البحث'
                : 'ابدأ بمزامنة الطلبات من Google Sheets أو رفع ملف Excel'
              }
            </p>
            {!searchTerm && (
              <div className="flex gap-3 justify-center">
                <a
                  href="/dashboard/orders/sync"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  مزامنة من Google Sheets
                </a>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-lg border p-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}