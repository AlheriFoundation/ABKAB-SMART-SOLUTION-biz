import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Package,
  Users,
  Truck,
  FileText,
  BarChart3,
  UserCheck,
  Settings,
  Crown,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AppModule } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentModule: AppModule;
  setCurrentModule: (mod: AppModule) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  setCurrentModule,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { isSuperAdmin, activeBusiness } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales Management', icon: TrendingUp },
    { id: 'expenses', label: 'Expense Management', icon: Receipt },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'staff', label: 'Staff & Roles', icon: UserCheck },
    { id: 'settings', label: 'Business Settings', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: Crown, badge: 'Pro' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#10294B] text-slate-200 border-r border-[#1b3e70] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-auto`}
      >
        {/* Sidebar Brand Mini Header (Mobile only) */}
        <div className="p-4 lg:hidden flex items-center justify-between border-b border-[#1b3e70]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#D8B45A] flex items-center justify-center font-bold text-[#10294B]">
              A
            </div>
            <div>
              <p className="font-bold text-white text-sm">ABKAB BizManager</p>
              <p className="text-[10px] text-[#D8B45A]">ABKAB Smart Solution</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentModule(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#D8B45A] text-[#10294B] font-semibold shadow-md shadow-amber-950/20'
                    : 'text-slate-300 hover:bg-[#15345d] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#10294B]' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1b3e70] text-[#D8B45A] font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Super Admin Section (Shown if user is super admin or in demo mode) */}
          <div className="pt-4 mt-4 border-t border-[#1b3e70]">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <ShieldAlert size={11} className="text-purple-400" />
              <span>Administration</span>
            </div>

            <button
              onClick={() => {
                setCurrentModule('superadmin');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                currentModule === 'superadmin'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-purple-300 hover:bg-[#1b3e70] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldAlert size={18} className="text-purple-400" />
                <span>Platform Super Admin</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                HQ
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Active Plan & Motto */}
        <div className="p-3 bg-[#0d223f] border-t border-[#1b3e70]">
          <div className="bg-[#10294B] border border-[#1e447b] p-2.5 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Current Plan
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D8B45A] text-[#10294B]">
                {activeBusiness?.plan.toUpperCase() || 'GROWTH'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">
              {activeBusiness?.name || 'ABKAB Smart Solution'}
            </p>
            <div className="flex items-center space-x-1 mt-1 text-[10px] text-[#D8B45A]">
              <Sparkles size={11} />
              <span>Manage Your Business. Control Your Growth.</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-normal">
            ABKAB Smart Solution &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
};
