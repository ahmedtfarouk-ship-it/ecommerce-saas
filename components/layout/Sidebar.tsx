// components/layout/Sidebar.tsx - COMPLETE FINAL VERSION
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Package, 
  TrendingDown, 
  FileText,
  Link2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  List,
  RefreshCw,
  Upload,
  Edit,
  Truck as TruckIcon,
  UserPlus,
  History,
  PieChart,
  TrendingUp,
  HandCoins,
  Receipt,
  BarChart3,
  CreditCard,
  FileBarChart2,
  Box,
  Plus,
  AlertTriangle,
  ClipboardList,
  RotateCcw,
  Archive,
  LineChart,
  Activity,
  MapPin,
  Building2,
  Sheet,
  MessageCircle,
  Plane,
  Wallet,
  User,
  Shield,
  Cog,
} from 'lucide-react';

interface SubMenuItem {
  name: string;
  href: string;
  icon: any;
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    name: 'لوحة التحكم', 
    href: '/dashboard', 
    icon: LayoutDashboard,
  },
  { 
    name: 'الطلبات', 
    href: '/dashboard/orders', 
    icon: ShoppingCart,
    subItems: [
      { name: 'عرض الطلبات', href: '/dashboard/orders', icon: List },
      { name: 'مزامنة Google Sheets', href: '/dashboard/orders/sync', icon: RefreshCw },
      { name: 'رفع يدوي', href: '/dashboard/orders/upload', icon: Upload },
      { name: 'تعديل وتتبع', href: '/dashboard/orders/manage', icon: Edit },
      { name: 'تحليل وتصدير للشحن', href: '/dashboard/orders/export', icon: TruckIcon },
    ]
  },
  { 
    name: 'العملاء', 
    href: '/dashboard/customers', 
    icon: Users,
    subItems: [
      { name: 'عرض العملاء', href: '/dashboard/customers', icon: Users },
      { name: 'إضافة عميل', href: '/dashboard/customers/new', icon: UserPlus },
      { name: 'تاريخ الطلبات', href: '/dashboard/customers/history', icon: History },
      { name: 'فئات العملاء', href: '/dashboard/customers/segments', icon: PieChart },
      { name: 'تحليل القيمة الدائمة', href: '/dashboard/customers/clv', icon: TrendingUp },
    ]
  },
  { 
    name: 'المالية', 
    href: '/dashboard/finance', 
    icon: DollarSign,
    subItems: [
      { name: 'التسوية مع الشحن', href: '/dashboard/finance/reconciliation', icon: HandCoins },
      { name: 'تسجيل التحصيل', href: '/dashboard/finance/collection', icon: Receipt },
      { name: 'التقارير المالية', href: '/dashboard/finance/reports', icon: BarChart3 },
      { name: 'المصروفات والعمولات', href: '/dashboard/finance/expenses', icon: CreditCard },
      { name: 'الفواتير', href: '/dashboard/finance/invoices', icon: FileBarChart2 },
    ]
  },
  { 
    name: 'المخزون', 
    href: '/dashboard/inventory', 
    icon: Package,
    subItems: [
      { name: 'عرض المنتجات', href: '/dashboard/inventory', icon: Box },
      { name: 'إضافة منتج', href: '/dashboard/inventory/new', icon: Plus },
      { name: 'حركة المخزون', href: '/dashboard/inventory/movements', icon: RefreshCw },
      { name: 'تنبيهات المخزون', href: '/dashboard/inventory/alerts', icon: AlertTriangle },
      { name: 'جرد المخزون', href: '/dashboard/inventory/stocktaking', icon: ClipboardList },
    ]
  },
  { 
    name: 'المرتجعات', 
    href: '/dashboard/returns', 
    icon: TrendingDown,
    subItems: [
      { name: 'عرض المرتجعات', href: '/dashboard/returns', icon: RotateCcw },
      { name: 'رفع كشف مرتجعات', href: '/dashboard/returns/upload', icon: Upload },
      { name: 'إعادة للمخزون', href: '/dashboard/returns/restock', icon: Archive },
      { name: 'تحليل المرتجعات', href: '/dashboard/returns/analytics', icon: LineChart },
    ]
  },
  { 
    name: 'التقارير', 
    href: '/dashboard/reports', 
    icon: FileText,
    subItems: [
      { name: 'تقرير المبيعات', href: '/dashboard/reports/sales', icon: BarChart3 },
      { name: 'تقرير الأداء', href: '/dashboard/reports/performance', icon: Activity },
      { name: 'تقرير العملاء', href: '/dashboard/reports/customers', icon: Users },
      { name: 'تقرير المحافظات', href: '/dashboard/reports/governorates', icon: MapPin },
      { name: 'تقرير شركات الشحن', href: '/dashboard/reports/shipping', icon: Building2 },
    ]
  },
  { 
    name: 'الربط والتكامل', 
    href: '/dashboard/integration', 
    icon: Link2,
    subItems: [
      { name: 'Google Sheets', href: '/dashboard/integration/sheets', icon: Sheet },
      { name: 'WhatsApp Business API', href: '/dashboard/integration/whatsapp', icon: MessageCircle },
      { name: 'APIs شركات الشحن', href: '/dashboard/integration/shipping-apis', icon: Plane },
      { name: 'بوابات الدفع', href: '/dashboard/integration/payment', icon: Wallet },
    ]
  },
  { 
    name: 'الإعدادات', 
    href: '/dashboard/settings', 
    icon: Settings,
    subItems: [
      { name: 'إعدادات الحساب', href: '/dashboard/settings/account', icon: User },
      { name: 'إدارة المستخدمين', href: '/dashboard/settings/users', icon: Users },
      { name: 'الصلاحيات', href: '/dashboard/settings/permissions', icon: Shield },
      { name: 'شركات الشحن', href: '/dashboard/settings/shipping', icon: TruckIcon },
      { name: 'إعدادات النظام', href: '/dashboard/settings/system', icon: Cog },
    ]
  },
];

interface SidebarProps {
  onSignOut?: () => Promise<void>;
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems && pathname.startsWith(item.href)) {
        setOpenMenus(prev => 
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [pathname]);

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
    window.location.href = '/login';
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuOpen = (menuName: string) => openMenus.includes(menuName);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 overflow-y-auto hidden lg:block scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white">
        <h1 className="text-xl font-bold text-blue-600">نظام إدارة الطلبات</h1>
        <p className="text-xs text-gray-500 mt-1">إدارة متكاملة</p>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const menuOpen = isMenuOpen(item.name);
          const active = isActive(item.href);

          return (
            <div key={item.name}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm ${
                    active
                      ? 'bg-blue-600 text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {menuOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    active
                      ? 'bg-blue-600 text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )}

              {hasSubItems && menuOpen && (
                <div className="mr-4 mt-1 space-y-0.5 border-r-2 border-gray-200 pr-2">
                  {item.subItems!.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const subActive = pathname === subItem.href;

                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all ${
                          subActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5" />
                        <span>{subItem.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 mt-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}