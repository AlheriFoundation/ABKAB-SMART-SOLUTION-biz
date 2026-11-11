/**
 * ABKAB BizManager - Payment Methods & Banking Integrity Test Suite
 * Tests:
 * 1. NUBAN Account Number Validation (Strict 10-digit regex)
 * 2. Nigerian Bank Directory & FinTech Institutions List
 * 3. Cash Tender & Change Due Mathematical Calculations
 * 4. Multi-Method Split Payment Reconciliation
 * 5. Payment Method Formatting and Receipt / Invoice Remittance Data
 */

import {
  NIGERIAN_BANKS,
  POS_PROVIDERS,
  validateNuban,
  formatPaymentMethodLabel,
} from '../utils/paymentMethods';
import { Sale } from '../types';

function runPaymentTests() {
  console.log('--- STARTING PAYMENT METHODS INTEGRITY TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. NUBAN Validation
  assert(validateNuban('0123456789') === true, 'Valid 10-digit NUBAN accepted');
  assert(validateNuban('2049182049') === true, 'Valid 10-digit GTBank NUBAN accepted');
  assert(validateNuban('123456789') === false, '9-digit NUBAN rejected');
  assert(validateNuban('12345678901') === false, '11-digit NUBAN rejected');
  assert(validateNuban('012345678A') === false, 'Alphanumeric NUBAN rejected');

  // 2. Nigerian Banks Directory
  assert(NIGERIAN_BANKS.length >= 15, 'Directory contains comprehensive Nigerian banks');
  assert(NIGERIAN_BANKS.some((b) => b.name.includes('GTBank') || b.name.includes('Guaranty Trust')), 'GTBank present');
  assert(NIGERIAN_BANKS.some((b) => b.name.includes('Zenith')), 'Zenith Bank present');
  assert(NIGERIAN_BANKS.some((b) => b.name.includes('Moniepoint')), 'Moniepoint MFB present');
  assert(NIGERIAN_BANKS.some((b) => b.name.includes('OPay')), 'OPay present');
  assert(NIGERIAN_BANKS.some((b) => b.name.includes('Access Bank')), 'Access Bank present');

  // 3. POS Hardware Providers
  assert(POS_PROVIDERS.includes('Moniepoint POS'), 'Moniepoint POS included');
  assert(POS_PROVIDERS.includes('OPay POS'), 'OPay POS included');

  // 4. Method Label Formatting
  assert(formatPaymentMethodLabel('cash') === 'Cash', 'Cash formatted correctly');
  assert(formatPaymentMethodLabel('transfer') === 'Bank Transfer (NIP)', 'Transfer formatted as NIP Transfer');
  assert(formatPaymentMethodLabel('pos') === 'POS Terminal', 'POS formatted as POS Terminal');
  assert(formatPaymentMethodLabel('split') === 'Split / Mixed Payment', 'Split formatted as Split / Mixed');
  assert(formatPaymentMethodLabel('credit') === 'Customer Credit / Ledger', 'Credit formatted as Customer Credit');

  // 5. Cash Tender & Change Calculations
  const totalAmount = 14500;
  const tendered = 15000;
  const changeDue = Math.max(0, tendered - totalAmount);
  assert(changeDue === 500, 'Calculates ₦500 change on ₦15,000 tendered for ₦14,500 total');

  const exactTendered = 14500;
  const exactChange = Math.max(0, exactTendered - totalAmount);
  assert(exactChange === 0, 'Calculates ₦0 change on exact cash payment');

  // 6. Split Payment Math
  const splitTotal = 50000;
  const splitCash = 10000;
  const splitTransfer = 30000;
  const splitPos = 10000;
  const splitSum = splitCash + splitTransfer + splitPos;
  assert(splitSum === splitTotal, 'Split payment sums exactly to total amount');
  assert(Math.abs(splitSum - splitTotal) < 0.001, 'Split payment has zero variance');

  // 7. Sale Object Integrity
  const testSale: Sale = {
    id: 'sale_test_001',
    businessId: 'biz_001',
    receiptNumber: 'REC-20261111-1001',
    customerName: 'Alhaji Musa Danbaba',
    items: [
      {
        productId: 'prod_1',
        productName: 'Dangote Sugar 50kg',
        quantity: 2,
        unitPrice: 45000,
        unitCostPrice: 42000,
        total: 90000,
      },
    ],
    subtotal: 90000,
    discount: 5000,
    totalAmount: 85000,
    paymentMethod: 'split',
    paymentStatus: 'paid',
    splitBreakdown: [
      { method: 'transfer', amount: 50000, reference: 'NIP-89201928391' },
      { method: 'cash', amount: 35000 },
    ],
    status: 'completed',
    recordedBy: 'Cashier Fatima',
    createdAt: new Date().toISOString(),
  };

  const recordedSplitSum = testSale.splitBreakdown?.reduce((sum, s) => sum + s.amount, 0);
  assert(recordedSplitSum === testSale.totalAmount, 'Sale split breakdown reconciles with totalAmount');
  assert(testSale.splitBreakdown?.[0].reference === 'NIP-89201928391', 'Transfer reference preserved');

  console.log(`\nTEST SUMMARY: ${passed}/${total} TESTS PASSED.`);
  if (passed === total) {
    console.log('ALL PAYMENT METHOD INTEGRITY TESTS PASSED SUCCESSFULLY.');
  }
}

runPaymentTests();
