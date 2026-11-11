import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatDateTime, formatDate } from '../../utils/formatters';
import { Sale } from '../../types';

interface SalesViewProps {
  openQuickSaleModal: () => void;
  onViewReceipt: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ openQuickSaleModal, onViewReceipt }) => {
  const { sales, deleteSale, refundSale } = useBusinessData();
  const { userProfile, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const isManagerOrOwner = isSuperAdmin || userProfile?.role === 'owner' || userProfile?.role === 'admin';

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = filterMethod === 'all' || s.paymentMethod === filterMethod;
    const matchesStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalFilteredAmount = filteredSales
    .filter((s) => s.status !== 'refunded')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const handleConfirmRefund = async () => {
    if (!saleToRefund) return;
    if (!refundReason.trim()) {
      setRefundError('Please provide a specific reason for this refund / void.');
      return;
    }

    setRefunding(true);
    setRefundError(null);
    try {
      await refundSale(saleToRefund.id, refundReason.trim());
      setSaleToRefund(null);
      setRefundReason('');
    } catch (err: any) {
      setRefundError(err?.message || 'Failed to process refund.');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp size={24} className="text-[#10294B]" />
            <span>Sales & Point of Sale (POS)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer sales, issue receipts, and manage payment methods
          </p>
        </div>

        <button
          onClick={openQuickSaleModal}
          className="px-4 py-2.5 bg-[#10294B] hover:bg-[#15345d] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Filtered Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatNaira(totalFilteredAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredSales.length} of {sales.length} transactions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Bank Transfers (NIP)</p>
          <p className="text-xl font-bold text-[#10294B] mt-1">
            {formatNaira(
              sales.filter((s) => s.paymentMethod === 'transfer' && s.status !== 'refunded').reduce((sum, s) => sum + s.totalAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Instant account deposits</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Cash Inflow</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatNaira(
              sales.filter((s) => s.paymentMethod === 'cash' && s.status !== 'refunded').reduce((sum, s) => sum + s.totalAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical store cash drawer</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">POS & Split Payments</p>
          <p className="text-xl font-bold text-purple-900 mt-1">
            {formatNaira(
              sales.filter((s) => (s.paymentMethod === 'pos' || s.paymentMethod === 'split') && s.status !== 'refunded').reduce((sum, s) => sum + s.totalAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Card swipes & split bills</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, customer, product, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-700 flex-1 md:flex-initial"
          >
            <option value="all">All Payment Methods</option>
            <option value="transfer">Bank Transfer (NIP)</option>
            <option value="cash">Cash</option>
            <option value="pos">POS Terminal</option>
            <option value="split">Split / Mixed</option>
            <option value="credit">Credit Ledger</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-700 flex-1 md:flex-initial"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-600">No sales match your current search/filter.</p>
            <button
              onClick={openQuickSaleModal}
              className="mt-3 px-4 py-2 bg-[#10294B] text-white text-xs font-semibold rounded-xl"
            >
              Record New Sale
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Purchased Items</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5 text-right">Total (₦)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-semibold text-[#10294B]">
                      {sale.receiptNumber}
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {sale.customerName}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                            sale.paymentMethod === 'transfer'
                              ? 'bg-blue-100 text-blue-800'
                              : sale.paymentMethod === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentMethod === 'pos'
                              ? 'bg-purple-100 text-purple-800'
                              : sale.paymentMethod === 'split'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {sale.paymentMethod === 'transfer'
                            ? 'Transfer'
                            : sale.paymentMethod === 'pos'
                            ? 'POS'
                            : sale.paymentMethod === 'split'
                            ? 'Split'
                            : sale.paymentMethod}
                        </span>
                        {sale.paymentReference && (
                          <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px]" title={sale.paymentReference}>
                            {sale.paymentReference}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                        {sale.status === 'refunded' && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-600 text-white shadow-xs">
                            REFUNDED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      <span className={sale.status === 'refunded' ? 'line-through text-slate-400' : ''}>
                        {formatNaira(sale.totalAmount)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#10294B] hover:bg-slate-100 transition"
                          title="View Receipt"
                        >
                          <Eye size={15} />
                        </button>
                        {isManagerOrOwner && sale.status !== 'refunded' && (
                          <button
                            onClick={() => {
                              setSaleToRefund(sale);
                              setRefundReason('');
                              setRefundError(null);
                            }}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition"
                            title="Process Refund & Restock"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorized Refund Modal */}
      {saleToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#10294B] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert size={18} className="text-[#D8B45A]" />
                <h3 className="text-sm font-bold">Authorize Refund & Restock</h3>
              </div>
              <button onClick={() => setSaleToRefund(null)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold">Transaction: {saleToRefund.receiptNumber}</p>
                <p className="mt-1">
                  Total Amount: <span className="font-bold">{formatNaira(saleToRefund.totalAmount)}</span>
                </p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Authorizing this refund will mark the transaction as REFUNDED, preserve the audit history, and automatically return all items to inventory.
                </p>
              </div>

              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center space-x-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{refundError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Refund / Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer returned damaged goods, cashier entry error..."
                  rows={3}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSaleToRefund(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  disabled={refunding}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {refunding ? 'Processing...' : 'Authorize Refund & Restock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
