import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatShortNaira, formatDate, formatDateTime } from '../../utils/formatters';
import { AppModule, Sale } from '../../types';

interface DashboardViewProps {
  setCurrentModule: (mod: AppModule) => void;
  openQuickSaleModal: () => void;
  openQuickExpenseModal: () => void;
  onViewReceipt: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentModule,
  openQuickSaleModal,
  openQuickExpenseModal,
  onViewReceipt,
}) => {
  const { products, sales, expenses, customers, seedInitialBusinessData } = useBusinessData();
  const { activeBusiness } = useAuth();

  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | 'monthly'>('7d');
  const [seeding, setSeeding] = useState(false);

  // Financial calculations
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? ((estimatedProfit / totalSales) * 100).toFixed(1) : '0.0';

  const lowStockProducts = products.filter((p) => p.quantity <= (p.lowStockThreshold || 5));
  const recentSales = sales.slice(0, 5);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialBusinessData();
    } finally {
      setSeeding(false);
    }
  };

  // Mock bar chart generator based on real sales
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartBars = days.map((day, idx) => {
    // Distribute actual sales or fallback realistic distribution
    const daySales = totalSales > 0 ? (totalSales * (0.08 + (idx * 0.035))) : 0;
    const maxSale = totalSales > 0 ? totalSales * 0.35 : 100000;
    const heightPercent = totalSales > 0 ? Math.min(100, Math.max(15, (daySales / maxSale) * 100)) : 10;
    return {
      day,
      amount: daySales,
      heightPercent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#10294B] to-[#183c6c] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[#D8B45A]/10 -skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D8B45A] text-[#10294B]">
                Business Overview
              </span>
              <span className="text-xs text-slate-300">
                {formatDate(new Date())}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              {activeBusiness?.name || 'Welcome to ABKAB BizManager'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light">
              Manage Your Business. Control Your Growth. Here is your current financial standing and inventory performance.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openQuickSaleModal}
              className="px-4 py-2.5 rounded-xl bg-[#D8B45A] hover:bg-[#c49f45] text-[#10294B] text-xs sm:text-sm font-bold shadow-md transition flex items-center space-x-1.5"
            >
              <Plus size={16} />
              <span>Record Sale</span>
            </button>
            <button
              onClick={openQuickExpenseModal}
              className="px-3.5 py-2.5 rounded-xl bg-[#1b3e70] hover:bg-[#234e8c] text-white text-xs sm:text-sm font-semibold border border-[#2b589a] transition flex items-center space-x-1.5"
            >
              <Receipt size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Low Stock Alert: {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's' : ''} need restocking!
              </p>
              <p className="text-xs text-amber-700">
                {lowStockProducts.map((p) => `${p.name} (${p.quantity} left)`).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? '...' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentModule('inventory')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* KPI Stat Cards (6 Key Business Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {formatNaira(totalSales)}
            </p>
            <div className="flex items-center space-x-1 mt-1 text-[11px] text-emerald-600 font-medium">
              <ArrowUpRight size={13} />
              <span>{sales.length} transactions</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt size={15} />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {formatNaira(totalExpenses)}
            </p>
            <div className="flex items-center space-x-1 mt-1 text-[11px] text-rose-600 font-medium">
              <ArrowDownRight size={13} />
              <span>{expenses.length} recorded</span>
            </div>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Estimated Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#faf4e6] text-[#b38e35] flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div>
            <p className={`text-base sm:text-lg font-bold truncate ${estimatedProfit >= 0 ? 'text-[#10294B]' : 'text-rose-600'}`}>
              {formatNaira(estimatedProfit)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Margin: <span className="text-emerald-700 font-semibold">{profitMargin}%</span>
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition" onClick={() => setCurrentModule('inventory')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Products</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={15} />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              {products.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Catalog items</p>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition" onClick={() => setCurrentModule('inventory')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Low Stock</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div>
            <p className={`text-base sm:text-lg font-bold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockProducts.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Under threshold</p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition" onClick={() => setCurrentModule('customers')}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Customers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              {customers.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Registered clients</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Sales Volume Analytics</h2>
              <p className="text-xs text-slate-500">Revenue activity and transactions over time</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setChartTimeframe('7d')}
                className={`px-2.5 py-1 rounded-md transition ${chartTimeframe === '7d' ? 'bg-white font-bold text-[#10294B] shadow-xs' : 'text-slate-600'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartTimeframe('30d')}
                className={`px-2.5 py-1 rounded-md transition ${chartTimeframe === '30d' ? 'bg-white font-bold text-[#10294B] shadow-xs' : 'text-slate-600'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setChartTimeframe('monthly')}
                className={`px-2.5 py-1 rounded-md transition ${chartTimeframe === 'monthly' ? 'bg-white font-bold text-[#10294B] shadow-xs' : 'text-slate-600'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Interactive Visual Bar Representation */}
          <div className="h-48 pt-6 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100">
            {chartBars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                  {formatNaira(bar.amount)}
                </div>
                {/* Bar */}
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-[#10294B] to-[#1e4a83] rounded-t-md hover:from-[#D8B45A] hover:to-[#e4c26b] transition-all duration-300"
                  style={{ height: `${bar.heightPercent}%` }}
                />
                <span className="text-[11px] text-slate-500 mt-2 font-medium">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#10294B]"></span>
              <span>Sales Revenue (₦)</span>
            </div>
            <span>Average Order Value: {sales.length > 0 ? formatNaira(totalSales / sales.length) : '₦0.00'}</span>
          </div>
        </div>

        {/* Monthly Performance & Targets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Monthly Targets</h2>
            <p className="text-xs text-slate-500">Sales goal & expense ratio</p>
          </div>

          {/* Revenue Target Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Revenue Target (₦2,500,000)</span>
              <span className="font-bold text-[#10294B]">
                {Math.min(100, Math.round((totalSales / 2500000) * 100))}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D8B45A] to-[#b38e35] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalSales / 2500000) * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {formatNaira(totalSales)} attained of ₦2,500,000 monthly goal
            </p>
          </div>

          {/* Cost Control Gauge */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Expense-to-Sales Ratio</span>
              <span className="font-bold text-slate-800">
                {totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width: `${Math.min(100, totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Lower is healthier. Safe threshold is under 60%.
            </p>
          </div>

          {/* Quick Action links */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setCurrentModule('invoices')}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
            >
              <span>Issue New Customer Invoice</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentModule('reports')}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
            >
              <span>View Full Profit & Loss Report</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest recorded customer sales & payments</p>
          </div>
          <button
            onClick={() => setCurrentModule('sales')}
            className="text-xs font-semibold text-[#10294B] hover:text-[#D8B45A] transition flex items-center space-x-1"
          >
            <span>View All Sales</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Sales Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;Record Sale&quot; to make your first sale, or load sample data to explore features.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={openQuickSaleModal}
                className="px-4 py-2 bg-[#10294B] text-white text-xs font-semibold rounded-xl"
              >
                Record First Sale
              </button>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-4 py-2 bg-[#faf4e6] text-[#10294B] border border-[#f0dca5] text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <Sparkles size={13} className="text-[#D8B45A]" />
                <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5 text-right">Amount (₦)</th>
                  <th className="p-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatNaira(sale.totalAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#10294B] hover:bg-slate-100 transition"
                        title="View Official Receipt"
                      >
                        <Eye size={15} />
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
