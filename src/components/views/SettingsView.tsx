import React, { useState, useEffect } from 'react';
import { Settings, Building2, User, Check, AlertCircle, Plus, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { NIGERIAN_STATES } from '../../utils/formatters';

interface SettingsViewProps {
  openNewBusinessModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ openNewBusinessModal }) => {
  const { activeBusiness, updateActiveBusiness, userProfile, currentUser, userBusinesses, setActiveBusinessId } = useAuth();
  const { auditLogs } = useBusinessData();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [tin, setTin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setTagline(activeBusiness.tagline || '');
      setCacNumber(activeBusiness.cacNumber || '');
      setTin(activeBusiness.tin || '');
      setPhone(activeBusiness.phone || '');
      setEmail(activeBusiness.email || '');
      setAddress(activeBusiness.address || '');
      setCity(activeBusiness.city || '');
      setState(activeBusiness.state || 'Lagos');
      setReceiptFooter(activeBusiness.receiptFooter || '');
    }
  }, [activeBusiness]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateActiveBusiness({
        name,
        tagline,
        cacNumber,
        tin,
        phone,
        email,
        address,
        city,
        state,
        receiptFooter,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings size={24} className="text-[#10294B]" />
          <span>Business & Profile Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure official CAC registration numbers, receipt header and footer details, and address
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2">
          <Check size={18} className="text-emerald-600" />
          <span>Business profile and receipt settings updated successfully!</span>
        </div>
      )}

      {/* Multi-business Switcher Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <Building2 size={15} className="text-[#D8B45A]" />
            <span>Your Registered Businesses ({userBusinesses.length})</span>
          </h2>
          <button
            onClick={openNewBusinessModal}
            className="px-3 py-1.5 rounded-lg bg-[#faf4e6] hover:bg-[#f3e6c2] text-[#10294B] text-xs font-bold flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>Register Another Business</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {userBusinesses.map((b) => (
            <div
              key={b.id}
              onClick={() => setActiveBusinessId(b.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                b.id === activeBusiness?.id
                  ? 'bg-[#10294B] text-white border-[#10294B] shadow-md'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm truncate">{b.name}</span>
                {b.id === activeBusiness?.id && (
                  <span className="text-[10px] bg-[#D8B45A] text-[#10294B] px-1.5 py-0.5 rounded font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 truncate ${b.id === activeBusiness?.id ? 'text-slate-300' : 'text-slate-500'}`}>
                {b.cacNumber ? `CAC: ${b.cacNumber}` : b.state || 'Nigeria'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Active Business Profile Details</h2>
          <p className="text-xs text-slate-500">Information printed on customer receipts and commercial invoices</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Business Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Motto
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CAC Registration Number (RC/BN)
              </label>
              <input
                type="text"
                value={cacNumber}
                onChange={(e) => setCacNumber(e.target.value)}
                placeholder="e.g. RC-1849204"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="e.g. 24910482-0001"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (+234)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State (Nigeria)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-900"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / LGA
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Office or Store Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt / Invoice Footer Message
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for your patronage! Excellence in Every Service."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#10294B] hover:bg-[#15345d] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* User Account Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <User size={15} className="text-slate-400" />
          <span>User Account Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block">Logged In As</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{userProfile?.displayName || 'User'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block">Email Address</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{currentUser?.email || 'Guest / Demo'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block">Platform Role</span>
            <span className="font-bold text-[#10294B] mt-0.5 block uppercase">
              {userProfile?.role || 'Business Owner'}
            </span>
          </div>
        </div>
      </div>

      {/* Immutable Security Audit Trail Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield size={16} className="text-[#10294B]" />
              <span>Immutable Security & Financial Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically backed, append-only logs for transaction events, stock movements, and privilege enforcement.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check size={11} className="mr-1" />
              Write-Only / Tamper-Proof
            </span>
          </div>
        </div>

        {auditLogs && auditLogs.length > 0 ? (
          <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Event Details</th>
                  <th className="py-2.5 px-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-NG', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          log.action === 'sale_created'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action === 'stock_adjusted'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : log.action === 'product_added'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {log.details}
                    </td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {log.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No audit records yet. All sales checkouts, stock adjustments, and product additions will be logged immutably here.
          </div>
        )}
      </div>
    </div>
  );
};
