// types/user.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  maxUsers: number;
  maxOrders: number;
  createdAt: Date;
  settings: {
    autoDeductInventory: boolean;
    lowStockAlert: number;
    shippingCompanies: string[];
  };
}