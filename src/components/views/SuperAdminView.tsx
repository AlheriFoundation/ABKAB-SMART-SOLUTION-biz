import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Crown,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Business } from '../../types';
import { formatDate, formatNaira } from '../../utils/formatters';

export const SuperAdminView: React.FC = () => {
  const { userBusinesses, isSuperAdmin, currentUser } = useAuth();
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlatformBusinesses();
  }, []);

  const fetchPlatformBusinesses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'businesses'), limit(50));
      const snap = await getDocs(q);
      const list: Business[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Business));
      if (list.length > 0) {
        setAllBusinesses(list);
      } else {
        setAllBusinesses(userBusinesses);
      }
    } catch {
      // Fallback to loaded businesses
      setAllBusinesses(userBusinesses);
    } finally {
      setLoading(false);
    }
  };

  const filtered = allBusinesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.cacNumber && b.cacNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.state && b.state.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-[#10294B] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldAlert size={16} />
          <span>Platform Super Administration Console</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          ABKAB Smart Solution Core Headquarters
        </h1>
        <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl font-light">
          Manage all registered SMBs, oversee active tenant subscriptions, enforce platform security, and audit cross-tenant integrity.
        </p>
      </div>

      {/* Platform Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Businesses</span>
            <Building2 size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{allBusinesses.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Tenant partitions in Firestore</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Active Subscriptions</span>
            <Crown size={16} className="text-[#D8B45A]" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {allBusinesses.filter((b) => b.planStatus === 'active').length}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% active retention</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Monthly Run-Rate</span>
            <Activity size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {formatNaira(
              allBusinesses.reduce((sum, b) => {
                const p = b.plan === 'pro' ? 35000 : b.plan === 'growth' ? 15000 : 0;
                return sum + p;
              }, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">SaaS recurring pipeline</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Super Admin Access</span>
            <Shield size={16} className="text-blue-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.email || 'System'}</p>
          <p className="text-[11px] text-purple-700 font-semibold mt-1">Full Root Privileges</p>
        </div>
      </div>

      {/* Registered Businesses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">All Registered Business Tenants</h2>
            <p className="text-xs text-slate-500">Cross-tenant overview isolated via Firestore security rules</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search business, CAC, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">CAC Number</th>
                <th className="p-3.5">State & City</th>
                <th className="p-3.5">Owner UID</th>
                <th className="p-3.5">Subscription Tier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((biz) => (
                <tr key={biz.id} className="hover:bg-slate-50">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{biz.name}</p>
                    {biz.phone && <p className="text-[10px] text-slate-400">{biz.phone}</p>}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">{biz.cacNumber || 'Pending'}</td>
                  <td className="p-3.5 text-slate-600">{biz.city ? `${biz.city}, ` : ''}{biz.state || 'Nigeria'}</td>
                  <td className="p-3.5 font-mono text-slate-400 text-[10px] truncate max-w-[120px]">
                    {biz.ownerId}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#faf4e6] text-[#10294B] border border-[#f0dca5]">
                      {biz.plan}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {biz.planStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{formatDate(biz.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
