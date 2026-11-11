/**
 * ABKAB BizManager - Nigerian Payment Methods & Banking Utilities
 * Optimized for Nigerian SMB commerce: NIP instant transfers, POS, Cash & Credit.
 */

export interface NigerianBank {
  name: string;
  code: string;
  category: 'commercial' | 'fintech' | 'microfinance';
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: 'Access Bank', code: '044', category: 'commercial' },
  { name: 'Zenith Bank', code: '057', category: 'commercial' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', category: 'commercial' },
  { name: 'First Bank of Nigeria', code: '011', category: 'commercial' },
  { name: 'United Bank for Africa (UBA)', code: '033', category: 'commercial' },
  { name: 'Moniepoint MFB', code: '50515', category: 'fintech' },
  { name: 'OPay', code: '999992', category: 'fintech' },
  { name: 'Kuda Bank', code: '50211', category: 'fintech' },
  { name: 'PalmPay', code: '999991', category: 'fintech' },
  { name: 'Fidelity Bank', code: '070', category: 'commercial' },
  { name: 'First City Monument Bank (FCMB)', code: '214', category: 'commercial' },
  { name: 'Stanbic IBTC Bank', code: '221', category: 'commercial' },
  { name: 'Union Bank of Nigeria', code: '032', category: 'commercial' },
  { name: 'Sterling Bank', code: '232', category: 'commercial' },
  { name: 'Wema Bank (ALAT)', code: '035', category: 'commercial' },
  { name: 'Polaris Bank', code: '076', category: 'commercial' },
  { name: 'Keystone Bank', code: '082', category: 'commercial' },
  { name: 'Jaiz Bank (Non-Interest)', code: '301', category: 'commercial' },
  { name: 'TAJBank', code: '302', category: 'commercial' },
  { name: 'Lotus Bank', code: '303', category: 'commercial' },
];

export const POS_PROVIDERS = [
  'Moniepoint POS',
  'OPay POS',
  'PalmPay POS',
  'Nomba / Kudi POS',
  'Baxi POS',
  'Bank Terminal (GTB / Zenith / Access / FirstBank)',
  'Other Smart POS',
];

export type PaymentMethodType = 'cash' | 'transfer' | 'pos' | 'credit' | 'split';

export interface SplitPaymentDetail {
  method: 'cash' | 'transfer' | 'pos' | 'credit';
  amount: number;
  reference?: string;
}

export function formatPaymentMethodLabel(method: string): string {
  switch (method?.toLowerCase()) {
    case 'cash':
      return 'Cash';
    case 'transfer':
      return 'Bank Transfer (NIP)';
    case 'pos':
      return 'POS Terminal';
    case 'credit':
      return 'Customer Credit / Ledger';
    case 'split':
      return 'Split / Mixed Payment';
    default:
      return method || 'Unknown';
  }
}

export function validateNuban(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber.trim());
}
