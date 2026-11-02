import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  type DetailField,
} from '../CommonSharedAMC';
import { upSsl18wAmcApi } from '../../up-services';

export function UP_AMC_SSL18W_ViewAssignLight() {
  const fetchAssigned = async () => {
    const res = await upSsl18wAmcApi.getViewAssignLight();
    if (!res.status || !Array.isArray(res.data)) return [];

    const allRows: any[] = [];
    for (const assign of res.data) {
      if (assign.id) {
        try {
          const det = await upSsl18wAmcApi.getViewAssignLightDetails(assign.id);
          const lights = det?.data?.ssl18w || [];
          if (Array.isArray(lights) && lights.length > 0) {
            lights.forEach((l: any) => {
              allRows.push({
                ...l,
                assignment_id: assign.id,
                vendor_id: assign.vendor_id,
              });
            });
          } else {
            allRows.push(assign);
          }
        } catch {
          allRows.push(assign);
        }
      }
    }
    return allRows.length > 0 ? allRows : res.data;
  };

  const columns = [
    amcTextCol('Beneficiary', ['beneficiary_name', 'name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Block', ['block']),
    amcTextCol('Village', ['village']),
    amcTextCol('Contact', ['contact', 'mobile']),
    amcTextCol('Volume (Nos)', ['volume']),
    amcTextCol('AMC Type', ['amc_type'], { fallback: 'Monthly' }),
    amcTextCol('Assigned Date', ['amc_date']),
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.beneficiary_name,
    r.district,
    r.block,
    r.village,
    r.contact,
    r.volume,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Beneficiary Name', value: r.beneficiary_name || '—' },
    { label: 'Contact', value: r.contact || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Block', value: r.block || '—' },
    { label: 'Village', value: r.village || '—' },
    { label: 'Volume (Lights)', value: r.volume || '—' },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Assignment ID', value: String(r.assignment_id || r.id || '—') },
  ];

  return (
    <UpAmcTablePage
      title="UP SSL 18W — Assigned Street Lights"
      subtitle="View all Solar Street Light (SSL 18W) installations assigned to your account for AMC"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL 18W' },
        { label: 'View Assigned Lights' },
      ]}
      addLink="/v/up-ssl18w-amc-create-light"
      addLabel="Pending AMC"
      cardTitle="Assigned SSL 18W Installations"
      searchPlaceholder="Search beneficiary, district, block, village, contact…"
      loadingText="Loading assigned SSL 18W lights…"
      emptyMessage="No SSL 18W lights currently assigned for AMC."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned SSL 18W Details"
      detailTitle={(r: any) => r.beneficiary_name || `SSL 18W Light #${r.id}`}
      detailFields={detailFields}
      exportName="up_ssl18w_assigned_lights"
      exportTitle="UP SSL 18W Assigned AMC Lights"
    />
  );
}

export default UP_AMC_SSL18W_ViewAssignLight;
