export interface Business {
  id: string;
  name: string;
  tagline?: string;
  cacNumber?: string;
  tin?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  currency: string;
  ownerId: string;
  plan: 'starter' | 'growth' | 'pro';
  planStatus: 'active' | 'trial' | 'expired';
  receiptFooter?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  activeBusinessId?: string;
  role: 'owner' | 'admin' | 'staff';
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCostPrice?: number; // Preserves historical unit cost at time of sale for margin accuracy
  total: number;
}

export interface Sale {
  id: string;
  businessId: string;
  receiptNumber: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal?: number;
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit';
  paymentStatus: 'paid' | 'partial' | 'pending';
  status?: 'completed' | 'refunded' | 'void';
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Supplies' | 'Marketing' | 'Taxes' | 'Maintenance' | 'Others';
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'card';
  vendor?: string;
  notes?: string;
  recordedBy: string;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  state?: string;
  outstandingBalance: number;
  totalSpent?: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  supplyCategory: string;
  balance: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatRate: number; // e.g. 7.5%
  vatAmount: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Owner' | 'Manager' | 'Cashier' | 'Accountant' | 'Inventory Clerk';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface BusinessMember {
  userId: string;
  role: 'owner' | 'manager' | 'cashier' | 'accountant' | 'inventory_clerk';
  joinedAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  action: 'sale_created' | 'sale_refunded' | 'stock_adjusted' | 'product_added' | 'staff_modified' | 'business_updated' | 'subscription_changed';
  details: string;
  performedBy: string;
  performedById: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type AppModule =
  | 'dashboard'
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'invoices'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'subscription'
  | 'superadmin';
