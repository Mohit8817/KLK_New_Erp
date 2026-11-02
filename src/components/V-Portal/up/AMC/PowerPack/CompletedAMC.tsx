import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upPowerPackAmcApi } from '../../up-services';

export function UP_AMC_PowerPack_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upPowerPackAmcApi.completedDetails();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns = [
    amcTextCol('Beneficiary Name', ['beneficiary_name', 'site_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Village', ['village']),
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
    r.village,
    r.beneficiary_contact,
    r.report_month,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Beneficiary Name', value: r.beneficiary_name || r.site_name || '—' },
    { label: 'Contact', value: r.beneficiary_contact || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Village', value: r.village || '—' },
    { label: 'Period (Month/Year)', value: `${r.report_month || ''}/${r.report_year || ''}` },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Latitude / Longitude', value: `${r.latitude || '—'}, ${r.longitude || '—'}` },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP Power Pack — Completed AMC Reports"
      subtitle="View all submitted maintenance inspection reports for Solar Power Pack installations"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Power Pack' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up/powerpack/amc/assign-site"
      addLabel="New AMC Report"
      cardTitle="Submitted Power Pack AMC Reports"
      searchPlaceholder="Search beneficiary, district, village, contact…"
      loadingText="Loading completed Power Pack AMC reports…"
      emptyMessage="No completed Power Pack reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted Power Pack Report"
      detailTitle={(r: any) => `${r.beneficiary_name || 'Beneficiary'} — Month ${r.report_month}/${r.report_year}`}
      detailFields={detailFields}
      exportName="up_powerpack_completed_amc"
      exportTitle="UP Power Pack Completed AMC Reports"
    />
  );
}

export default UP_AMC_PowerPack_CompletedAMC;
