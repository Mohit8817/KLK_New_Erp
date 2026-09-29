export interface PaymentRecord {
  id: number;
  date: string;              // "YYYY-MM-DD HH:mm:ss"
  siteIds: string[];
  file: string;              // invoice path (relative) ya blob: URL
  amount: number;
  remarks: string;
  claimStatus: number;       // 1 = Pending (screenshot ke hisaab se)
  payStatus: number;         // 0 = Pending
  paymentAmount: number | null;
  paymentDate: string | null;
  paymentRemarks: string | null;
}

export interface SiteOption { id: string; label: string }

/* API ke "sites" array se aana chahiye (abhi response mein khaali tha) */
export const SAMPLE_PAYMENT_SITES: SiteOption[] = [
  { id: '755', label: 'JODU BORI - NA' },
  { id: '756', label: 'Testing1 - ut' },
  { id: '757', label: 'Testing2 - NA' },
];

export const SAMPLE_PAYMENTS: PaymentRecord[] = [
  {
    id: 137,
    date: '2026-09-28 13:27:22',
    siteIds: ['755'],
    file: 'uploads/assam/installation/swp/payment/invoice_1790582242.jpg',
    amount: 2000,
    remarks: 'testing',
    claimStatus: 1,
    payStatus: 0,
    paymentAmount: null,
    paymentDate: null,
    paymentRemarks: null,
  },
];