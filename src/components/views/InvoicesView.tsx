import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Share2,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatDate, formatDateTime } from '../../utils/formatters';
import { Invoice, InvoiceItem } from '../../types';

export const InvoicesView: React.FC = () => {
  const { invoices, addInvoice, updateInvoiceStatus, deleteInvoice, customers } = useBusinessData();
  const { activeBusiness } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [applyVat, setApplyVat] = useState(true);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState(
    'Payment details: Sterling Bank - 0089201928. Goods remain property of seller until paid in full.'
  );

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Consultation / Goods Delivery', quantity: 1, unitPrice: 50000, total: 50000 },
  ]);

  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Math.max(1, parseInt(value) || 1) : updated[index].quantity;
      const p = field === 'unitPrice' ? Math.max(0, parseFloat(value) || 0) : updated[index].unitPrice;
      updated[index].total = q * p;
    }
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatRate = applyVat ? 7.5 : 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = Math.max(0, subtotal + vatAmount - discount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeBusiness?.planStatus === 'expired') {
      setError('Your subscription has expired. Please renew your plan under Subscription Management to issue new invoices.');
      return;
    }

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      setError('All invoice line items must have description and valid price.');
      return;
    }

    try {
      const created = await addInvoice({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        items,
        issueDate,
        dueDate,
        subtotal,
        vatRate,
        vatAmount,
        discount: Number(discount) || 0,
        total,
        status: 'sent',
        notes: notes.trim() || undefined,
      });

      setIsCreateOpen(false);
      setViewingInvoice(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(msg);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (window.confirm(`Delete invoice ${num}?`)) {
      await deleteInvoice(id);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaidInvoices = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalPendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText size={24} className="text-[#10294B]" />
            <span>Invoices & Official Billing</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate formal Nigerian tax-compliant invoices with 7.5% VAT and payment terms
          </p>
        </div>

        <button
          onClick={() => {
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setCustomerAddress('');
            setItems([{ description: 'Products / Wholesale Supplies', quantity: 1, unitPrice: 75000, total: 75000 }]);
            setError(null);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-[#10294B] hover:bg-[#15345d] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced Amount</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatNaira(totalInvoiced)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{invoices.length} invoices generated</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Settled / Paid Invoices</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatNaira(totalPaidInvoices)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Successfully collected funds</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Invoices</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatNaira(totalPendingInvoices)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Due from customers</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="sent">Sent</option>
          <option value="draft">Draft</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-600">No invoices found.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-3 px-4 py-2 bg-[#10294B] text-white text-xs font-semibold rounded-xl"
            >
              Generate First Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">VAT (7.5%)</th>
                  <th className="p-3.5 text-right">Total (₦)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-[#10294B]">{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      <p>{inv.customerName}</p>
                      {inv.customerPhone && <p className="text-[10px] text-slate-400 font-mono">{inv.customerPhone}</p>}
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="p-3.5 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="p-3.5 text-right text-slate-500">{formatNaira(inv.vatAmount)}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{formatNaira(inv.total)}</td>
                    <td className="p-3.5 text-center">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as any)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border-0 cursor-pointer ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#10294B] hover:bg-slate-100 transition"
                          title="View & Print Invoice"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-[#10294B] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText size={18} className="text-[#D8B45A]" />
                <h2 className="text-base font-bold">Create Professional Invoice</h2>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Customer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billed To (Customer Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emeka Okafor Trading Enterprise"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    placeholder="+234 802 911 3402"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    placeholder="billing@customer.ng"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                  <input
                    type="text"
                    placeholder="Shop 84, Sabon Gari Market, Kano"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>
              </div>

              {/* Line items table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Invoice Items & Services
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Description of goods or service"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          required
                          placeholder="Unit Price ₦"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-right"
                        />
                      </div>
                      <div className="col-span-1 text-right text-xs font-bold text-slate-800">
                        {formatNaira(item.total)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VAT & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                      className="rounded text-[#10294B] focus:ring-[#10294B]"
                    />
                    <span>Apply Nigerian VAT (7.5%)</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (₦)</label>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatNaira(subtotal)}</span>
                  </div>
                  {applyVat && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (7.5%):</span>
                      <span>+{formatNaira(vatAmount)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>-{formatNaira(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-[#10294B] pt-1 border-t border-slate-200">
                    <span>Total Amount (₦):</span>
                    <span>{formatNaira(total)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Instructions & Bank Account
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#10294B] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  Create & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Top Toolbar (no print) */}
            <div className="no-print bg-[#10294B] px-5 py-3 text-white flex items-center justify-between">
              <span className="text-xs font-semibold">Invoice Preview: {viewingInvoice.invoiceNumber}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded-lg bg-[#D8B45A] hover:bg-[#c49f45] text-[#10294B] text-xs font-bold flex items-center space-x-1"
                >
                  <Printer size={13} />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div id="printable-invoice" className="p-8 bg-white text-slate-800 font-sans space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-[#10294B] text-[#D8B45A] flex items-center justify-center font-bold text-base">
                      A
                    </div>
                    <span className="text-xl font-extrabold text-[#10294B] tracking-tight">
                      {activeBusiness?.name || 'ABKAB Smart Solution'}
                    </span>
                  </div>
                  {activeBusiness?.tagline && (
                    <p className="text-xs text-slate-500 mt-1">{activeBusiness.tagline}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    {activeBusiness?.address || 'Central Business District'}, {activeBusiness?.state || 'Nigeria'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Phone: {activeBusiness?.phone || '-'} {activeBusiness?.cacNumber ? `• CAC: ${activeBusiness.cacNumber}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <h2 className="text-2xl font-black text-[#10294B] uppercase tracking-wider">INVOICE</h2>
                  <p className="text-xs font-mono font-bold text-[#D8B45A] mt-1">{viewingInvoice.invoiceNumber}</p>
                  <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                    <p>Issue Date: <span className="font-semibold text-slate-800">{formatDate(viewingInvoice.issueDate)}</span></p>
                    <p>Due Date: <span className="font-semibold text-slate-800">{formatDate(viewingInvoice.dueDate)}</span></p>
                    <p>Status: <span className="font-bold uppercase text-emerald-700">{viewingInvoice.status}</span></p>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">BILLED TO:</p>
                <p className="text-sm font-bold text-slate-900">{viewingInvoice.customerName}</p>
                {viewingInvoice.customerAddress && (
                  <p className="text-xs text-slate-600 mt-0.5">{viewingInvoice.customerAddress}</p>
                )}
                {viewingInvoice.customerPhone && (
                  <p className="text-xs text-slate-500">Tel: {viewingInvoice.customerPhone}</p>
                )}
                {viewingInvoice.customerEmail && (
                  <p className="text-xs text-slate-500">Email: {viewingInvoice.customerEmail}</p>
                )}
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#10294B] text-white font-semibold">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatNaira(item.unitPrice)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatNaira(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatNaira(viewingInvoice.subtotal)}</span>
                  </div>
                  {viewingInvoice.vatAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (7.5%):</span>
                      <span>+{formatNaira(viewingInvoice.vatAmount)}</span>
                    </div>
                  )}
                  {viewingInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>-{formatNaira(viewingInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#10294B] pt-2 border-t border-slate-200">
                    <span>Total Due (NGN):</span>
                    <span>{formatNaira(viewingInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Bank Details */}
              {viewingInvoice.notes && (
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">Payment Instructions:</p>
                  <p className="whitespace-pre-line">{viewingInvoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-6 border-t border-slate-100 text-[11px] text-slate-400">
                <p>{activeBusiness?.receiptFooter || 'Thank you for your business. Excellence in Every Service.'}</p>
                <p className="text-[10px] text-slate-400 mt-1">Generated by ABKAB BizManager</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
