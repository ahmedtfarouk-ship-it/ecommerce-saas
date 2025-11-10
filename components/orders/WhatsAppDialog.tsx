'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, CheckCircle2 } from 'lucide-react';

interface WhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  orders: any[];
}

export default function WhatsAppDialog({ open, onClose, orders }: WhatsAppDialogProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const generateWhatsAppMessage = (order: any) => {
    const message = `أهلاً ${order.customerName}،

لقد قمت بعمل طلب لـ ${order.productName}
بقيمة ${order.totalAmount} جنيه

سوف يتم توصيل الطلب في خلال من يومين إلى 5 أيام
متاح معاينة المنتج قبل الدفع والاستلام

شكراً لك.`;

    return encodeURIComponent(message);
  };

  const generateWhatsAppLink = (phone: string, message: string) => {
    // تنظيف رقم التليفون - إزالة كل ما عدا الأرقام
    let cleanPhone = phone.replace(/\D/g, '');
    
    // إزالة أي أصفار في البداية
    cleanPhone = cleanPhone.replace(/^0+/, '');
    
    // إضافة كود مصر 20 لو مش موجود
    if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  };

  const handleSendIndividual = (order: any) => {
    const message = generateWhatsAppMessage(order);
    const link = generateWhatsAppLink(order.customerPhone, message);
    window.open(link, '_blank');
    setSent(prev => [...prev, order.id]);
  };

  const handleSendToAll = () => {
    setSending(true);
    
    pendingOrders.forEach((order, index) => {
      setTimeout(() => {
        handleSendIndividual(order);
      }, index * 1500); // فاصل 1.5 ثانية بين كل رسالة
    });

    setTimeout(() => {
      setSending(false);
      alert(`تم فتح ${pendingOrders.length} رابط واتساب`);
    }, pendingOrders.length * 1500 + 500);
  };

  const pendingOrders = orders.filter(o => !o.whatsappSent);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>إرسال رسائل واتساب</DialogTitle>
          <DialogDescription>
            سيتم إرسال رسائل تأكيد لـ {pendingOrders.length} عميل
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">نموذج الرسالة:</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {`أهلاً [اسم العميل]،

لقد قمت بعمل طلب لـ [اسم المنتج]
بقيمة [المبلغ] جنيه

سوف يتم توصيل الطلب في خلال من يومين إلى 5 أيام
متاح معاينة المنتج قبل الدفع والاستلام

شكراً لك.`}
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-gray-600" dir="ltr">{order.customerPhone}</p>
                </div>
                {sent.includes(order.id) && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ سيتم فتح نافذة واتساب منفصلة لكل عميل. تأكد من السماح بالنوافذ المنبثقة.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSendToAll}
              disabled={sending || pendingOrders.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 ml-2" />
              {sending ? 'جاري الإرسال...' : `إرسال لـ ${pendingOrders.length} عميل`}
            </Button>
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}