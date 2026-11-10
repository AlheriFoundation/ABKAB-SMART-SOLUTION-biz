import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  PieChart,
  Tag,
  CreditCard,
  Building,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatNaira, formatDate } from '../../utils/formatters';
import { Expense } from '../../types';

interface ExpensesViewProps {
  openQuickExpenseModal: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ openQuickExpenseModal }) => {
  const { expenses, deleteExpense } = useBusinessData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const allTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete expense record "${title}"?`)) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Receipt size={24} className="text-rose-600" />
            <span>Expense Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor operational overhead, logistics, utilities, and vendor payouts
          </p>
        </div>

        <button
          onClick={openQuickExpenseModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Category breakdown strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <PieChart size={14} className="text-slate-400" />
            <span>Expense Breakdown by Category</span>
          </h2>
          <span className="text-xs font-bold text-slate-900">Total: {formatNaira(allTotal)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const pct = allTotal > 0 ? ((amt / allTotal) * 100).toFixed(0) : '0';
            return (
              <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500 font-medium truncate">{cat}</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{formatNaira(amt)}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense, vendor, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities (NEPA/Generator)</option>
            <option value="Salaries">Salaries & Wages</option>
            <option value="Logistics">Logistics & Fuel</option>
            <option value="Supplies">Store Supplies</option>
            <option value="Marketing">Marketing & Ads</option>
            <option value="Taxes">Taxes & Levies</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-600">No expenses recorded yet.</p>
            <button
              onClick={openQuickExpenseModal}
              className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl"
            >
              Record First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Expense Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Vendor / Payee</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Recorded By</th>
                  <th className="p-3.5 text-right">Amount (₦)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{expense.title}</p>
                      {expense.notes && (
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{expense.notes}</p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {expense.vendor || '-'}
                    </td>
                    <td className="p-3.5 uppercase text-[10px] text-slate-500">
                      {expense.paymentMethod}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {formatDate(expense.date || expense.createdAt)}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {expense.recordedBy}
                    </td>
                    <td className="p-3.5 text-right font-bold text-rose-600">
                      {formatNaira(expense.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(expense.id, expense.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
