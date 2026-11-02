import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  type DetailField,
} from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_ViewAssignSite() {
  const fetchAssigned = async () => {
    const res = await upRescoAmcApi.getViewAssignSite();
    if (!res.status || !res.data) return [];
    // Data is array of { id, company_id, vendor_id, site_id, resco: { ... } }
    return res.data.map((item: any) => ({
      ...item,
      ...(item.resco || {}),
      assignment_id: item.id,
      id: item.site_id || item.id,
    }));
  };

  const columns = [
    amcTextCol('Site Name', ['site_name', 'name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Department', ['dept_name', 'department']),
    amcTextCol('Address', ['address'], { clamp: true }),
    amcTextCol('Phase', ['phase']),
    amcTextCol('Work Order', ['wo_no']),
    amcTextCol('AMC Date', ['amc_date']),
    amcStatusCol('AMC Status'),
  ];

  const searchFields = (r: any) => [
    r.site_name,
    r.district,
    r.dept_name,
    r.address,
    r.phase,
    r.wo_no,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Site Name', value: r.site_name || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Department', value: r.dept_name || '—' },
    { label: 'Address', value: r.address || '—' },
    { label: 'Phase', value: r.phase || '—' },
    { label: 'Work Order No.', value: r.wo_no || '—' },
    { label: 'Assigned Date', value: r.amc_date || '—' },
    { label: 'Site ID', value: String(r.id || '—') },
  ];

  return (
    <UpAmcTablePage
      title="UP RESCO — View Assigned AMC Sites"
      subtitle="View all solar rooftop sites assigned to your account for AMC"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Resco' },
        { label: 'View Assigned Sites' },
      ]}
      addLink="/v/up-resco-amc-create-site"
      addLabel="Pending AMC"
      cardTitle="Assigned RESCO Sites"
      searchPlaceholder="Search site, district, WO, department…"
      loadingText="Loading assigned RESCO sites…"
      emptyMessage="No AMC sites currently assigned to your vendor account."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned RESCO Site Details"
      detailTitle={(r: any) => r.site_name || `Site #${r.id}`}
      detailFields={detailFields}
      exportName="up_resco_assigned_sites"
      exportTitle="UP RESCO Assigned AMC Sites"
    />
  );
}

export default UP_AMC_Resco_ViewAssignSite;
