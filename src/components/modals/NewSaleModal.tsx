import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { SaleItem } from '../../types';
import { formatNaira } from '../../utils/formatters';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated?: (saleId: string) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onSaleCreated }) => {
  const { products, customers, addSale } = useBusinessData();
  const { userProfile, activeBusiness } = useAuth();

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos' | 'credit'>('transfer');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending'>('paid');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddProduct = () => {
    setError(null);
    if (!selectedProduct) {
      setError('Please select a product from the list.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) return;

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (quantity > prod.quantity) {
      setError(`Only ${prod.quantity} ${prod.unit || 'units'} available in stock for ${prod.name}.`);
      return;
    }

    const existingIdx = items.findIndex((i) => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...items];
      const newQty = updated[existingIdx].quantity + quantity;
      if (newQty > prod.quantity) {
        setError(`Cannot exceed available stock of ${prod.quantity}.`);
        return;
      }
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].total = newQty * prod.sellingPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity,
          unitPrice: prod.sellingPrice,
          total: quantity * prod.sellingPrice,
        },
      ]);
    }

    // Reset picker
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeBusiness?.planStatus === 'expired') {
      setError('Your subscription has expired. Please renew your plan under Subscription Management to record sales.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item to the sale.');
      return;
    }

    setSubmitting(true);
    try {
      const newSale = await addSale({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        items,
        totalAmount,
        discount: Number(discount) || 0,
        paymentMethod,
        paymentStatus,
        notes: notes.trim() || undefined,
        recordedBy: userProfile?.displayName || 'Cashier',
      });

      if (onSaleCreated) {
        onSaleCreated(newSale.id);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record sale';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        <div className="bg-[#10294B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D8B45A] text-[#10294B] flex items-center justify-center font-bold">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record New Sale / POS</h2>
              <p className="text-[11px] text-[#D8B45A]">Auto-deducts inventory & generates official receipt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#1b3e70]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name / Account
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setSelectedCustomerId('');
                }}
                placeholder="Walk-in Customer or Search"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Pick Registered Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCustomerId(id);
                  const found = customers.find((c) => c.id === id);
                  if (found) setCustomerName(found.name);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900 bg-white"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product selector row */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-[#10294B] uppercase tracking-wide">
              Add Products to Cart
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-900"
                >
                  <option value="">-- Select Product from Inventory --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                      {p.name} — {formatNaira(p.sellingPrice)} ({p.quantity} {p.unit || 'units'} left
                      {p.quantity <= 0 ? ' - OUT OF STOCK' : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  placeholder="Qty"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full h-full py-2 bg-[#D8B45A] hover:bg-[#c49f45] text-[#10294B] font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart table */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selected Items ({items.length})
            </label>
            {items.length === 0 ? (
              <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No products added yet. Select a product above to add to this transaction.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{item.productName}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatNaira(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-semibold text-[#10294B]">{formatNaira(item.total)}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-900"
              >
                <option value="transfer">Bank Transfer (Instant / NIP)</option>
                <option value="cash">Cash Payment</option>
                <option value="pos">POS Terminal (Debit Card)</option>
                <option value="credit">Credit / Customer Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-900"
              >
                <option value="paid">Paid in Full</option>
                <option value="partial">Partially Paid</option>
                <option value="pending">Pending / On Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (₦)</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                placeholder="0.00"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Subtotal:</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#10294B]">
                <span>Total Amount:</span>
                <span className="text-emerald-700">{formatNaira(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deposit paid via OPay, balance due next week"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-5 py-2.5 bg-[#10294B] hover:bg-[#15345d] text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{submitting ? 'Recording Sale...' : `Confirm Sale (${formatNaira(totalAmount)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
