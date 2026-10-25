// TypeScript definitions exactly matching docs/schema.md

export interface Category {
  id: string;
  name: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  icon: string;
  imageUrl?: string | null;
  priceDineIn: number;
  priceTakeAway: number;
  stockQuantity: number;
  unit: string;
  unitsPerCase?: number | null;
  trackStock: boolean;
  lowStockAt: number;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface OrderItem {
  productId: string;
  name: string;
  icon: string;
  price: number;
  quantity: number;
  subtotal: number;
  trackStock: boolean;
}

export type OrderType = 'DINE_IN' | 'TAKE_AWAY';
export type OrderStatus = 'ACTIVE' | 'VOIDED';

export interface Order {
  id: string;
  orderType: OrderType;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  dateString: string;
  monthString: string;
  createdAt?: { seconds: number; nanoseconds: number } | string | Date;
  createdBy: string;
  voidedAt?: unknown;
  voidedBy?: string | null;
}

export interface DailySummary {
  dateString: string;
  monthString: string;
  totalRevenue: number;
  totalExpense: number;
  totalOrders: number;
  lastUpdated?: unknown;
}

export type ExpenseType = 'RESTOCK' | 'SUPPLIES' | 'OTHER';

export interface Expense {
  id: string;
  expenseType: ExpenseType;
  categoryName: string;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  amount: number;
  note?: string | null;
  status: 'ACTIVE';
  dateString: string;
  monthString: string;
  createdAt?: { seconds: number; nanoseconds: number } | string | Date;
  createdBy: string;
}

export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
  active: boolean;
  createdAt?: string;
}
