// hooks/useAuth.ts
'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';

/**
 * Alternative hook for auth (points to useAuthContext)
 * Use this if you prefer useAuth() instead of useAuthContext()
 */
export function useAuth() {
  return useAuthContext();
}

// Export everything from AuthProvider
export { useAuthContext } from '@/components/providers/AuthProvider';