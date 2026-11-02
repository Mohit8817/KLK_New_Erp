import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upOffgridAmcApi } from '../../up-services';

export function UP_AMC_Offgrid_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upOffgridAmcApi.completedDetails();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns = [
    amcTextCol('Beneficiary Name', ['beneficiary_name', 'site_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Plant Capacity', ['plant_capacity']),
    amcTextCol('Work Order', ['work_order_no']),
    amcTextCol('Contractor', ['contractor_name']),
    amcTextCol('Contact', ['beneficiary_contact']),
    amcTextCol('Period', ['report_month'], { fallback: '—' }),
    amcTextCol('AMC Date', ['amc_date']),
    amcMediaCol('Maintenance Photo', (r: any) => resolveUpMediaUrl(r.image1)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.beneficiary_name,
    r.site_name,
    r.district,
    r.plant_capacity,
    r.work_order_no,
    r.contractor_name,
    r.beneficiary_contact,
    r.report_month,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Beneficiary Name', value: r.beneficiary_name || r.site_name || '—' },
    { label: 'Contact', value: r.beneficiary_contact || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Plant Capacity', value: r.plant_capacity || '—' },
    { label: 'Work Order No.', value: r.work_order_no || '—' },
    { label: 'Contractor', value: r.contractor_name || '—' },
    { label: 'Invoice No.', value: r.invoice_no || '—' },
    { label: 'Phase', value: r.phase || '—' },
    { label: 'Period (Month/Year)', value: `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Latitude / Longitude', value: `${r.latitude || '—'}, ${r.longitude || '—'}` },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP Offgrid Solar — Completed AMC Reports"
      subtitle="View all submitted maintenance inspection reports for off-grid solar power systems"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Offgrid' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up/offgrid/amc/assign-site"
      addLabel="New AMC Report"
      cardTitle="Submitted Offgrid Solar AMC Reports"
      searchPlaceholder="Search beneficiary, district, capacity, contact…"
      loadingText="Loading completed Offgrid AMC reports…"
      emptyMessage="No completed Offgrid reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted Offgrid Solar Report"
      detailTitle={(r: any) => `${r.beneficiary_name || 'Beneficiary'} — Month ${r.report_month}/${r.report_year}`}
      detailFields={detailFields}
      exportName="up_offgrid_completed_amc"
      exportTitle="UP Offgrid Completed AMC Reports"
    />
  );
}

export default UP_AMC_Offgrid_CompletedAMC;
