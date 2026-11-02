import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upRescoAmcApi.getViewSite();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data.map((r: any) => ({
      ...r,
      ...(r.resco || {}),
      id: r.id,
      site_id: r.site_id || r.resco?.id,
    }));
  };

  const parseFirstImage = (val: any): string | null => {
    if (!val) return null;
    try {
      const arr = typeof val === 'string' ? JSON.parse(val) : val;
      if (Array.isArray(arr) && arr.length > 0) return resolveUpMediaUrl(arr[0]);
    } catch {}
    return typeof val === 'string' ? resolveUpMediaUrl(val) : null;
  };

  const columns = [
    amcTextCol('Site Name', ['site_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Period', ['period', 'report_month'], {
      fallback: '—',
    }),
    amcTextCol('AMC Date', ['amc_date']),
    amcTextCol('Beneficiary', ['beneficiary_name']),
    amcTextCol('Contact', ['beneficiary_contact']),
    amcTextCol('Meter Reading', ['meter_reading']),
    amcMediaCol('Before Cleaning', (r: any) => parseFirstImage(r.before_cleaning_photo)),
    amcMediaCol('After Cleaning', (r: any) => parseFirstImage(r.after_cleaning_photo)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.site_name,
    r.district,
    r.beneficiary_name,
    r.beneficiary_contact,
    r.report_month,
    r.report_year,
    r.wo_no,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Site Name', value: r.site_name || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Beneficiary Name', value: r.beneficiary_name || '—' },
    { label: 'Beneficiary Contact', value: r.beneficiary_contact || '—' },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Visit Time', value: r.visit_time || '—' },
    { label: 'Meter Reading (kWh)', value: r.meter_reading || '—' },
    { label: 'Next Due Date', value: r.next_due_date || '—' },
    { label: 'Period', value: `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'Work Order', value: r.wo_no || '—' },
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
      detailTitle={(r: any) => `${r.site_name || 'Site'} — Month ${r.report_month}/${r.report_year}`}
      detailFields={detailFields}
      exportName="up_resco_completed_amc"
      exportTitle="UP RESCO Completed AMC Reports"
    />
  );
}

export default UP_AMC_Resco_CompletedAMC;
