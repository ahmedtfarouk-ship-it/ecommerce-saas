// lib/hooks/useAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              tenantId: userData.tenantId,
              createdAt: userData.createdAt?.toDate(),
              updatedAt: userData.updatedAt?.toDate(),
            });
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string, tenantName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userId = result.user.uid;
      const tenantId = `tenant_${Date.now()}`;
      
      await setDoc(doc(db, 'tenants', tenantId), {
        name: tenantName,
        plan: 'free',
        status: 'trial',
        maxUsers: 1,
        maxOrders: 100,
        createdAt: new Date(),
        settings: { autoDeductInventory: false, lowStockAlert: 10, shippingCompanies: [] }
      });

      await setDoc(doc(db, 'users', userId), {
        email, name, role: 'admin', tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { user, loading, signIn, signUp, signOut, isAuthenticated: !!user };
}