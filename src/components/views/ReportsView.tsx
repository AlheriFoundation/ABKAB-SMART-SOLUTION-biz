import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatDate } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products } = useBusinessData();
  const { activeBusiness } = useAuth();

  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month'>('all');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter sales by date range
  const filteredSales = sales.filter((s) => {
    if (dateRange === 'all') return true;
    const saleDate = new Date(s.createdAt);
    if (isNaN(saleDate.getTime())) return true;

    if (dateRange === 'this_month') {
      return saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth;
    }
    if (dateRange === 'last_month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return saleDate.getFullYear() === prevYear && saleDate.getMonth() === prevMonth;
    }
    return true;
  });

  // Filter expenses by date range
  const filteredExpenses = expenses.filter((e) => {
    if (dateRange === 'all') return true;
    const expDate = new Date(e.date || e.createdAt);
    if (isNaN(expDate.getTime())) return true;

    if (dateRange === 'this_month') {
      return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
    }
    if (dateRange === 'last_month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return expDate.getFullYear() === prevYear && expDate.getMonth() === prevMonth;
    }
    return true;
  });

  // Active sales exclude refunded or voided transactions
  const activeSales = filteredSales.filter((s) => s.status !== 'refunded' && s.status !== 'void');
  const refundedSales = filteredSales.filter((s) => s.status === 'refunded' || s.status === 'void');
  const totalRefundedAmount = refundedSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Total Sales Revenue (Net of refunds)
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Cost of Goods Sold (COGS) strictly calculated using historical unitCostPrice preserved at time of sale
  let totalCOGS = 0;
  activeSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = typeof item.unitCostPrice === 'number'
        ? item.unitCostPrice
        : prod && prod.costPrice > 0
        ? prod.costPrice
        : item.unitPrice * 0.7;
      totalCOGS += cost * item.quantity;
    });
  });

  // Gross Profit = Revenue - COGS
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Operating Expenses strictly overhead (Rent, Utilities, Salaries, Logistics, Supplies, etc.)
  // Expenses are grouped and summed once only to prevent double counting
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Operating Profit = Gross Profit - Operating Expenses
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Group Expenses by category
  const expenseByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  // Top Products by sales count and revenue within the active filter
  const productStats: Record<string, { name: string; qty: number; revenue: number }> = {};
  activeSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productStats[item.productName]) {
        productStats[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productStats[item.productName].qty += item.quantity;
      productStats[item.productName].revenue += item.total;
    });
  });
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const getPeriodLabel = () => {
    if (dateRange === 'this_month') {
      return `Current Month (${new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(now)})`;
    }
    if (dateRange === 'last_month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `Previous Month (${new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(prevDate)})`;
    }
    return 'All Time / Year-to-Date';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 size={24} className="text-[#10294B]" />
            <span>Financial Reports & Profit/Loss</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified income statement, gross margins, and expenditure analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Date range toggle buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs font-medium">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateRange === 'all'
                  ? 'bg-[#10294B] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('this_month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateRange === 'this_month'
                  ? 'bg-[#10294B] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('last_month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateRange === 'last_month'
                  ? 'bg-[#10294B] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#10294B] hover:bg-[#15345d] text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print Summary</span>
          </button>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 bg-[#10294B] text-white flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold">Income Statement (Profit & Loss)</h2>
            <p className="text-xs text-[#D8B45A]">
              {activeBusiness?.name || 'ABKAB Smart Business'} • Reporting Period: {getPeriodLabel()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-300">Net Operating Profit</p>
            <p className={`text-xl font-black ${netProfit >= 0 ? 'text-[#D8B45A]' : 'text-rose-400'}`}>
              {formatNaira(netProfit)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Revenue & COGS */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Trading Account</span>
              <span className="font-normal text-slate-400 text-[11px]">{filteredSales.length} sales evaluated</span>
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Gross Sales Revenue</span>
                <span className="font-bold text-slate-900">{formatNaira(totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span>-{formatNaira(totalCOGS)}</span>
              </div>
              <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-xl font-bold text-slate-900">
                <span>Gross Profit (Margin: {grossMargin}%)</span>
                <span className="text-emerald-700">{formatNaira(grossProfit)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Operating Expenses */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Operating Expenses (Overhead)</span>
              <span className="font-normal text-slate-400 text-[11px]">{filteredExpenses.length} expense vouchers</span>
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {Object.keys(expenseByCategory).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No operating expenses in this period.</p>
              ) : (
                Object.entries(expenseByCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                    <span>{cat}</span>
                    <span>{formatNaira(amt)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between py-2 bg-rose-50 px-3 rounded-xl font-bold text-rose-900">
                <span>Total Operating Expenses</span>
                <span>-{formatNaira(totalOperatingExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Net Profit Final */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#10294B] text-white flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-[#D8B45A] uppercase tracking-wide">
                Net Profit / (Loss)
              </p>
              <p className="text-xs text-slate-300">Net margin after cost of sales and all overhead expenditures</p>
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                {formatNaira(netProfit)}
              </p>
              <p className="text-xs text-emerald-400 font-semibold">Net Margin: {netMargin}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Products Table for selected period */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Top Performing Products</h2>
            <p className="text-xs text-slate-500">Highest grossing items in catalog ({getPeriodLabel()})</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{topProducts.length} items ranked</span>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No sales recorded in the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5 text-center">Units Sold</th>
                  <th className="p-3.5 text-right">Revenue Generated (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-800">{p.name}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">{p.qty}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">{formatNaira(p.revenue)}</td>
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
