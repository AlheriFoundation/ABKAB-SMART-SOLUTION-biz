/**
 * ABKAB BizManager - Trusted Financial & Inventory Calculation Engine
 * 
 * Implements strict server-side calculation rules:
 * 1. Product selling prices and cost prices are strictly sourced from verified database records.
 * 2. Client-submitted prices are discarded and cannot override stored catalog prices.
 * 3. Subtotals are recalculated from authoritative unit prices and quantities.
 * 4. Discounts are validated (non-negative, capped at subtotal).
 * 5. Nigerian VAT 7.5% calculations are consistent.
 * 6. Historical cost prices and selling prices are permanently captured at the moment of sale.
 * 7. Refunds require authorized roles, prevent double-refunds, and calculate exact restock quantities.
 */

import * as crypto from 'crypto';
import { Product, SaleItem } from '../types';

export interface VerifiedSaleItem extends SaleItem {
  unitCostPrice: number;
}

export interface VerifiedSaleCalculation {
  items: VerifiedSaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  costOfGoodsSold: number;
  estimatedGrossProfit: number;
}

export interface VerifiedInvoiceCalculation {
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  total: number;
}

export class TrustedFinancialEngine {
  /**
   * Recalculates and verifies a sale transaction against authoritative database catalog products.
   * Throws an error if any requested quantity is insufficient, product is missing, or discount is invalid.
   */
  static verifyAndCalculateSale(
    requestedItems: { productId: string; quantity: number; productName?: string }[],
    dbProducts: Map<string, Product>,
    requestedDiscount: number = 0
  ): VerifiedSaleCalculation {
    if (!requestedItems || requestedItems.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    const verifiedItems: VerifiedSaleItem[] = [];
    let subtotal = 0;
    let costOfGoodsSold = 0;

    for (const reqItem of requestedItems) {
      if (reqItem.quantity <= 0) {
        throw new Error(`Invalid quantity ${reqItem.quantity} for product ID ${reqItem.productId}`);
      }

      const dbProduct = dbProducts.get(reqItem.productId);
      if (!dbProduct) {
        throw new Error(`Product "${reqItem.productName || reqItem.productId}" not found in inventory`);
      }

      // Check current stock availability
      if (dbProduct.quantity < reqItem.quantity) {
        throw new Error(
          `Insufficient stock for "${dbProduct.name}". Available: ${dbProduct.quantity}, Requested: ${reqItem.quantity}`
        );
      }

      // Strictly take authoritative selling price and cost price from database record
      const unitPrice = dbProduct.sellingPrice;
      const unitCostPrice = dbProduct.costPrice ?? 0;
      const lineTotal = unitPrice * reqItem.quantity;
      const lineCost = unitCostPrice * reqItem.quantity;

      subtotal += lineTotal;
      costOfGoodsSold += lineCost;

      verifiedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        quantity: reqItem.quantity,
        unitPrice,
        unitCostPrice,
        total: lineTotal,
      });
    }

    // Validate discount
    const validDiscount = Math.max(0, Number(requestedDiscount) || 0);
    if (validDiscount > subtotal) {
      throw new Error(
        `Discount (₦${validDiscount.toLocaleString()}) cannot exceed subtotal (₦${subtotal.toLocaleString()})`
      );
    }

    const totalAmount = subtotal - validDiscount;
    const estimatedGrossProfit = totalAmount - costOfGoodsSold;

    return {
      items: verifiedItems,
      subtotal,
      discount: validDiscount,
      totalAmount,
      costOfGoodsSold,
      estimatedGrossProfit,
    };
  }

  /**
   * Validates and recalculates an invoice using Nigerian VAT rules (7.5% standard).
   */
  static verifyAndCalculateInvoice(
    items: { description: string; quantity: number; unitPrice: number }[],
    applyVat: boolean,
    requestedDiscount: number = 0
  ): VerifiedInvoiceCalculation {
    if (!items || items.length === 0) {
      throw new Error('Invoice must contain at least one line item');
    }

    const verifiedItems: { description: string; quantity: number; unitPrice: number; total: number }[] = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.description || item.description.trim().length === 0) {
        throw new Error('Invoice line item description cannot be empty');
      }
      const qty = Math.max(1, Math.floor(item.quantity) || 1);
      const price = Math.max(0, Number(item.unitPrice) || 0);
      const lineTotal = qty * price;

      subtotal += lineTotal;
      verifiedItems.push({
        description: item.description.trim(),
        quantity: qty,
        unitPrice: price,
        total: lineTotal,
      });
    }

    const vatRate = applyVat ? 7.5 : 0;
    const vatAmount = Math.round(((subtotal * vatRate) / 100) * 100) / 100;
    const validDiscount = Math.max(0, Number(requestedDiscount) || 0);

    if (validDiscount > subtotal + vatAmount) {
      throw new Error('Discount cannot exceed the total invoice value');
    }

    const total = subtotal + vatAmount - validDiscount;

    return {
      items: verifiedItems,
      subtotal,
      vatRate,
      vatAmount,
      discount: validDiscount,
      total,
    };
  }

  /**
   * Validates authorization for transaction refunds and calculates stock to restore.
   */
  static verifyRefundAuthorization(
    role: string,
    sale: { id: string; status?: string; items: { productId: string; quantity: number }[] }
  ): { authorized: boolean; restockItems: { productId: string; quantity: number }[] } {
    const authorizedRoles = ['owner', 'manager', 'admin'];
    const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');

    if (!authorizedRoles.includes(normalizedRole)) {
      throw new Error(`Unauthorized: Role "${role}" cannot process refunds. Only Owners and Managers are authorized.`);
    }

    if (sale.status === 'refunded' || sale.status === 'void') {
      throw new Error(`Transaction ${sale.id} has already been marked as ${sale.status}. Cannot re-refund.`);
    }

    const restockItems = sale.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
    }));

    return {
      authorized: true,
      restockItems,
    };
  }

  /**
   * Verified Profit and Loss Calculation (excluding refunded transactions and preserving historical margins).
   */
  static calculateVerifiedProfitAndLoss(
    sales: { totalAmount: number; status?: string; items: { quantity: number; unitCostPrice?: number; unitPrice: number }[] }[],
    expenses: { amount: number }[]
  ): {
    grossSales: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: number;
    netProfit: number;
    netMarginPercent: number;
    refundedSalesCount: number;
  } {
    let grossSales = 0;
    let costOfGoodsSold = 0;
    let refundedSalesCount = 0;

    for (const sale of sales) {
      if (sale.status === 'refunded' || sale.status === 'void') {
        refundedSalesCount++;
        continue; // Exclude refunded transactions from revenue and COGS
      }

      grossSales += sale.totalAmount;

      for (const item of sale.items) {
        // Use verified historical cost if preserved, otherwise fallback to 70% standard margin
        const unitCost = typeof item.unitCostPrice === 'number' ? item.unitCostPrice : item.unitPrice * 0.7;
        costOfGoodsSold += unitCost * item.quantity;
      }
    }

    const grossProfit = grossSales - costOfGoodsSold;
    const grossMarginPercent = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;

    const operatingExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

    return {
      grossSales,
      costOfGoodsSold,
      grossProfit,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      operatingExpenses,
      netProfit,
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      refundedSalesCount,
    };
  }

  /**
   * Verifies Paystack Webhook HMAC SHA-512 cryptographic signature.
   */
  static verifyPaystackWebhookSignature(
    rawPayload: string | Buffer,
    signatureHeader: string,
    secretKey: string
  ): boolean {
    if (!signatureHeader || !secretKey) return false;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawPayload)
      .digest('hex');
    return hash === signatureHeader;
  }
}
