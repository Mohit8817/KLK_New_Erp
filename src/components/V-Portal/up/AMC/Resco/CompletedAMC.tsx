import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatPeriodLabel(m: any, y: any): string {
  if (!m && !y) return '—';
  const num = parseInt(String(m), 10);
  const mName = num >= 1 && num <= 12 ? MONTH_NAMES[num - 1] : String(m || '');
  return y ? `${mName} ${y}` : mName || '—';
}

function formatDateDisplay(val: any): string {
  if (!val) return '—';
  const str = String(val).trim();
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return str.split('T')[0];
  }
  return str;
}

export function UP_AMC_Resco_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upRescoAmcApi.getViewSite();
    if (!res) return [];

    const rawList: any[] = Array.isArray(res.data?.report)
      ? res.data.report
      : Array.isArray(res.data?.reports)
      ? res.data.reports
      : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.report)
      ? res.report
      : Array.isArray(res.reports)
      ? res.reports
      : [];

    return rawList.map((r: any) => {
      const resco = r.resco || {};
      const assignment = r.assignment || {};
      const cleanSiteName = String(r.site_name || resco.site_name || assignment.site_name || `Site #${r.site_id || r.id}`).trim();
      const cleanDistrict = String(r.district || resco.district || assignment.district || '').trim();
      const formattedPeriod = formatPeriodLabel(r.report_month, r.report_year);
      const formattedDate = formatDateDisplay(r.amc_date || resco.amc_date);

      return {
        ...resco,
        ...assignment,
        ...r,
        id: r.id,
        report_id: r.id,
        site_id: r.site_id || resco.id || resco.site_id,
        site_name: cleanSiteName,
        district: cleanDistrict || '—',
        period: formattedPeriod,
        period_numeric: r.report_month && r.report_year ? `${r.report_month}/${r.report_year}` : '—',
        amc_date: formattedDate,
        raw_amc_date: r.amc_date,
        beneficiary_name: String(r.beneficiary_name || resco.contact_person || '—').trim(),
        beneficiary_contact: String(r.beneficiary_contact || resco.contact_number || '—').trim(),
        meter_reading: r.meter_reading ? `${r.meter_reading} kWh` : '—',
        verify_status: r.verify_status ?? resco.verify_status ?? 0,
        amc_status: r.amc_status ?? resco.amc_status ?? 1,
      };
    });
  };

  const parseFirstImage = (val: any): string | null => {
    if (!val) return null;
    try {
      const arr = typeof val === 'string' && (val.startsWith('[') || val.startsWith('{')) ? JSON.parse(val) : val;
      if (Array.isArray(arr) && arr.length > 0) return resolveUpMediaUrl(arr[0]);
    } catch {}
    return typeof val === 'string' ? resolveUpMediaUrl(val) : null;
  };

  const columns = [
    amcTextCol('Site Name', ['site_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Period', ['period', 'period_numeric', 'report_month'], {
      fallback: '—',
    }),
    amcTextCol('AMC Date', ['amc_date']),
    amcTextCol('Beneficiary', ['beneficiary_name']),
    amcTextCol('Contact', ['beneficiary_contact']),
    amcTextCol('Meter Reading', ['meter_reading']),
    amcMediaCol('JMR Report', (r: any) => parseFirstImage(r.jmr_report)),
    amcMediaCol('Signature', (r: any) => parseFirstImage(r.digital_signature)),
    amcMediaCol('Before Cleaning', (r: any) => parseFirstImage(r.before_cleaning_photo)),
    amcMediaCol('After Cleaning', (r: any) => parseFirstImage(r.after_cleaning_photo)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.site_name,
    r.district,
    r.beneficiary_name,
    r.beneficiary_contact,
    r.period,
    r.report_month,
    r.report_year,
    r.meter_reading,
    r.wo_no,
    r.id,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Site Name', value: r.site_name || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Beneficiary Name', value: r.beneficiary_name || '—' },
    { label: 'Beneficiary Contact', value: r.beneficiary_contact || '—' },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Visit Time', value: r.visit_time || '—' },
    { label: 'Meter Reading', value: r.meter_reading || '—' },
    { label: 'Next Due Date', value: r.next_due_date ? formatDateDisplay(r.next_due_date) : '—' },
    { label: 'Period', value: r.period || `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'Work Order No.', value: r.wo_no || '—' },
    { label: 'Sanction Load', value: r.sanction_load ? `${r.sanction_load} kW` : '—' },
    { label: 'Firm Name', value: r.firm_name || '—' },
    { label: 'Inverter Status', value: Number(r.inverter_status) === 1 ? 'Working' : Number(r.inverter_status) === 2 ? 'Defective' : '—' },
    { label: 'Earthing Status', value: Number(r.earthing_status) === 1 ? 'OK' : Number(r.earthing_status) === 2 ? 'Defective' : '—' },
    { label: 'Wiring Status', value: Number(r.wiring_status) === 1 ? 'OK' : Number(r.wiring_status) === 2 ? 'Defective' : '—' },
    { label: 'LA Status', value: Number(r.la_status) === 1 ? 'OK' : Number(r.la_status) === 2 ? 'Defective' : '—' },
    { label: 'RMS Status', value: r.rms_status || '—' },
    { label: 'Raised Complaint', value: Number(r.raised_complaint) === 1 ? `Yes (Ticket #${r.complaint || r.id})` : 'No' },
    { label: 'Reminder Notes', value: r.reminder_notes || '—' },
    { label: 'Remarks', value: r.remark || r.remarks || '—' },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP RESCO — Completed AMC Reports"
      subtitle="View and review all submitted monthly maintenance reports for RESCO sites"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Resco' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up-resco-amc-create-site"
      addLabel="New AMC Report"
      cardTitle="Submitted RESCO AMC Reports"
      searchPlaceholder="Search site, district, beneficiary, contact…"
      loadingText="Loading completed AMC reports…"
      emptyMessage="No completed AMC reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted RESCO Report"
      detailTitle={(r: any) => `${r.site_name || 'Site'} — ${r.period || 'AMC'}`}
      detailFields={detailFields}
      exportName="up_resco_completed_amc"
      exportTitle="UP RESCO Completed AMC Reports"
    />
  );
}

export default UP_AMC_Resco_CompletedAMC;
