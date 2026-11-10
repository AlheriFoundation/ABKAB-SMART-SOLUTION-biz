import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Plus,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Shield,
  HelpCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { AppModule } from '../../types';

interface NavbarProps {
  currentModule: AppModule;
  setCurrentModule: (mod: AppModule) => void;
  openNewBusinessModal: () => void;
  openQuickSaleModal: () => void;
  openQuickExpenseModal: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setCurrentModule,
  openNewBusinessModal,
  openQuickSaleModal,
  openQuickExpenseModal,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const {
    currentUser,
    userProfile,
    activeBusiness,
    userBusinesses,
    setActiveBusinessId,
    logout,
    isSuperAdmin,
    isDemoMode,
  } = useAuth();

  const { seedInitialBusinessData, products } = useBusinessData();
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedInitialBusinessData();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#10294B] text-white border-b border-[#1b3e70] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Mobile menu & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-[#1b3e70] focus:outline-none"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div
              className="flex items-center space-x-2.5 cursor-pointer"
              onClick={() => setCurrentModule('dashboard')}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D8B45A] to-[#b38e35] flex items-center justify-center shadow-md">
                <span className="font-bold text-[#10294B] text-lg tracking-wider">A</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">ABKAB</span>
                  <span className="text-[#D8B45A] font-medium text-xs tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#1b3e70]">
                    BizManager
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-normal tracking-wide">
                  ABKAB Smart Solution • Excellence in Every Service
                </p>
              </div>
            </div>
          </div>

          {/* Center: Business Switcher */}
          <div className="relative">
            {activeBusiness ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setBizDropdownOpen(!bizDropdownOpen);
                    setUserDropdownOpen(false);
                    setQuickMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#15345d] hover:bg-[#1b3e70] border border-[#22487e] transition text-left text-xs sm:text-sm"
                >
                  <Building2 size={16} className="text-[#D8B45A] shrink-0" />
                  <div className="truncate max-w-[130px] sm:max-w-[200px]">
                    <span className="font-semibold text-white block truncate">{activeBusiness.name}</span>
                    <span className="text-[10px] text-slate-300 block truncate">
                      {activeBusiness.cacNumber ? `CAC: ${activeBusiness.cacNumber}` : activeBusiness.state || 'Nigeria'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </button>

                {bizDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Switch Business Account
                      </p>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      {userBusinesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setActiveBusinessId(b.id);
                            setBizDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50 transition ${
                            b.id === activeBusiness.id ? 'bg-[#faf4e6] font-semibold text-[#10294B]' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-medium">{b.name}</p>
                            <p className="text-[11px] text-slate-400">{b.city ? `${b.city}, ${b.state}` : 'Nigeria'}</p>
                          </div>
                          {b.id === activeBusiness.id && (
                            <span className="text-[10px] bg-[#D8B45A] text-[#10294B] px-1.5 py-0.5 rounded font-bold uppercase">
                              Active
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setBizDropdownOpen(false);
                          openNewBusinessModal();
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-[#10294B] bg-slate-100 hover:bg-[#faf4e6] hover:text-[#b38e35] rounded-lg transition"
                      >
                        <Plus size={14} />
                        <span>Register New Business</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openNewBusinessModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#D8B45A] text-[#10294B] font-semibold text-xs hover:bg-[#c49f45] transition shadow"
              >
                <Plus size={14} />
                <span>Register Business</span>
              </button>
            )}
          </div>

          {/* Right section: Quick actions, Live status, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick entry menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setQuickMenuOpen(!quickMenuOpen);
                  setBizDropdownOpen(false);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#D8B45A] hover:bg-[#c49f45] text-[#10294B] font-semibold text-xs transition shadow-sm"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Record</span>
                <ChevronDown size={12} />
              </button>

              {quickMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <button
                    onClick={() => {
                      setQuickMenuOpen(false);
                      openQuickSaleModal();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-medium">New Sale / POS</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickMenuOpen(false);
                      openQuickExpenseModal();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="font-medium">Record Expense</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickMenuOpen(false);
                      setCurrentModule('invoices');
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-medium">Create Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickMenuOpen(false);
                      setCurrentModule('inventory');
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-medium">Add Product</span>
                  </button>
                </div>
              )}
            </div>

            {/* If products count is 0, show friendly "Load Sample Data" shortcut */}
            {products.length === 0 && (
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#15345d] hover:bg-[#1b3e70] border border-[#265392] text-[#D8B45A] text-xs font-medium transition"
                title="Populate realistic Nigerian business sample data"
              >
                <Sparkles size={13} className={isSeeding ? 'animate-spin' : ''} />
                <span>{isSeeding ? 'Populating...' : 'Seed Sample Data'}</span>
              </button>
            )}

            {/* Cloud Firestore Live Indicator */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0d223f] border border-[#1b3e70] text-[11px] text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span>{isDemoMode ? 'Demo Sandbox' : 'Cloud Firestore'}</span>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setBizDropdownOpen(false);
                  setQuickMenuOpen(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-[#1b3e70] transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D8B45A] to-[#f0d48b] text-[#10294B] font-bold flex items-center justify-center text-xs shadow-inner">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-white leading-tight">
                    {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {isSuperAdmin ? 'Super Admin' : userProfile?.role || 'Business Owner'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {userProfile?.displayName || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email || 'Logged in user'}
                    </p>
                    {isSuperAdmin && (
                      <span className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                        <Shield size={10} />
                        <span>Platform Super Admin</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setCurrentModule('settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <UserIcon size={14} />
                    <span>Business & User Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setCurrentModule('subscription');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Sparkles size={14} className="text-[#D8B45A]" />
                    <span>Subscription Plan</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentModule('superadmin');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center space-x-2 font-medium"
                    >
                      <Shield size={14} />
                      <span>Platform Super Admin</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
