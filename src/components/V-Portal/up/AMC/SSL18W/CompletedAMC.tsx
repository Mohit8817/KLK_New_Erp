import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  amcMediaCol,
  type DetailField,
  resolveUpMediaUrl,
} from '../CommonSharedAMC';
import { upSsl18wAmcApi } from '../../up-services';

export function UP_AMC_SSL18W_CompletedAMC() {
  const fetchCompleted = async () => {
    const res = await upSsl18wAmcApi.getViewLight();
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns = [
    amcTextCol('Beneficiary', ['beneficiary_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Block', ['block']),
    amcTextCol('Village', ['village']),
    amcTextCol('Contact', ['beneficiary_contact']),
    amcTextCol('Period', ['month_year']),
    amcTextCol('AMC Date', ['date']),
    amcMediaCol('Maintenance Photo', (r: any) => resolveUpMediaUrl(r.image1)),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.beneficiary_name,
    r.district,
    r.block,
    r.village,
    r.beneficiary_contact,
    r.month_year,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Beneficiary Name', value: r.beneficiary_name || '—' },
    { label: 'Beneficiary Contact', value: r.beneficiary_contact || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Block', value: r.block || '—' },
    { label: 'Village', value: r.village || '—' },
    { label: 'Period (MM-YYYY)', value: r.month_year || '—' },
    { label: 'Maintenance Date', value: r.date || '—' },
    { label: 'Latitude / Longitude', value: `${r.latitude || '—'}, ${r.longitude || '—'}` },
    { label: 'Report ID', value: `#${r.id}` },
  ];

  return (
    <UpAmcTablePage
      title="UP SSL 18W — Completed AMC Reports"
      subtitle="View all submitted maintenance inspection reports for SSL 18W installations"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL 18W' },
        { label: 'Completed AMC' },
      ]}
      addLink="/v/up-ssl18w-amc-create-light"
      addLabel="New AMC Report"
      cardTitle="Submitted SSL 18W AMC Reports"
      searchPlaceholder="Search beneficiary, district, village, contact…"
      loadingText="Loading completed SSL 18W AMC reports…"
      emptyMessage="No completed SSL 18W reports found."
      fetchData={fetchCompleted}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Submitted SSL 18W Report Details"
      detailTitle={(r: any) => `${r.beneficiary_name || 'SSL 18W Site'} — ${r.month_year || ''}`}
      detailFields={detailFields}
      exportName="up_ssl18w_completed_amc"
      exportTitle="UP SSL 18W Completed AMC Reports"
    />
  );
}

export default UP_AMC_SSL18W_CompletedAMC;
