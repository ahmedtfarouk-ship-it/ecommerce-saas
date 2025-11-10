'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Package,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  returnRate: number;
  avgOrderValue: number;
  todayOrders: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    returnRate: 0,
    avgOrderValue: 0,
    todayOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real stats from Firebase here
    // For now, using mock data
    setTimeout(() => {
      setStats({
        totalOrders: 1247,
        pendingOrders: 43,
        deliveredOrders: 1089,
        totalRevenue: 523490,
        totalCustomers: 876,
        returnRate: 4.2,
        avgOrderValue: 419,
        todayOrders: 23,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    change,
    changeType = 'increase'
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'increase' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {change}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    href: string; 
    color: string;
  }) => (
    <Link href={href}>
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-500">
        <div className={`p-3 rounded-lg ${color} w-fit mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة عامة على أداء المتجر</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders.toLocaleString('ar-EG')}
          icon={ShoppingCart}
          color="bg-blue-600"
          change="+12%"
          changeType="increase"
        />
        <StatCard
          title="قيد الانتظار"
          value={stats.pendingOrders}
          icon={Clock}
          color="bg-yellow-600"
          change="-5%"
          changeType="decrease"
        />
        <StatCard
          title="تم التسليم"
          value={stats.deliveredOrders.toLocaleString('ar-EG')}
          icon={CheckCircle}
          color="bg-green-600"
          change="+8%"
          changeType="increase"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`}
          icon={DollarSign}
          color="bg-purple-600"
          change="+15%"
          changeType="increase"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي العملاء"
          value={stats.totalCustomers.toLocaleString('ar-EG')}
          icon={Users}
          color="bg-indigo-600"
        />
        <StatCard
          title="طلبات اليوم"
          value={stats.todayOrders}
          icon={TrendingUp}
          color="bg-cyan-600"
        />
        <StatCard
          title="متوسط قيمة الطلب"
          value={`${stats.avgOrderValue} ج.م`}
          icon={Package}
          color="bg-orange-600"
        />
        <StatCard
          title="نسبة المرتجعات"
          value={`${stats.returnRate}%`}
          icon={TrendingDown}
          color="bg-red-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="عرض الطلبات"
            description="إدارة وعرض جميع الطلبات"
            icon={ShoppingCart}
            href="/dashboard/orders"
            color="bg-blue-600"
          />
          <QuickActionCard
            title="مزامنة Google Sheets"
            description="مزامنة الطلبات من Google Sheets"
            icon={TrendingUp}
            href="/dashboard/orders/sync"
            color="bg-green-600"
          />
          <QuickActionCard
            title="إدارة العملاء"
            description="عرض وإدارة قاعدة العملاء"
            icon={Users}
            href="/dashboard/customers"
            color="bg-purple-600"
          />
          <QuickActionCard
            title="التقارير المالية"
            description="عرض التقارير والإحصائيات المالية"
            icon={DollarSign}
            href="/dashboard/finance/reports"
            color="bg-yellow-600"
          />
          <QuickActionCard
            title="المخزون"
            description="إدارة المنتجات والمخزون"
            icon={Package}
            href="/dashboard/inventory"
            color="bg-indigo-600"
          />
          <QuickActionCard
            title="المرتجعات"
            description="متابعة وإدارة المرتجعات"
            icon={TrendingDown}
            href="/dashboard/returns"
            color="bg-red-600"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">آخر الطلبات</h2>
          <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 font-semibold">
            عرض الكل ←
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: '#ORD-001', customer: 'أحمد محمد', amount: 450, status: 'pending', date: 'اليوم، 10:30 ص' },
                { id: '#ORD-002', customer: 'سارة علي', amount: 320, status: 'delivered', date: 'اليوم، 09:15 ص' },
                { id: '#ORD-003', customer: 'محمد حسن', amount: 550, status: 'shipped', date: 'أمس، 11:45 م' },
                { id: '#ORD-004', customer: 'نور أحمد', amount: 280, status: 'pending', date: 'أمس، 08:20 م' },
                { id: '#ORD-005', customer: 'ياسمين خالد', amount: 390, status: 'delivered', date: 'أمس، 03:10 م' },
              ].map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {order.amount} ج.م
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'pending' ? 'قيد الانتظار' :
                       order.status === 'delivered' ? 'تم التسليم' :
                       order.status === 'shipped' ? 'قيد الشحن' : order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}