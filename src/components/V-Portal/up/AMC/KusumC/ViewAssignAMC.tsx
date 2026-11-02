import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  type DetailField,
} from '../CommonSharedAMC';
import { upKusumCAmcApi } from '../../up-services';

export function UP_AMC_KusumC_ViewAssignAMC() {
  const fetchAssigned = async () => {
    const res = await upKusumCAmcApi.fetchViewAssignSite();
    if (!res.status || !Array.isArray(res.data)) return [];

    const rows: any[] = [];
    res.data.forEach((assign: any) => {
      if (Array.isArray(assign.reports) && assign.reports.length > 0) {
        assign.reports.forEach((rep: any) => {
          rows.push({
            ...rep,
            assignment_id: assign.id,
            amc_date: rep.amc_date || assign.amc_date,
          });
        });
      } else {
        rows.push(assign);
      }
    });
    return rows.length > 0 ? rows : res.data;
  };

  const columns = [
    amcTextCol('Farmer / Beneficiary', ['beneficiary_name', 'site_name', 'farmer_name'], { strong: true }),
    amcTextCol('District', ['district']),
    amcTextCol('Contact', ['beneficiary_contact', 'mobile']),
    amcTextCol('AMC Type', ['amc_type'], { fallback: 'Monthly' }),
    amcTextCol('Assigned Date', ['amc_date']),
    amcStatusCol('AMC Status'),
  ];

  const searchFields = (r: any) => [
    r.beneficiary_name,
    r.site_name,
    r.district,
    r.beneficiary_contact,
    r.amc_type,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Farmer Name', value: r.beneficiary_name || r.site_name || '—' },
    { label: 'Contact', value: r.beneficiary_contact || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'AMC Frequency', value: r.amc_type === 'M' ? 'Monthly' : r.amc_type || '—' },
    { label: 'AMC Date', value: r.amc_date || '—' },
    { label: 'Site ID', value: String(r.site_id || r.id || '—') },
    { label: 'Assignment ID', value: String(r.assignment_id || '—') },
  ];

  return (
    <UpAmcTablePage
      title="UP Kusum C — Assigned AMC Sites"
      subtitle="View all Solar Agriculture Pump sites assigned under PM Kusum Component-C"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum C' },
        { label: 'View Assigned AMC' },
      ]}
      addLink="/v/up/kusumc/amc/assign-site"
      addLabel="Pending AMC"
      cardTitle="Assigned Kusum C Pump Sites"
      searchPlaceholder="Search farmer, district, contact, AMC type…"
      loadingText="Loading assigned Kusum C sites…"
      emptyMessage="No Kusum C sites currently assigned for AMC."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned Kusum C Site Details"
      detailTitle={(r: any) => r.beneficiary_name || r.site_name || `Site #${r.site_id || r.id}`}
      detailFields={detailFields}
      exportName="up_kusumc_assigned_sites"
      exportTitle="UP Kusum C Assigned AMC Sites"
    />
  );
}

export default UP_AMC_KusumC_ViewAssignAMC;
