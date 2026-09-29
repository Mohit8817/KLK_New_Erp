export interface InstallationRequestRecord {
  id: number;
  vendorName: string;
  assignDate: string;   // "YYYY-MM-DD HH:mm:ss"
  deadlineDate: string; // "YYYY-MM-DD"
  state: string;
  district: string;
  siteCount: number;
  names: { farmer_name: string | null; father_name: string | null }[];
  file: string;         // relative path from API
  remarks: string;
  status: string;       // "2" = Accepted
  siteIds?: number[];
}

/* Files ka base URL (backend domain) yahan set karo, e.g. 'https://your-api.com/' */
export const ASSET_BASE_URL = '';

const F = 'uploads/assam/installation/swp/assign/';

export const SAMPLE_INSTALLATION_REQUESTS: InstallationRequestRecord[] = [
  { id: 262, vendorName: 'mohit', assignDate: '2026-05-13 13:37:00', deadlineDate: '2026-05-30', state: 'assam', district: 'District', siteCount: 4, file: F + 'installation_assign1778659620.jpeg', remarks: 'testing', status: '2',
    names: [{ farmer_name: 'Testing1', father_name: 'ut' }, { farmer_name: 'Testing2', father_name: 'NA' }, { farmer_name: 'Testing3', father_name: 'abcd' }, { farmer_name: 'Testing4', father_name: 'Ram Vinod' }] },
  { id: 263, vendorName: 'mohit', assignDate: '2026-05-19 15:16:26', deadlineDate: '2026-05-28', state: 'assam', district: 'Lucknow', siteCount: 6, file: F + 'installation_assign1779183986.webp', remarks: 'testing implementation', status: '2',
    names: [{ farmer_name: 'Abhishek', father_name: 'Vinod' }, { farmer_name: 'john', father_name: 'smith' }, { farmer_name: 'rohit', father_name: 'orbit' }, { farmer_name: 'Dinesh', father_name: 'rahul' }, { farmer_name: 'prince', father_name: 'evil' }, { farmer_name: 'sigma', father_name: 'mahesh' }] },
  { id: 264, vendorName: 'mohit', assignDate: '2026-05-19 15:42:13', deadlineDate: '2026-05-27', state: 'assam', district: 'up', siteCount: 1, file: F + 'installation_assign1779185533.png', remarks: 'online testing', status: '2',
    names: [{ farmer_name: 'name', father_name: 'tehsil' }] },
  { id: 265, vendorName: 'mohit', assignDate: '2026-05-19 18:22:21', deadlineDate: '2026-05-20', state: 'assam', district: 'assam', siteCount: 2, file: F + 'installation_assign1779195141.png', remarks: 'editing', status: '2',
    names: [{ farmer_name: 'N/A', father_name: 'N/A' }, { farmer_name: null, father_name: null }] },
  { id: 266, vendorName: 'mohit', assignDate: '2026-05-19 18:30:24', deadlineDate: '2026-05-21', state: 'assam', district: 'assam', siteCount: 1, file: F + 'installation_assign1779195624.webp', remarks: 'testing', status: '2',
    names: [{ farmer_name: null, father_name: null }] },
  { id: 267, vendorName: 'mohit', assignDate: '2026-05-20 10:45:25', deadlineDate: '2026-05-25', state: 'assam', district: 'Lucknow', siteCount: 1, file: F + 'installation_assign1779254125.jpg', remarks: 'testing', status: '2',
    names: [{ farmer_name: 'abhi', father_name: 'pani' }] },
  { id: 268, vendorName: 'mohit', assignDate: '2026-05-20 10:57:42', deadlineDate: '2026-05-21', state: 'assam', district: 'Lucknow', siteCount: 1, file: F + 'installation_assign1779254862.jpg', remarks: 'key', status: '2',
    names: [{ farmer_name: 'vihar', father_name: null }] },
  { id: 269, vendorName: 'mohit', assignDate: '2026-05-20 11:11:26', deadlineDate: '2026-05-22', state: 'assam', district: 'Lucknow', siteCount: 1, file: F + 'installation_assign1779255686.jpg', remarks: 'testing', status: '2',
    names: [{ farmer_name: 'Graham Boyd', father_name: 'Kay Santiago' }] },
  { id: 289, vendorName: 'mohit', assignDate: '2026-06-10 11:18:52', deadlineDate: '2026-06-18', state: 'assam', district: 'Lucknow', siteCount: 1, file: F + 'installation_assign1781070532.jpg', remarks: 'testing', status: '2',
    names: [{ farmer_name: 'john', father_name: 'Eve Powers' }] },
];