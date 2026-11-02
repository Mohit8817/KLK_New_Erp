import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upKusumBAmcApi } from '../../up-services';

export function UP_AMC_KusumB_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upKusumBAmcApi.completedDetails();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns = [
    amcTextCol('Farmer / Beneficiary', ['beneficiary', 'beneficiary_name', 'site_name'], { strong: true }),
    amcTextCol('Father Name', ['father_name']),
    amcTextCol('District', ['district', 'installation_dsitrict']),
    amcTextCol('Village', ['installation_village', 'village']),
    amcTextCol('Contact', ['mobile', 'beneficiary_contact']),
    amcTextCol('Pump Capacity', ['pump_capacity']),
    amcTextCol('Period', ['report_month'], { fallback: '—' }),
    amcTextCol('AMC Date', ['amc_date']),
    amcMediaCol('Maintenance Photo', (r: any) => resolveUpMediaUrl(r.image1)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.beneficiary,
    r.beneficiary_name,
    r.site_name,
    r.district,
    r.installation_dsitrict,
    r.installation_village,
    r.mobile,
    r.pump_capacity,
    r.report_month,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Farmer / Beneficiary', value: r.beneficiary || r.beneficiary_name || '—' },
    { label: 'Father Name', value: r.father_name || '—' },
    { label: 'Contact', value: r.mobile || r.beneficiary_contact || '—' },
    { label: 'District', value: r.district || r.installation_dsitrict || '—' },
    { label: 'Village', value: r.installation_village || '—' },
    { label: 'Pump Capacity', value: r.pump_capacity || '—' },
    { label: 'Period (Month/Year)', value: `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Latitude / Longitude', value: `${r.latitude || '—'}, ${r.longitude || '—'}` },
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
      searchPlaceholder="Search farmer, district, village, contact…"
      loadingText="Loading completed Kusum B AMC reports…"
      emptyMessage="No completed Kusum B reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted Kusum B Report"
      detailTitle={(r: any) => `${r.beneficiary || r.beneficiary_name || 'Farmer'} — Month ${r.report_month}/${r.report_year}`}
      detailFields={detailFields}
      exportName="up_kusumb_completed_amc"
      exportTitle="UP Kusum B Completed AMC Reports"
    />
  );
}

export default UP_AMC_KusumB_CompletedAMC;
