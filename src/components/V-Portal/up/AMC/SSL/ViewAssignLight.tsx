import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  type DetailField,
} from '../CommonSharedAMC';
import { upSslAmcApi } from '../../up-services';

export function UP_AMC_SSL_ViewAssignLight() {
  const fetchAssigned = async () => {
    const res = await upSslAmcApi.getViewAssignLight();
    if (!res.status || !Array.isArray(res.data)) return [];

    // Flatten assignments and their lights
    const allRows: any[] = [];
    for (const assign of res.data) {
      if (assign.id) {
        try {
          const det = await upSslAmcApi.getViewAssignLightDetails(assign.id);
          const lights = det?.data?.ssl || [];
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
    amcTextCol('AMC Type', ['amc_type'], {
      fallback: 'Monthly',
    }),
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
      title="UP SSL — Assigned Street Lights"
      subtitle="View all Solar Street Light (SSL) installations assigned to your vendor account for AMC"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL' },
        { label: 'View Assigned Lights' },
      ]}
      addLink="/v/up-ssl-amc-create-light"
      addLabel="Pending AMC"
      cardTitle="Assigned SSL Installations"
      searchPlaceholder="Search beneficiary, district, block, village, contact…"
      loadingText="Loading assigned solar street lights…"
      emptyMessage="No SSL lights currently assigned for AMC."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned SSL Light Details"
      detailTitle={(r: any) => r.beneficiary_name || `SSL Light #${r.id}`}
      detailFields={detailFields}
      exportName="up_ssl_assigned_lights"
      exportTitle="UP SSL Assigned AMC Lights"
    />
  );
}

export default UP_AMC_SSL_ViewAssignLight;
