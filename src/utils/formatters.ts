export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0.00';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦');
}

export function formatShortNaira(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₦0';
  if (Math.abs(amount) >= 1_000_000_000) {
    return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `₦${(amount / 1_000).toFixed(1)}K`;
  }
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatDate(dateStringOrTimestamp: string | number | Date): string {
  if (!dateStringOrTimestamp) return '-';
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStringOrTimestamp: string | number | Date): string {
  if (!dateStringOrTimestamp) return '-';
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function generateReceiptNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${random}`;
}

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export const BUSINESS_CATEGORIES = [
  'Retail Store & Supermarket',
  'Wholesale & Distribution',
  'Textiles & Fashion',
  'Agriculture & Farm Produce',
  'Electronics & Phone Accessories',
  'Pharmacy & Healthcare',
  'Restaurant, Eatery & Bakery',
  'Building Materials & Hardware',
  'Auto Parts & Mechanics',
  'Logistics & Courier',
  'Professional Services & Consulting',
  'Manufacturing & Production',
  'Beauty, Cosmetics & Salons',
  'General Trading & Merchant'
];
