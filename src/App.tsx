/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessDataProvider, useBusinessData } from './context/BusinessDataContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { BusinessRegistrationModal } from './components/auth/BusinessRegistrationModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { NewSaleModal } from './components/modals/NewSaleModal';
import { NewExpenseModal } from './components/modals/NewExpenseModal';

import { DashboardView } from './components/views/DashboardView';
import { SalesView } from './components/views/SalesView';
import { ExpensesView } from './components/views/ExpensesView';
import { InventoryView } from './components/views/InventoryView';
import { CustomersView } from './components/views/CustomersView';
import { SuppliersView } from './components/views/SuppliersView';
import { InvoicesView } from './components/views/InvoicesView';
import { ReportsView } from './components/views/ReportsView';
import { StaffView } from './components/views/StaffView';
import { SettingsView } from './components/views/SettingsView';
import { SubscriptionView } from './components/views/SubscriptionView';
import { SuperAdminView } from './components/views/SuperAdminView';

import { AppModule, Sale } from './types';

const AppContent: React.FC = () => {
  const { currentUser, isDemoMode, activeBusiness, isLoading } = useAuth();
  const { sales } = useBusinessData();

  const [currentModule, setCurrentModule] = useState<AppModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [isNewBusinessModalOpen, setIsNewBusinessModalOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D8B45A] to-[#b38e35] flex items-center justify-center shadow-xl animate-pulse mb-4">
          <span className="font-extrabold text-[#10294B] text-2xl">A</span>
        </div>
        <h2 className="text-base font-bold text-[#10294B]">ABKAB BizManager</h2>
        <p className="text-xs text-[#D8B45A] font-semibold uppercase tracking-wider mt-0.5">
          Excellence in Every Service
        </p>
        <p className="text-xs text-slate-400 mt-2">Connecting to Cloud Firestore...</p>
      </div>
    );
  }

  // If user is not authenticated and not in demo mode: Show AuthModal
  if (!currentUser && !isDemoMode) {
    return <AuthModal />;
  }

  // If user is authenticated but has no business registered: Mandatory Business Registration
  if (!activeBusiness && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <BusinessRegistrationModal
          isOpen={true}
          onClose={() => {}}
          isMandatory={true}
        />
      </div>
    );
  }

  const handleSaleCreated = (saleId: string) => {
    // Find the newly created sale and show its receipt
    const found = sales.find((s) => s.id === saleId);
    if (found) {
      setSelectedReceiptSale(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1E293B] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        openNewBusinessModal={() => setIsNewBusinessModalOpen(true)}
        openQuickSaleModal={() => setIsQuickSaleOpen(true)}
        openQuickExpenseModal={() => setIsQuickExpenseOpen(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentModule={currentModule}
          setCurrentModule={setCurrentModule}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-4">
          {activeBusiness?.planStatus === 'expired' && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-rose-800 text-xs shadow-xs gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  <strong>Subscription Expired:</strong> Your account is restricted from creating new transactions. Please renew your plan to restore full operations.
                </span>
              </div>
              <button
                onClick={() => setCurrentModule('subscription')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shrink-0"
              >
                Renew Subscription
              </button>
            </div>
          )}

          {currentModule === 'dashboard' && (
            <DashboardView
              setCurrentModule={setCurrentModule}
              openQuickSaleModal={() => setIsQuickSaleOpen(true)}
              openQuickExpenseModal={() => setIsQuickExpenseOpen(true)}
              onViewReceipt={(sale) => setSelectedReceiptSale(sale)}
            />
          )}

          {currentModule === 'sales' && (
            <SalesView
              openQuickSaleModal={() => setIsQuickSaleOpen(true)}
              onViewReceipt={(sale) => setSelectedReceiptSale(sale)}
            />
          )}

          {currentModule === 'expenses' && (
            <ExpensesView
              openQuickExpenseModal={() => setIsQuickExpenseOpen(true)}
            />
          )}

          {currentModule === 'inventory' && <InventoryView />}

          {currentModule === 'customers' && <CustomersView />}

          {currentModule === 'suppliers' && <SuppliersView />}

          {currentModule === 'invoices' && <InvoicesView />}

          {currentModule === 'reports' && <ReportsView />}

          {currentModule === 'staff' && <StaffView />}

          {currentModule === 'settings' && (
            <SettingsView
              openNewBusinessModal={() => setIsNewBusinessModalOpen(true)}
            />
          )}

          {currentModule === 'subscription' && <SubscriptionView />}

          {currentModule === 'superadmin' && <SuperAdminView />}
        </main>
      </div>

      {/* Global Modals */}
      <BusinessRegistrationModal
        isOpen={isNewBusinessModalOpen}
        onClose={() => setIsNewBusinessModalOpen(false)}
      />

      <NewSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSaleCreated={handleSaleCreated}
      />

      <NewExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
      />

      <ReceiptModal
        sale={selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BusinessDataProvider>
        <AppContent />
      </BusinessDataProvider>
    </AuthProvider>
  );
}
