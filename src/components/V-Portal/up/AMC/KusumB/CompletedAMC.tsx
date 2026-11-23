import {
  UpAmcTablePage,
  amcTextCol,
  amcMediaCol,
  type AmcColumn,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upKusumBAmcApi } from '../../up-services';
import { authService, type UserSession } from '../../../../../services/authService';

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const cleanText = (val: unknown, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return fallback;
  return s;
};

const formatAmcType = (val: unknown): string => {
  const raw = cleanText(val);
  if (!raw) return '—';
  const upper = raw.toUpperCase();
  if (upper === 'M' || upper === 'MONTHLY' || upper === '1') return 'Monthly (M)';
  if (upper === 'Q' || upper === 'QUARTERLY' || upper === '3') return 'Quarterly (Q)';
  if (upper === 'H' || upper === 'HALF-YEARLY' || upper === 'HALF_YEARLY' || upper === '6') {
    return 'Half-Yearly (H)';
  }
  if (upper === 'Y' || upper === 'YEARLY' || upper === 'ANNUAL' || upper === '12') return 'Yearly (Y)';
  return raw;
};

const formatMonth = (val: unknown): string => {
  const raw = cleanText(val);
  if (!raw) return '—';
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return MONTH_NAMES[n];
  return raw;
};

const resolveVendorName = (item: any, session: UserSession | null): string => {
  const explicit = cleanText(
    item?.vendor_name || item?.vendor?.name || item?.vendors?.name || item?.contractor_name
  );
  if (explicit) return explicit;

  const vid = cleanText(item?.vendor_id ?? item?.created_by);
  const sessionName = cleanText(session?.name);
  if (
    sessionName &&
    (session?.role === 'vendor' || (vid && cleanText(session?.id) === vid))
  ) {
    return sessionName;
  }
  return vid ? `Vendor #${vid}` : '';
};

const getAmcStatusInfo = (val: unknown): { label: string; tone: string } => {
  const s = cleanText(val).toLowerCase();
  if (s === '1' || s === 'completed' || s === 'done') {
    return { label: 'Completed', tone: 'ax-badge--info' };
  }
  return { label: 'Pending', tone: 'ax-badge--warning' };
};

const getVerifyStatusInfo = (val: unknown): { label: string; tone: string } => {
  const s = cleanText(val).toLowerCase();
  if (s === '1' || s === 'verified' || s === 'approved') {
    return { label: 'Verified', tone: 'ax-badge--success' };
  }
  if (s === '2' || s === 'rejected') {
    return { label: 'Rejected', tone: 'ax-badge--danger' };
  }
  return { label: 'Pending', tone: 'ax-badge--warning' };
};

export function UP_AMC_KusumB_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upKusumBAmcApi.completedDetails();
    if (!res || res.status === false) return [];

    const rawList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res)
      ? res
      : [];

    const session = authService.getSession();

    return rawList.map((item: any) => {
      const stateRaw = cleanText(item.state);
      const district = cleanText(item.district ?? item.installation_dsitrict);
      const village = cleanText(item.installation_village ?? item.village);
      const farmer_name = cleanText(item.beneficiary ?? item.farmer_name ?? item.site_name);
      const father_name = cleanText(item.father_name);
      const mobile = cleanText(item.mobile);
      const report_year = cleanText(item.report_year);
      const report_month = cleanText(item.report_month);
      const month_label = formatMonth(report_month);
      const amc_date = cleanText(item.amc_date);
      const beneficiary_name = cleanText(item.beneficiary_name);
      const beneficiary_contact = cleanText(item.beneficiary_contact);
      const latitude = cleanText(item.latitude);
      const longitude = cleanText(item.longitude);
      const remark = cleanText(item.remark ?? item.remarks);
      const vendor_name = resolveVendorName(item, session);

      return {
        ...item,
        state: stateRaw ? stateRaw.toUpperCase() : '',
        district,
        village,
        installation_village: village,
        farmer_name,
        father_name,
        mobile,
        report_year,
        report_month,
        month_label: month_label === '—' ? '' : month_label,
        amc_date,
        beneficiary_name,
        beneficiary_contact,
        latitude,
        longitude,
        remark,
        vendor_name,
      };
    });
  };

  const columns: AmcColumn<any>[] = [
    {
      header: 'AMC Type',
      cell: (r: any) => {
        const label = formatAmcType(r.amc_type);
        return label === '—' ? (
          '—'
        ) : (
          <span className="ax-badge ax-badge--soft ax-badge--primary">{label}</span>
        );
      },
      exportValue: (r: any) => formatAmcType(r.amc_type),
    },
    amcTextCol('State', ['state']),
    amcTextCol('District', ['district', 'installation_dsitrict']),
    amcTextCol('Village', ['village', 'installation_village']),
    amcTextCol('Farmer Name', ['farmer_name', 'beneficiary', 'site_name'], { strong: true }),
    amcTextCol('Father Name', ['father_name']),
    amcTextCol('Mobile', ['mobile']),
    amcTextCol('Year', ['report_year']),
    amcTextCol('Month', ['month_label', 'report_month']),
    amcTextCol('AMC Date', ['amc_date']),
    amcTextCol('Beneficiary Name', ['beneficiary_name']),
    amcTextCol('Beneficiary Contact', ['beneficiary_contact']),
    amcTextCol('Latitude', ['latitude']),
    amcTextCol('Longitude', ['longitude']),
    amcTextCol('Remarks', ['remark', 'remarks'], { clamp: true }),
    amcMediaCol('AMC Image-1', (r: any) => resolveUpMediaUrl(r.image1)),
    amcMediaCol('AMC Image-2', (r: any) => resolveUpMediaUrl(r.image2)),
    amcMediaCol('AMC Image-3', (r: any) => resolveUpMediaUrl(r.image3)),
    amcMediaCol('AMC Image-4', (r: any) => resolveUpMediaUrl(r.image4)),
    amcTextCol('Vendor Name', ['vendor_name']),
    {
      header: 'AMC Status',
      cell: (r: any) => {
        const st = getAmcStatusInfo(r.amc_status);
        return <span className={`ax-badge ax-badge--soft ${st.tone}`}>{st.label}</span>;
      },
      exportValue: (r: any) => getAmcStatusInfo(r.amc_status).label,
    },
    {
      header: 'Verify Status',
      cell: (r: any) => {
        const vs = getVerifyStatusInfo(r.verify_status);
        return <span className={`ax-badge ax-badge--soft ${vs.tone}`}>{vs.label}</span>;
      },
      exportValue: (r: any) => getVerifyStatusInfo(r.verify_status).label,
    },
  ];

  const searchFields = (r: any) => [
    r.amc_type,
    r.state,
    r.district,
    r.village,
    r.farmer_name,
    r.beneficiary,
    r.father_name,
    r.mobile,
    r.report_year,
    r.report_month,
    r.month_label,
    r.amc_date,
    r.beneficiary_name,
    r.beneficiary_contact,
    r.remark,
    r.vendor_name,
    r.pump_capacity,
    r.site_name,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'AMC Type', value: formatAmcType(r.amc_type) },
    { label: 'State', value: r.state || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Village', value: r.village || '—' },
    { label: 'Farmer Name', value: r.farmer_name || '—' },
    { label: 'Father Name', value: r.father_name || '—' },
    { label: 'Mobile', value: r.mobile || '—' },
    { label: 'Year', value: r.report_year || '—' },
    { label: 'Month', value: r.month_label || r.report_month || '—' },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Beneficiary Name', value: r.beneficiary_name || '—' },
    { label: 'Beneficiary Contact', value: r.beneficiary_contact || '—' },
    { label: 'Latitude', value: r.latitude || '—' },
    { label: 'Longitude', value: r.longitude || '—' },
    { label: 'Pump Capacity', value: cleanText(r.pump_capacity, '—') },
    { label: 'Vendor Name', value: r.vendor_name || '—' },
    { label: 'AMC Status', value: getAmcStatusInfo(r.amc_status).label },
    { label: 'Verify Status', value: getVerifyStatusInfo(r.verify_status).label },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP Kusum B — Completed AMC Reports"
      subtitle="View all submitted maintenance inspection reports for PM Kusum Component-B solar pumps"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum B' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up/kusumb/amc/assign-site"
      addLabel="New AMC Report"
      cardTitle="Submitted Kusum B AMC Reports"
      searchPlaceholder="Search farmer, beneficiary, district, village, mobile…"
      loadingText="Loading completed Kusum B AMC reports…"
      emptyMessage="No completed Kusum B reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted Kusum B Report"
      detailTitle={(r: any) =>
        `${r.farmer_name || r.beneficiary_name || 'Farmer'} — ${r.month_label || `Month ${r.report_month}`}/${r.report_year}`
      }
      detailFields={detailFields}
      exportName="up_kusumb_completed_amc"
      exportTitle="UP Kusum B Completed AMC Reports"
    />
  );
}

export default UP_AMC_KusumB_CompletedAMC;
