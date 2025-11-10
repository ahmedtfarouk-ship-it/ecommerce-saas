// components/layout/Header.tsx
'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';
import { Bell, User } from 'lucide-react';

export default function Header() {
  const { user } = useAuthContext();

  // Get first letter safely
  const getInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U'; // Default
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'مستخدم';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            مرحباً بك
          </h2>
          {user?.email && (
            <p className="text-sm text-gray-600">{user.email}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
            {/* Avatar with initial */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitial()}
            </div>
            <span className="text-sm font-medium hidden md:block">
              {getDisplayName()}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}