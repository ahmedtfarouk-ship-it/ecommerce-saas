// app/layout.tsx
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const cairo = Cairo({ subsets: ['arabic', 'latin'] });

export const metadata: Metadata = {
  title: 'نظام إدارة الطلبات | Orders Management System',
  description: 'نظام متكامل لإدارة طلبات وعملاء التجارة الإلكترونية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}