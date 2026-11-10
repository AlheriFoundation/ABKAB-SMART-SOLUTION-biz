import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  Product,
  Sale,
  Expense,
  Customer,
  Supplier,
  Invoice,
  StaffMember,
  AuditLog,
} from '../types';
import { generateInvoiceNumber, generateReceiptNumber, formatNaira } from '../utils/formatters';
import { TrustedFinancialEngine } from '../server/trustedFinancials';

interface BusinessDataContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  staff: StaffMember[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'businessId' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, newQuantity: number, reason?: string) => Promise<void>;

  addSale: (saleData: Omit<Sale, 'id' | 'businessId' | 'createdAt' | 'receiptNumber'>) => Promise<Sale>;
  refundSale: (id: string, reason: string) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'businessId' | 'createdAt'>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId' | 'createdAt'>) => Promise<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'invoiceNumber'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addStaff: (member: Omit<StaffMember, 'id' | 'businessId' | 'createdAt'>) => Promise<StaffMember>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  seedInitialBusinessData: () => Promise<void>;
}

const BusinessDataContext = createContext<BusinessDataContextType | undefined>(undefined);

export const BusinessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeBusiness, currentUser, isDemoMode, userProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time Firestore sync when active business is set and user is authenticated
  useEffect(() => {
    if (!activeBusiness) {
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setCustomers([]);
      setSuppliers([]);
      setInvoices([]);
      setStaff([]);
      setAuditLogs([]);
      return;
    }

    if (isDemoMode) {
      loadDemoData();
      return;
    }

    if (!currentUser) return;

    setIsLoading(true);
    const bizId = activeBusiness.id;
    const unsubscribers: (() => void)[] = [];

    // Products subcollection
    const productsPath = `businesses/${bizId}/products`;
    const unsubProducts = onSnapshot(
      collection(db, productsPath),
      (snap) => {
        const list: Product[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
        setProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, productsPath)
    );
    unsubscribers.push(unsubProducts);

    // Sales subcollection
    const salesPath = `businesses/${bizId}/sales`;
    const unsubSales = onSnapshot(
      collection(db, salesPath),
      (snap) => {
        const list: Sale[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Sale));
        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSales(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, salesPath)
    );
    unsubscribers.push(unsubSales);

    // Expenses subcollection
    const expensesPath = `businesses/${bizId}/expenses`;
    const unsubExpenses = onSnapshot(
      collection(db, expensesPath),
      (snap) => {
        const list: Expense[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Expense));
        list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
        setExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, expensesPath)
    );
    unsubscribers.push(unsubExpenses);

    // Customers subcollection
    const customersPath = `businesses/${bizId}/customers`;
    const unsubCustomers = onSnapshot(
      collection(db, customersPath),
      (snap) => {
        const list: Customer[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Customer));
        setCustomers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, customersPath)
    );
    unsubscribers.push(unsubCustomers);

    // Suppliers subcollection
    const suppliersPath = `businesses/${bizId}/suppliers`;
    const unsubSuppliers = onSnapshot(
      collection(db, suppliersPath),
      (snap) => {
        const list: Supplier[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Supplier));
        setSuppliers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, suppliersPath)
    );
    unsubscribers.push(unsubSuppliers);

    // Invoices subcollection
    const invoicesPath = `businesses/${bizId}/invoices`;
    const unsubInvoices = onSnapshot(
      collection(db, invoicesPath),
      (snap) => {
        const list: Invoice[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Invoice));
        list.sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());
        setInvoices(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, invoicesPath)
    );
    unsubscribers.push(unsubInvoices);

    // Staff subcollection
    const staffPath = `businesses/${bizId}/staff`;
    const unsubStaff = onSnapshot(
      collection(db, staffPath),
      (snap) => {
        const list: StaffMember[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StaffMember));
        setStaff(list);
        setIsLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, staffPath)
    );
    unsubscribers.push(unsubStaff);

    // Audit logs subcollection (Immutable security audit trail)
    const auditLogsPath = `businesses/${bizId}/audit_logs`;
    const unsubAuditLogs = onSnapshot(
      collection(db, auditLogsPath),
      (snap) => {
        const list: AuditLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuditLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, auditLogsPath)
    );
    unsubscribers.push(unsubAuditLogs);

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [activeBusiness?.id, currentUser, isDemoMode]);

  // Demo fallback data loader for realistic Nigerian business metrics
  const loadDemoData = () => {
    setIsLoading(true);
    const sampleProducts: Product[] = [
      {
        id: 'prod_1',
        businessId: 'biz_demo_albarakah',
        name: 'Mama Gold Long Grain Rice (50kg)',
        sku: 'RCE-50KG-MG',
        category: 'Food Provisions',
        costPrice: 65000,
        sellingPrice: 74000,
        quantity: 38,
        lowStockThreshold: 10,
        unit: 'Bags',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_2',
        businessId: 'biz_demo_albarakah',
        name: 'Golden Penny Vegetable Oil (25L)',
        sku: 'OIL-25L-GP',
        category: 'Food Provisions',
        costPrice: 42000,
        sellingPrice: 48500,
        quantity: 24,
        lowStockThreshold: 8,
        unit: 'Gallons',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_3',
        businessId: 'biz_demo_albarakah',
        name: 'Dangote Refined Sugar (50kg)',
        sku: 'SGR-50KG-DG',
        category: 'Commodities',
        costPrice: 62000,
        sellingPrice: 69000,
        quantity: 5,
        lowStockThreshold: 10, // LOW STOCK
        unit: 'Bags',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_4',
        businessId: 'biz_demo_albarakah',
        name: 'Peak Full Cream Milk (Carton of 48)',
        sku: 'MLK-48T-PK',
        category: 'Dairy & Beverages',
        costPrice: 31000,
        sellingPrice: 36500,
        quantity: 14,
        lowStockThreshold: 6,
        unit: 'Cartons',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_5',
        businessId: 'biz_demo_albarakah',
        name: 'Indomie Instant Noodles Hungryman (Carton)',
        sku: 'NDL-HNG-IND',
        category: 'Food Provisions',
        costPrice: 11500,
        sellingPrice: 13800,
        quantity: 3,
        lowStockThreshold: 12, // LOW STOCK
        unit: 'Cartons',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_6',
        businessId: 'biz_demo_albarakah',
        name: 'Milo Choco Malt Tin (800g x 6)',
        sku: 'MLO-800G-NL',
        category: 'Dairy & Beverages',
        costPrice: 22000,
        sellingPrice: 26000,
        quantity: 18,
        lowStockThreshold: 5,
        unit: 'Cartons',
        updatedAt: new Date().toISOString(),
      },
    ];

    const sampleCustomers: Customer[] = [
      {
        id: 'cust_1',
        businessId: 'biz_demo_albarakah',
        name: 'Hajiya Fatima Bello',
        phone: '+234 803 241 8970',
        email: 'fatima.bello@gmail.com',
        address: 'No 14 Bompai Road',
        state: 'Kano',
        outstandingBalance: 0,
        totalSpent: 485000,
        createdAt: '2026-10-12T10:00:00.000Z',
      },
      {
        id: 'cust_2',
        businessId: 'biz_demo_albarakah',
        name: 'Emeka Okafor Trading Enterprise',
        phone: '+234 802 911 3402',
        email: 'emeka.okafor@okaforbiz.ng',
        address: 'Shop 84, Sabon Gari Market',
        state: 'Kano',
        outstandingBalance: 65000,
        totalSpent: 1240000,
        createdAt: '2026-10-18T11:30:00.000Z',
      },
      {
        id: 'cust_3',
        businessId: 'biz_demo_albarakah',
        name: 'Ibrahim & Sons General Stores',
        phone: '+234 806 772 1098',
        email: 'ibrahim.sons@yahoo.com',
        address: '22 Zoo Road Plaza',
        state: 'Kano',
        outstandingBalance: 0,
        totalSpent: 820000,
        createdAt: '2026-10-24T14:15:00.000Z',
      },
    ];

    const sampleSuppliers: Supplier[] = [
      {
        id: 'supp_1',
        businessId: 'biz_demo_albarakah',
        name: 'Dangote Foods Distribution Hub',
        contactPerson: 'Mr. Babatunde Lawal',
        phone: '+234 802 334 5500',
        email: 'supply@dangotegroup.ng',
        supplyCategory: 'Flour, Sugar, Pasta',
        balance: 145000,
        createdAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'supp_2',
        businessId: 'biz_demo_albarakah',
        name: 'Flour Mills of Nigeria Depot',
        contactPerson: 'Chinedu Eze',
        phone: '+234 803 555 7821',
        email: 'orders@fmnplc.com',
        supplyCategory: 'Vegetable Oil, Grains',
        balance: 0,
        createdAt: '2026-09-15T09:00:00.000Z',
      },
    ];

    const sampleSales: Sale[] = [
      {
        id: 'sale_1',
        businessId: 'biz_demo_albarakah',
        receiptNumber: 'REC-261108-1092',
        customerId: 'cust_1',
        customerName: 'Hajiya Fatima Bello',
        items: [
          { productId: 'prod_1', productName: 'Mama Gold Long Grain Rice (50kg)', quantity: 2, unitPrice: 74000, total: 148000 },
          { productId: 'prod_2', productName: 'Golden Penny Vegetable Oil (25L)', quantity: 1, unitPrice: 48500, total: 48500 },
        ],
        totalAmount: 196500,
        discount: 0,
        paymentMethod: 'transfer',
        paymentStatus: 'paid',
        recordedBy: 'Alhaji Danladi Usman',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'sale_2',
        businessId: 'biz_demo_albarakah',
        receiptNumber: 'REC-261109-8421',
        customerName: 'Walk-in Retail Buyer',
        items: [
          { productId: 'prod_4', productName: 'Peak Full Cream Milk (Carton of 48)', quantity: 1, unitPrice: 36500, total: 36500 },
          { productId: 'prod_5', productName: 'Indomie Instant Noodles Hungryman', quantity: 2, unitPrice: 13800, total: 27600 },
        ],
        totalAmount: 64100,
        discount: 1100,
        paymentMethod: 'pos',
        paymentStatus: 'paid',
        recordedBy: 'Musa Abdullahi',
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
      {
        id: 'sale_3',
        businessId: 'biz_demo_albarakah',
        receiptNumber: 'REC-261109-4410',
        customerId: 'cust_2',
        customerName: 'Emeka Okafor Trading Enterprise',
        items: [
          { productId: 'prod_3', productName: 'Dangote Refined Sugar (50kg)', quantity: 5, unitPrice: 69000, total: 345000 },
        ],
        totalAmount: 345000,
        discount: 5000,
        paymentMethod: 'credit',
        paymentStatus: 'partial',
        recordedBy: 'Alhaji Danladi Usman',
        notes: 'Deposit paid: ₦275,000 via transfer. Balance ₦65,000 due in 7 days.',
        createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
      {
        id: 'sale_4',
        businessId: 'biz_demo_albarakah',
        receiptNumber: 'REC-261107-7719',
        customerId: 'cust_3',
        customerName: 'Ibrahim & Sons General Stores',
        items: [
          { productId: 'prod_1', productName: 'Mama Gold Long Grain Rice (50kg)', quantity: 4, unitPrice: 74000, total: 296000 },
          { productId: 'prod_6', productName: 'Milo Choco Malt Tin (800g x 6)', quantity: 2, unitPrice: 26000, total: 52000 },
        ],
        totalAmount: 348000,
        discount: 3000,
        paymentMethod: 'transfer',
        paymentStatus: 'paid',
        recordedBy: 'Musa Abdullahi',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ];

    const sampleExpenses: Expense[] = [
      {
        id: 'exp_1',
        businessId: 'biz_demo_albarakah',
        title: 'Diesel for 35kVA Lister Generator (200 Litres)',
        category: 'Logistics',
        amount: 240000,
        paymentMethod: 'transfer',
        vendor: 'TotalEnergies Kano Service Station',
        notes: 'Backup power for cold store and warehouse lighting',
        recordedBy: 'Alhaji Danladi Usman',
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'exp_2',
        businessId: 'biz_demo_albarakah',
        title: 'KEDCO Electricity Bill (November Prepayment)',
        category: 'Utilities',
        amount: 85000,
        paymentMethod: 'transfer',
        vendor: 'Kano Electricity Distribution Company',
        recordedBy: 'Musa Abdullahi',
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'exp_3',
        businessId: 'biz_demo_albarakah',
        title: 'Warehouse Security & Sanitation Levies',
        category: 'Maintenance',
        amount: 35000,
        paymentMethod: 'cash',
        vendor: 'Central Market Traders Association',
        recordedBy: 'Alhaji Danladi Usman',
        date: new Date(Date.now() - 72 * 3600 * 1000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
    ];

    const sampleInvoices: Invoice[] = [
      {
        id: 'inv_1',
        businessId: 'biz_demo_albarakah',
        invoiceNumber: 'INV-2026-0038',
        customerName: 'Emeka Okafor Trading Enterprise',
        customerEmail: 'emeka.okafor@okaforbiz.ng',
        customerPhone: '+234 802 911 3402',
        customerAddress: 'Shop 84, Sabon Gari Market, Kano',
        items: [
          { description: 'Dangote Refined Sugar (50kg)', quantity: 10, unitPrice: 69000, total: 690000 },
          { description: 'Mama Gold Long Grain Rice (50kg)', quantity: 5, unitPrice: 74000, total: 370000 },
        ],
        issueDate: '2026-11-05',
        dueDate: '2026-11-19',
        subtotal: 1060000,
        vatRate: 7.5,
        vatAmount: 79500,
        discount: 20000,
        total: 1119500,
        status: 'sent',
        notes: 'Payment via Sterling Bank: 0089201928 - Al-Barakah Smart Solutions. 50% advance received.',
        createdAt: '2026-11-05T09:00:00.000Z',
      },
      {
        id: 'inv_2',
        businessId: 'biz_demo_albarakah',
        invoiceNumber: 'INV-2026-0039',
        customerName: 'Hajiya Fatima Bello',
        customerEmail: 'fatima.bello@gmail.com',
        customerPhone: '+234 803 241 8970',
        customerAddress: 'No 14 Bompai Road, Kano',
        items: [
          { description: 'Golden Penny Vegetable Oil (25L)', quantity: 4, unitPrice: 48500, total: 194000 },
          { description: 'Peak Full Cream Milk (Carton of 48)', quantity: 3, unitPrice: 36500, total: 109500 },
        ],
        issueDate: '2026-11-08',
        dueDate: '2026-11-10',
        subtotal: 303500,
        vatRate: 0,
        vatAmount: 0,
        discount: 0,
        total: 303500,
        status: 'paid',
        notes: 'Paid in full via Bank Transfer. Thank you for your patronage.',
        createdAt: '2026-11-08T14:00:00.000Z',
      },
    ];

    const sampleStaff: StaffMember[] = [
      {
        id: 'staff_1',
        businessId: 'biz_demo_albarakah',
        name: 'Alhaji Danladi Usman',
        email: 'danladi.usman@albarakahmart.ng',
        phone: '+234 803 892 4110',
        role: 'Owner',
        status: 'active',
        createdAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'staff_2',
        businessId: 'biz_demo_albarakah',
        name: 'Musa Abdullahi',
        email: 'musa.abdullahi@albarakahmart.ng',
        phone: '+234 814 550 9931',
        role: 'Cashier',
        status: 'active',
        createdAt: '2026-08-15T09:00:00.000Z',
      },
      {
        id: 'staff_3',
        businessId: 'biz_demo_albarakah',
        name: 'Amina Sani Garba',
        email: 'amina.garba@albarakahmart.ng',
        phone: '+234 809 110 4422',
        role: 'Inventory Clerk',
        status: 'active',
        createdAt: '2026-09-01T08:30:00.000Z',
      },
    ];

    setProducts(sampleProducts);
    setCustomers(sampleCustomers);
    setSuppliers(sampleSuppliers);
    setSales(sampleSales);
    setExpenses(sampleExpenses);
    setInvoices(sampleInvoices);
    setStaff(sampleStaff);
    setIsLoading(false);
  };

  // Seed live initial business data into Firestore when user creates their first business
  const seedInitialBusinessData = async () => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      loadDemoData();
      return;
    }
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const batch = writeBatch(db);
      const bizId = activeBusiness.id;

      // Sample products
      const p1Id = `prod_${Date.now()}_1`;
      const p1: Product = {
        id: p1Id,
        businessId: bizId,
        name: 'Mama Gold Rice (50kg)',
        sku: 'RCE-50KG-MG',
        category: 'Food Provisions',
        costPrice: 65000,
        sellingPrice: 74000,
        quantity: 35,
        lowStockThreshold: 10,
        unit: 'Bags',
        updatedAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/products`, p1Id), { ...p1, timestamp: serverTimestamp() });

      const p2Id = `prod_${Date.now()}_2`;
      const p2: Product = {
        id: p2Id,
        businessId: bizId,
        name: 'Golden Penny Vegetable Oil (25L)',
        sku: 'OIL-25L-GP',
        category: 'Food Provisions',
        costPrice: 42000,
        sellingPrice: 48500,
        quantity: 18,
        lowStockThreshold: 5,
        unit: 'Gallons',
        updatedAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/products`, p2Id), { ...p2, timestamp: serverTimestamp() });

      const p3Id = `prod_${Date.now()}_3`;
      const p3: Product = {
        id: p3Id,
        businessId: bizId,
        name: 'Peak Full Cream Milk (Carton of 48)',
        sku: 'MLK-48T-PK',
        category: 'Dairy & Beverages',
        costPrice: 31000,
        sellingPrice: 36500,
        quantity: 4, // LOW STOCK
        lowStockThreshold: 6,
        unit: 'Cartons',
        updatedAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/products`, p3Id), { ...p3, timestamp: serverTimestamp() });

      // Customer
      const c1Id = `cust_${Date.now()}_1`;
      const c1: Customer = {
        id: c1Id,
        businessId: bizId,
        name: 'Alhaji Bashir & Sons',
        phone: '+234 803 112 4499',
        email: 'bashir.sons@gmail.com',
        address: 'Central Market Line 4',
        state: activeBusiness.state || 'Lagos',
        outstandingBalance: 0,
        totalSpent: 350000,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/customers`, c1Id), { ...c1, timestamp: serverTimestamp() });

      // Supplier
      const s1Id = `supp_${Date.now()}_1`;
      const s1: Supplier = {
        id: s1Id,
        businessId: bizId,
        name: 'Dangote Agro Allied Ltd',
        contactPerson: 'Adamu Garba',
        phone: '+234 802 990 1144',
        email: 'supply@dangoteagro.ng',
        supplyCategory: 'Grains & Commodities',
        balance: 0,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/suppliers`, s1Id), { ...s1, timestamp: serverTimestamp() });

      // Sale
      const saleId = `sale_${Date.now()}_1`;
      const sale: Sale = {
        id: saleId,
        businessId: bizId,
        receiptNumber: generateReceiptNumber(),
        customerId: c1Id,
        customerName: 'Alhaji Bashir & Sons',
        items: [
          { productId: p1Id, productName: p1.name, quantity: 2, unitPrice: p1.sellingPrice, total: p1.sellingPrice * 2 },
          { productId: p2Id, productName: p2.name, quantity: 1, unitPrice: p2.sellingPrice, total: p2.sellingPrice },
        ],
        totalAmount: p1.sellingPrice * 2 + p2.sellingPrice,
        discount: 0,
        paymentMethod: 'transfer',
        paymentStatus: 'paid',
        recordedBy: userProfile?.displayName || 'Business Owner',
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/sales`, saleId), { ...sale, timestamp: serverTimestamp() });

      // Expense
      const expId = `exp_${Date.now()}_1`;
      const expense: Expense = {
        id: expId,
        businessId: bizId,
        title: 'Electricity & Generator Fuel Maintenance',
        category: 'Utilities',
        amount: 65000,
        paymentMethod: 'transfer',
        vendor: 'Local Utility Provider',
        recordedBy: userProfile?.displayName || 'Business Owner',
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, `businesses/${bizId}/expenses`, expId), { ...expense, timestamp: serverTimestamp() });

      await batch.commit();
    } catch (err) {
      console.error('Error seeding data:', err);
      handleFirestoreError(err, OperationType.WRITE, `businesses/${activeBusiness.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // PRODUCT ACTIONS
  const addProduct = async (productData: Omit<Product, 'id' | 'businessId' | 'updatedAt'>): Promise<Product> => {
    if (!activeBusiness) throw new Error('No active business selected');
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      ...productData,
      id,
      businessId: activeBusiness.id,
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setProducts((prev) => [newProduct, ...prev]);
      const demoLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: activeBusiness.id,
        action: 'product_added',
        details: `Added new product "${newProduct.name}" (Initial stock: ${newProduct.quantity} ${newProduct.unit})`,
        performedBy: userProfile?.displayName || 'Business Staff',
        performedById: currentUser?.uid || 'demo-user',
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [demoLog, ...prev]);
      return newProduct;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/products`, id), {
        ...newProduct,
        timestamp: serverTimestamp(),
      });

      // Write audit log for new product
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, `businesses/${activeBusiness.id}/audit_logs`, logId), {
        id: logId,
        businessId: activeBusiness.id,
        action: 'product_added',
        details: `Added product "${newProduct.name}" (SKU: ${newProduct.sku || 'N/A'}, Initial stock: ${newProduct.quantity})`,
        performedBy: userProfile?.displayName || currentUser?.email || 'Authorized Staff',
        performedById: currentUser?.uid || 'system',
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });

      return newProduct;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/products/${id}`);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!activeBusiness) return;
    const updated = { ...updates, updatedAt: new Date().toISOString() };

    if (isDemoMode) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      return;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/products`, id), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/products`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/products/${id}`);
    }
  };

  const adjustStock = async (id: string, newQuantity: number, reason?: string) => {
    if (!activeBusiness) return;
    const safeQty = Math.max(0, newQuantity);

    if (isDemoMode) {
      await updateProduct(id, { quantity: safeQty });
      const demoLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: activeBusiness.id,
        action: 'stock_adjusted',
        details: `Stock for product ${id} adjusted to ${safeQty}. Reason: ${reason || 'Physical inventory count'}`,
        performedBy: userProfile?.displayName || 'Business Staff',
        performedById: currentUser?.uid || 'demo-user',
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [demoLog, ...prev]);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const prodRef = doc(db, `businesses/${activeBusiness.id}/products`, id);
        const pDoc = await transaction.get(prodRef);
        if (!pDoc.exists()) {
          throw new Error('Product not found for stock adjustment');
        }
        const pData = pDoc.data() as Product;
        const oldQty = pData.quantity ?? 0;

        transaction.update(prodRef, {
          quantity: safeQty,
          updatedAt: new Date().toISOString(),
        });

        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const auditLogRef = doc(db, `businesses/${activeBusiness.id}/audit_logs`, logId);
        transaction.set(auditLogRef, {
          id: logId,
          businessId: activeBusiness.id,
          action: 'stock_adjusted',
          details: `Stock for "${pData.name}" adjusted from ${oldQty} to ${safeQty}. Reason: ${reason || 'Physical count / adjustment'}`,
          performedBy: userProfile?.displayName || currentUser?.email || 'Authorized Staff',
          performedById: currentUser?.uid || 'system',
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/products/${id}`);
    }
  };

  // SALES ACTIONS (Atomic Transaction Checkout with Authoritative Pricing & Margin Preservation)
  const addSale = async (
    saleData: Omit<Sale, 'id' | 'businessId' | 'createdAt' | 'receiptNumber'>
  ): Promise<Sale> => {
    if (!activeBusiness) throw new Error('No active business selected');
    const id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receiptNumber = generateReceiptNumber();

    if (isDemoMode) {
      // Validate inventory and calculate verified pricing in demo mode
      const dbProductMap = new Map<string, Product>();
      products.forEach((p) => dbProductMap.set(p.id, p));

      const verifiedCalc = TrustedFinancialEngine.verifyAndCalculateSale(
        saleData.items,
        dbProductMap,
        saleData.discount
      );

      const newSale: Sale = {
        ...saleData,
        id,
        businessId: activeBusiness.id,
        receiptNumber,
        items: verifiedCalc.items,
        subtotal: verifiedCalc.subtotal,
        discount: verifiedCalc.discount,
        totalAmount: verifiedCalc.totalAmount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      setSales((prev) => [newSale, ...prev]);
      // Decrement local inventory stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = verifiedCalc.items.find((i) => i.productId === p.id);
          if (item) {
            return { ...p, quantity: Math.max(0, p.quantity - item.quantity) };
          }
          return p;
        })
      );

      // Record demo audit log
      const demoLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: activeBusiness.id,
        action: 'sale_created',
        details: `Recorded verified sale receipt ${receiptNumber} for ${formatNaira(newSale.totalAmount)} (${verifiedCalc.items.length} items)`,
        performedBy: userProfile?.displayName || 'Business Staff',
        performedById: currentUser?.uid || 'demo-user',
        metadata: {
          saleId: id,
          receiptNumber,
          totalAmount: newSale.totalAmount,
          subtotal: verifiedCalc.subtotal,
          discount: verifiedCalc.discount,
          cogs: verifiedCalc.costOfGoodsSold,
        },
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [demoLog, ...prev]);

      return newSale;
    }

    try {
      // ATOMIC TRANSACTION: Authoritative catalog pricing, real-time stock lock & duplicate prevention
      const finalSaleResult = await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, `businesses/${activeBusiness.id}/sales`, id);

        // 1. Check duplicate sale
        const existingSaleDoc = await transaction.get(saleRef);
        if (existingSaleDoc.exists()) {
          throw new Error('Duplicate transaction detected. Sale already recorded.');
        }

        // 2. Read authoritative product documents from Firestore
        const dbProductMap = new Map<string, Product>();
        for (const item of saleData.items) {
          const productRef = doc(db, `businesses/${activeBusiness.id}/products`, item.productId);
          const pDoc = await transaction.get(productRef);
          if (!pDoc.exists()) {
            throw new Error(`Product "${item.productName || item.productId}" no longer exists in inventory.`);
          }
          dbProductMap.set(item.productId, { id: pDoc.id, ...pDoc.data() } as Product);
        }

        // 3. Recalculate and strictly verify line items, subtotal, discount, and total
        const verifiedCalc = TrustedFinancialEngine.verifyAndCalculateSale(
          saleData.items,
          dbProductMap,
          saleData.discount
        );

        const newSale: Sale = {
          ...saleData,
          id,
          businessId: activeBusiness.id,
          receiptNumber,
          items: verifiedCalc.items,
          subtotal: verifiedCalc.subtotal,
          discount: verifiedCalc.discount,
          totalAmount: verifiedCalc.totalAmount,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };

        // 4. Atomically write Sale document
        transaction.set(saleRef, {
          ...newSale,
          timestamp: serverTimestamp(),
        });

        // 5. Atomically decrement inventory for all items
        for (const vItem of verifiedCalc.items) {
          const currentProd = dbProductMap.get(vItem.productId)!;
          const newQty = currentProd.quantity - vItem.quantity;
          const prodRef = doc(db, `businesses/${activeBusiness.id}/products`, vItem.productId);
          transaction.update(prodRef, {
            quantity: newQty,
            updatedAt: new Date().toISOString(),
          });
        }

        // 6. Atomically append immutable Audit Log with verified actor UID
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const auditLogRef = doc(db, `businesses/${activeBusiness.id}/audit_logs`, logId);
        transaction.set(auditLogRef, {
          id: logId,
          businessId: activeBusiness.id,
          action: 'sale_created',
          details: `Recorded verified sale receipt ${receiptNumber} for ${formatNaira(newSale.totalAmount)} (${verifiedCalc.items.length} items)`,
          performedBy: userProfile?.displayName || currentUser?.email || 'Authorized Staff',
          performedById: currentUser?.uid || 'system',
          metadata: {
            saleId: id,
            receiptNumber,
            totalAmount: newSale.totalAmount,
            subtotal: verifiedCalc.subtotal,
            discount: verifiedCalc.discount,
            costOfGoodsSold: verifiedCalc.costOfGoodsSold,
          },
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        });

        return newSale;
      });

      return finalSaleResult;
    } catch (err) {
      console.error('Checkout transaction error:', err);
      handleFirestoreError(err, OperationType.WRITE, `businesses/${activeBusiness.id}/sales/${id}`);
      throw err;
    }
  };

  // REFUND ACTION (Atomic Stock Restoration & Historical Record Preservation)
  const refundSale = async (id: string, reason: string): Promise<void> => {
    if (!activeBusiness) throw new Error('No active business selected');
    if (!reason || reason.trim().length === 0) {
      throw new Error('A valid refund reason is required');
    }

    if (isDemoMode) {
      const targetSale = sales.find((s) => s.id === id);
      if (!targetSale) throw new Error('Sale not found');
      if (targetSale.status === 'refunded' || targetSale.status === 'void') {
        throw new Error('Transaction is already marked as refunded or void');
      }

      // Restock products in demo state
      setProducts((prev) =>
        prev.map((p) => {
          const item = targetSale.items.find((i) => i.productId === p.id);
          if (item) {
            return { ...p, quantity: p.quantity + item.quantity };
          }
          return p;
        })
      );

      // Mark sale status as refunded
      setSales((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'refunded',
                refundReason: reason.trim(),
                refundedAt: new Date().toISOString(),
                refundedBy: userProfile?.displayName || 'Authorized Manager',
              }
            : s
        )
      );

      const demoLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: activeBusiness.id,
        action: 'sale_refunded',
        details: `Authorized refund for receipt ${targetSale.receiptNumber} (${formatNaira(targetSale.totalAmount)}). Reason: ${reason}`,
        performedBy: userProfile?.displayName || 'Authorized Manager',
        performedById: currentUser?.uid || 'demo-user',
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [demoLog, ...prev]);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, `businesses/${activeBusiness.id}/sales`, id);
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) {
          throw new Error('Sale transaction not found');
        }

        const saleData = saleDoc.data() as Sale;
        if (saleData.status === 'refunded' || saleData.status === 'void') {
          throw new Error('Transaction has already been refunded');
        }

        // Restock inventory for each purchased item
        for (const item of saleData.items) {
          const prodRef = doc(db, `businesses/${activeBusiness.id}/products`, item.productId);
          const pDoc = await transaction.get(prodRef);
          if (pDoc.exists()) {
            const currentStock = pDoc.data()?.quantity ?? 0;
            transaction.update(prodRef, {
              quantity: currentStock + item.quantity,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        // Update sale to refunded (preserves historical transaction record)
        transaction.update(saleRef, {
          status: 'refunded',
          refundReason: reason.trim(),
          refundedAt: new Date().toISOString(),
          refundedBy: userProfile?.displayName || currentUser?.email || 'Authorized Manager',
          updatedAt: new Date().toISOString(),
        });

        // Write immutable audit log
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const auditLogRef = doc(db, `businesses/${activeBusiness.id}/audit_logs`, logId);
        transaction.set(auditLogRef, {
          id: logId,
          businessId: activeBusiness.id,
          action: 'sale_refunded',
          details: `Authorized refund for receipt ${saleData.receiptNumber} (${formatNaira(saleData.totalAmount)}). Restocked ${saleData.items.length} items. Reason: ${reason}`,
          performedBy: userProfile?.displayName || currentUser?.email || 'Authorized Manager',
          performedById: currentUser?.uid || 'system',
          metadata: {
            saleId: id,
            receiptNumber: saleData.receiptNumber,
            refundAmount: saleData.totalAmount,
            reason,
          },
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        });
      });
    } catch (err) {
      console.error('Refund transaction error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/sales/${id}`);
      throw err;
    }
  };

  const deleteSale = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setSales((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/sales`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/sales/${id}`);
    }
  };

  // EXPENSES ACTIONS
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'businessId' | 'createdAt'>): Promise<Expense> => {
    if (!activeBusiness) throw new Error('No active business');
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/expenses`, id), {
        ...newExpense,
        timestamp: serverTimestamp(),
      });
      return newExpense;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/expenses`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/expenses/${id}`);
    }
  };

  // CUSTOMER ACTIONS
  const addCustomer = async (data: Omit<Customer, 'id' | 'businessId' | 'createdAt'>): Promise<Customer> => {
    if (!activeBusiness) throw new Error('No active business');
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCustomer: Customer = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/customers`, id), {
        ...newCustomer,
        timestamp: serverTimestamp(),
      });
      return newCustomer;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/customers/${id}`);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      return;
    }
    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/customers`, id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/customers/${id}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/customers`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/customers/${id}`);
    }
  };

  // SUPPLIER ACTIONS
  const addSupplier = async (data: Omit<Supplier, 'id' | 'businessId' | 'createdAt'>): Promise<Supplier> => {
    if (!activeBusiness) throw new Error('No active business');
    const id = `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSupplier: Supplier = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setSuppliers((prev) => [newSupplier, ...prev]);
      return newSupplier;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/suppliers`, id), {
        ...newSupplier,
        timestamp: serverTimestamp(),
      });
      return newSupplier;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/suppliers/${id}`);
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      return;
    }
    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/suppliers`, id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/suppliers/${id}`);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/suppliers`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/suppliers/${id}`);
    }
  };

  // INVOICE ACTIONS
  const addInvoice = async (
    data: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'invoiceNumber'>
  ): Promise<Invoice> => {
    if (!activeBusiness) throw new Error('No active business');
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = generateInvoiceNumber();

    const newInvoice: Invoice = {
      ...data,
      id,
      businessId: activeBusiness.id,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setInvoices((prev) => [newInvoice, ...prev]);
      return newInvoice;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/invoices`, id), {
        ...newInvoice,
        timestamp: serverTimestamp(),
      });
      return newInvoice;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/invoices/${id}`);
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
      return;
    }
    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/invoices`, id), { status }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/invoices/${id}`);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/invoices`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/invoices/${id}`);
    }
  };

  // STAFF ACTIONS
  const addStaff = async (data: Omit<StaffMember, 'id' | 'businessId' | 'createdAt'>): Promise<StaffMember> => {
    if (!activeBusiness) throw new Error('No active business');
    const id = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStaff: StaffMember = {
      ...data,
      id,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setStaff((prev) => [newStaff, ...prev]);
      return newStaff;
    }

    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/staff`, id), {
        ...newStaff,
        timestamp: serverTimestamp(),
      });
      return newStaff;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${activeBusiness.id}/staff/${id}`);
    }
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      return;
    }
    try {
      await setDoc(doc(db, `businesses/${activeBusiness.id}/staff`, id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}/staff/${id}`);
    }
  };

  const deleteStaff = async (id: string) => {
    if (!activeBusiness) return;
    if (isDemoMode) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, `businesses/${activeBusiness.id}/staff`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${activeBusiness.id}/staff/${id}`);
    }
  };

  return (
    <BusinessDataContext.Provider
      value={{
        products,
        sales,
        expenses,
        customers,
        suppliers,
        invoices,
        staff,
        auditLogs,
        isLoading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addSale,
        refundSale,
        deleteSale,
        addExpense,
        deleteExpense,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addStaff,
        updateStaff,
        deleteStaff,
        seedInitialBusinessData,
      }}
    >
      {children}
    </BusinessDataContext.Provider>
  );
};

export const useBusinessData = () => {
  const context = useContext(BusinessDataContext);
  if (!context) {
    throw new Error('useBusinessData must be used within BusinessDataProvider');
  }
  return context;
};
