import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upKusumCAmcApi } from '../../up-services';

export function UP_AMC_KusumC_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upKusumCAmcApi.completedDetails();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns = [
    amcTextCol('Farmer Name', ['f_farmer_name', 'beneficiary_name', 'site_name'], { strong: true }),
    amcTextCol('Father Name', ['f_father_name', 'father_name']),
    amcTextCol('District', ['district', 'f_district']),
    amcTextCol('Village', ['f_village', 'village']),
    amcTextCol('Contact', ['beneficiary_contact', 'f_contact']),
    amcTextCol('Pump Capacity', ['pump_capacity']),
    amcTextCol('Period', ['report_month'], {
      fallback: '—',
    }),
    amcTextCol('AMC Date', ['amc_date']),
    amcMediaCol('Maintenance Photo', (r: any) => resolveUpMediaUrl(r.image1)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.f_farmer_name,
    r.beneficiary_name,
    r.site_name,
    r.district,
    r.f_district,
    r.f_village,
    r.beneficiary_contact,
    r.pump_capacity,
    r.report_month,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Farmer Name', value: r.f_farmer_name || r.beneficiary_name || '—' },
    { label: 'Father Name', value: r.f_father_name || '—' },
    { label: 'Contact', value: r.beneficiary_contact || r.f_contact || '—' },
    { label: 'District', value: r.district || r.f_district || '—' },
    { label: 'Village', value: r.f_village || '—' },
    { label: 'Pump Capacity', value: r.pump_capacity || '—' },
    { label: 'Period (Month/Year)', value: `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Latitude / Longitude', value: `${r.latitude || '—'}, ${r.longitude || '—'}` },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP Kusum C — Completed AMC Reports"
      subtitle="View all submitted maintenance inspection reports for PM Kusum Component-C solar pumps"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum C' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up/kusumc/amc/assign-site"
      addLabel="New AMC Report"
      cardTitle="Submitted Kusum C AMC Reports"
      searchPlaceholder="Search farmer, district, village, contact…"
      loadingText="Loading completed Kusum C AMC reports…"
      emptyMessage="No completed Kusum C reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted Kusum C Report"
      detailTitle={(r: any) => `${r.f_farmer_name || r.beneficiary_name || 'Farmer'} — Month ${r.report_month}/${r.report_year}`}
      detailFields={detailFields}
      exportName="up_kusumc_completed_amc"
      exportTitle="UP Kusum C Completed AMC Reports"
    />
  );
}

export default UP_AMC_KusumC_CompletedAMC;
