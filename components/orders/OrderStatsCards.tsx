// components/orders/OrderStatsCards.tsx
'use client';

import { OrderStats } from '@/types/order';
import { formatCurrency } from '@/lib/utils/referenceNumber';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';

interface OrderStatsCardsProps {
  stats: OrderStats;
}

export function OrderStatsCards({ stats }: OrderStatsCardsProps) {
  const cards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'قيد الانتظار',
      value: stats.new,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'تم التأكيد',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'تم الشحن',
      value: stats.shipped,
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'تم التسليم',
      value: stats.delivered,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'المرتجعات',
      value: stats.returned,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isLarge: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`${card.isLarge ? 'text-xl' : 'text-2xl'} font-bold`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}