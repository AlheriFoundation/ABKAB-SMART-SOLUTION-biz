import React from 'react';
import { X, Printer, Download, CheckCircle, Copy } from 'lucide-react';
import { Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, formatNaira } from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { activeBusiness } = useAuth();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyReceiptText = () => {
    const text = `
--------------------------------------
${activeBusiness?.name || 'ABKAB BizManager'}
${activeBusiness?.tagline || 'Excellence in Every Service'}
${activeBusiness?.address || ''}, ${activeBusiness?.state || 'Nigeria'}
Phone: ${activeBusiness?.phone || '-'}
CAC: ${activeBusiness?.cacNumber || 'N/A'}
--------------------------------------
RECEIPT: ${sale.receiptNumber}
DATE: ${formatDateTime(sale.createdAt)}
CUSTOMER: ${sale.customerName}
PAYMENT: ${sale.paymentMethod.toUpperCase()} (${sale.paymentStatus.toUpperCase()})
CASHIER: ${sale.recordedBy}
--------------------------------------
ITEMS:
${sale.items.map((i) => `${i.productName} x${i.quantity} @ ${formatNaira(i.unitPrice)} = ${formatNaira(i.total)}`).join('\n')}
--------------------------------------
SUBTOTAL: ${formatNaira(sale.totalAmount + (sale.discount || 0))}
DISCOUNT: -${formatNaira(sale.discount || 0)}
TOTAL PAID: ${formatNaira(sale.totalAmount)}
--------------------------------------
${activeBusiness?.receiptFooter || 'Thank you for your business!'}
Powered by ABKAB BizManager
    `.trim();

    navigator.clipboard.writeText(text);
    alert('Receipt text copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Action Header (hidden when printing) */}
        <div className="no-print bg-[#10294B] px-4 py-3 text-white flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide flex items-center space-x-1.5">
            <CheckCircle size={14} className="text-[#D8B45A]" />
            <span>Official Business Receipt</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyReceiptText}
              className="p-1.5 rounded-lg hover:bg-[#1b3e70] text-slate-300 hover:text-white transition"
              title="Copy receipt summary"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-lg bg-[#D8B45A] hover:bg-[#c49f45] text-[#10294B] text-xs font-bold transition flex items-center space-x-1"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#1b3e70] text-slate-300 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable thermal/paper style receipt layout */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-800 text-xs font-mono">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
            <h2 className="text-base font-bold text-[#10294B] tracking-tight uppercase">
              {activeBusiness?.name || 'ABKAB Smart Business'}
            </h2>
            {activeBusiness?.tagline && (
              <p className="text-[11px] text-slate-500 italic mt-0.5">{activeBusiness.tagline}</p>
            )}
            <p className="text-[11px] text-slate-600 mt-1">
              {activeBusiness?.address || 'Commercial Center'}, {activeBusiness?.state || 'Nigeria'}
            </p>
            <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 mt-1">
              {activeBusiness?.phone && <span>Tel: {activeBusiness.phone}</span>}
              {activeBusiness?.cacNumber && <span>• CAC: {activeBusiness.cacNumber}</span>}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 mb-4 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold text-slate-800">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium text-slate-800 truncate max-w-[200px]">{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold uppercase text-emerald-700">{sale.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.recordedBy || 'Sales Rep'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4">
            <div className="flex justify-between font-bold text-slate-700 mb-2 text-[10px] uppercase">
              <span>Item & Qty</span>
              <span>Amount</span>
            </div>
            <div className="space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="pr-2">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} × {formatNaira(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 shrink-0">{formatNaira(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="space-y-1.5 mb-5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatNaira(sale.totalAmount + (sale.discount || 0))}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Allowed:</span>
                <span>-{formatNaira(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#10294B] pt-1 border-t border-slate-200">
              <span>TOTAL (NGN):</span>
              <span>{formatNaira(sale.totalAmount)}</span>
            </div>
          </div>

          {/* Barcode graphic & footer */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300">
            {/* Realistic stylized barcode */}
            <div className="flex items-center justify-center space-x-1 h-8 opacity-80 my-2">
              {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 6, 2, 3, 5, 1, 4].map((h, i) => (
                <div
                  key={i}
                  className="bg-slate-900"
                  style={{
                    width: (i % 3 === 0 ? 3 : 2) + 'px',
                    height: (16 + h * 2) + 'px',
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide">
              {activeBusiness?.receiptFooter || 'Thank you for your patronage! Excellence in Every Service.'}
            </p>
            <p className="text-[9px] text-slate-400 font-sans mt-1">
              Issued with ABKAB BizManager • ABKAB Smart Solution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
