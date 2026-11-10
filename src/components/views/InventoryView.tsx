import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatNaira } from '../../utils/formatters';
import { Product } from '../../types';

const PRODUCT_UNITS = ['Pcs', 'Cartons', 'Bags', 'Gallons', 'Kg', 'Liters', 'Yards', 'Boxes', 'Rolls', 'Packets'];

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useBusinessData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General Goods');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unit, setUnit] = useState('Pcs');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const isLowStock = p.quantity <= (p.lowStockThreshold || 5);
    const matchesLowStock = !filterLowStockOnly || isLowStock;

    return matchesSearch && matchesLowStock;
  });

  const totalCostValuation = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;
  const lowStockCount = products.filter((p) => p.quantity <= (p.lowStockThreshold || 5)).length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Food Provisions');
    setCostPrice('');
    setSellingPrice('');
    setQuantity(10);
    setLowStockThreshold(5);
    setUnit('Pcs');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setCostPrice(p.costPrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setQuantity(p.quantity);
    setLowStockThreshold(p.lowStockThreshold);
    setUnit(p.unit || 'Pcs');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cp = parseFloat(costPrice);
    const sp = parseFloat(sellingPrice);

    if (!name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (isNaN(cp) || cp < 0 || isNaN(sp) || sp < 0) {
      setFormError('Valid cost price and selling price are required.');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          costPrice: cp,
          sellingPrice: sp,
          quantity: Number(quantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          unit,
        });
      } else {
        await addProduct({
          name: name.trim(),
          sku: sku.trim(),
          category: category.trim(),
          costPrice: cp,
          sellingPrice: sp,
          quantity: Number(quantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          unit,
        });
      }
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setFormError(msg);
    }
  };

  const handleApplyRestock = async () => {
    if (!restockProduct) return;
    const newQty = restockProduct.quantity + restockAmount;
    await adjustStock(restockProduct.id, newQty);
    setRestockProduct(null);
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (window.confirm(`Delete product "${prodName}" from inventory?`)) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Package size={24} className="text-[#10294B]" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time catalog, stock valuations, restock triggers, and unit pricing
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#10294B] hover:bg-[#15345d] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Valuations Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Cost Valuation</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{formatNaira(totalCostValuation)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total invested capital</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Retail Potential</p>
          <p className="text-lg sm:text-xl font-bold text-[#10294B] mt-1">{formatNaira(totalRetailValuation)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Expected gross revenue</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Unrealized Profit</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">{formatNaira(potentialProfit)}</p>
          <p className="text-[11px] text-slate-400 mt-1">At current selling prices</p>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
            filterLowStockOnly
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</p>
            {lowStockCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1">{lowStockCount} items</p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">
            {filterLowStockOnly ? 'Filtered: click to reset' : 'Click to filter low stock'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              filterLowStockOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {filterLowStockOnly ? 'Showing Low Stock Only' : 'Show Low Stock'}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-600">No inventory products found.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 bg-[#10294B] text-white text-xs font-semibold rounded-xl"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product & SKU</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Cost Price (₦)</th>
                  <th className="p-3.5 text-right">Selling Price (₦)</th>
                  <th className="p-3.5 text-center">Margin %</th>
                  <th className="p-3.5 text-center">Stock Level</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.quantity <= (p.lowStockThreshold || 5);
                  const marginPct = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{p.sku}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-600">
                        {formatNaira(p.costPrice)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatNaira(p.sellingPrice)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {p.quantity} {p.unit || 'units'}
                          </span>
                          {isLow && (
                            <span className="text-[9px] text-amber-600 font-semibold mt-0.5">
                              Alert &le; {p.lowStockThreshold}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockAmount(10);
                            }}
                            className="px-2 py-1 bg-[#faf4e6] hover:bg-[#f3e6c2] text-[#10294B] rounded-lg text-[11px] font-semibold transition"
                            title="Quick Restock"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#10294B] hover:bg-slate-100 transition"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-[#10294B] px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Inventory Product'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Gold Long Grain Rice (50kg)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Food Provisions, Electronics"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₦) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₦) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] bg-white text-slate-900"
                  >
                    {PRODUCT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Low Stock Threshold Alert
                </label>
                <input
                  type="number"
                  min={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Triggers dashboard alert when stock drops to or below this level</p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#10294B] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Quick Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-800">Quick Restock</h3>
            <p className="text-xs text-slate-500 mt-0.5">{restockProduct.name}</p>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              Current in stock: <span className="font-bold text-[#10294B]">{restockProduct.quantity} {restockProduct.unit}</span>
            </p>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Add (+):
              </label>
              <input
                type="number"
                min={1}
                value={restockAmount}
                onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10294B] text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                New total will be: <span className="font-bold text-emerald-700">{restockProduct.quantity + restockAmount} {restockProduct.unit}</span>
              </p>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setRestockProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRestock}
                className="px-4 py-2 bg-[#10294B] text-white text-xs font-bold rounded-xl"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
