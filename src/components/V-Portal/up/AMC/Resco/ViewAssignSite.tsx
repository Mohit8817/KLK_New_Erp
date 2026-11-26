import {
  UpAmcTablePage,
  amcTextCol,
  amcStatusCol,
  type AmcColumn,
  type DetailField,
} from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';
import { authService, type UserSession } from '../../../../../services/authService';

const cleanText = (val: unknown, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return fallback;
  return s;
};

const formatDate = (val: unknown): string => {
  const s = cleanText(val);
  if (!s) return '';
  return s.split(/[ T]/)[0];
};

const formatAmcType = (val: unknown): string => {
  const raw = cleanText(val);
  if (!raw) return '—';
  const lower = raw.toLowerCase();
  if (lower === 'monthly' || lower === 'm' || lower === '1') return 'Monthly';
  if (lower === 'quarterly' || lower === 'q' || lower === '3') return 'Quarterly';
  if (
    lower === 'half-yearly' ||
    lower === 'half_yearly' ||
    lower === 'halfyearly' ||
    lower === 'h' ||
    lower === '6'
  ) {
    return 'Half-Yearly';
  }
  if (lower === 'yearly' || lower === 'annual' || lower === 'y' || lower === '12') return 'Yearly';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const resolveAssignedTo = (item: any, session: UserSession | null): string => {
  const explicit = cleanText(
    item?.vendor_name ||
      item?.vendor?.name ||
      item?.vendors?.name ||
      item?.assigned_to_name ||
      item?.assigned_to
  );
  if (explicit) return explicit;

  const vid = cleanText(item?.vendor_id ?? item?.resco?.inst_vendor);
  const sessionName = cleanText(session?.name);
  if (
    sessionName &&
    (session?.role === 'vendor' || (vid && cleanText(session?.id) === vid))
  ) {
    return sessionName;
  }
  return vid ? `Vendor #${vid}` : '';
};

export function UP_AMC_Resco_ViewAssignSite() {
  const fetchAssigned = async () => {
    const res = await upRescoAmcApi.getViewAssignSite();
    if (!res || res.status === false) return [];

    const rawList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res)
      ? res
      : [];

    const session = authService.getSession();

    // API returns array of { id, company_id, project, state, district, site_id, site_name,
    // vendor_id, assigned_by, assign_date, amc_type, start_date, status, remarks, resco: { ... } }
    return rawList.map((item: any) => {
      const resco = item?.resco && typeof item.resco === 'object' ? item.resco : {};
      const stateRaw = cleanText(item.state ?? resco.state);
      const district = cleanText(item.district ?? resco.district);
      const dept_name = cleanText(resco.dept_name ?? item.dept_name ?? resco.department);
      const site_name = cleanText(item.site_name ?? resco.site_name);
      const location = cleanText(resco.location ?? resco.address ?? item.location ?? item.address);
      const firm_name = cleanText(resco.firm_name ?? item.firm_name);
      const ca_no = cleanText(resco.ca_no ?? item.ca_no);
      const sanction_load = cleanText(resco.sanction_load ?? item.sanction_load);
      const plant_sc = cleanText(resco.plant_sc ?? item.plant_sc);
      const wo_no = cleanText(resco.wo_no ?? item.wo_no);
      const phase = cleanText(resco.phase ?? item.phase);
      const amc_type = cleanText(item.amc_type ?? resco.amc_type);
      const amc_date = formatDate(resco.amc_date ?? item.start_date ?? item.assign_date);
      const assign_date = formatDate(item.assign_date ?? item.start_date ?? item.created_at);
      const assigned_to = resolveAssignedTo(item, session);

      return {
        ...resco,
        ...item,
        resco,
        assignment_id: item.id,
        id: item.site_id || resco.id || item.id,
        site_id: item.site_id || resco.id,
        amc_type,
        amc_date,
        state: stateRaw ? stateRaw.toUpperCase() : '',
        district,
        dept_name,
        site_name,
        location,
        address: location,
        firm_name,
        ca_no,
        sanction_load,
        plant_sc,
        wo_no,
        phase,
        assign_date,
        assigned_to,
        amc_status: resco.amc_status ?? item.status,
        status: item.status ?? resco.amc_status,
        remark: cleanText(item.remarks ?? resco.inst_remarks),
      };
    });
  };

  const columns: AmcColumn<any>[] = [
    {
      header: 'Amc Type',
      cell: (r: any) => {
        const label = formatAmcType(r.amc_type);
        return label === '—' ? (
          '—'
        ) : (
          <span className="ax-badge ax-badge--soft ax-badge--primary">{label}</span>
        );
      },
      exportValue: (r: any) => formatAmcType(r.amc_type),
    },
    amcTextCol('Amc Date', ['amc_date']),
    amcTextCol('State', ['state']),
    amcTextCol('District', ['district']),
    amcTextCol('Dept Name', ['dept_name', 'department']),
    amcTextCol('Site Name', ['site_name', 'name'], { strong: true }),
    amcTextCol('Location', ['location', 'address'], { clamp: true }),
    amcTextCol('Firm Name', ['firm_name']),
    amcTextCol('CA No', ['ca_no']),
    amcTextCol('Sanction Load', ['sanction_load']),
    amcTextCol('Plant SC', ['plant_sc']),
    amcTextCol('WO No', ['wo_no']),
    amcTextCol('Phase', ['phase']),
    amcTextCol('Assigned Date', ['assign_date', 'start_date']),
    amcTextCol('Assigned To', ['assigned_to']),
    amcStatusCol('AMC Status'),
  ];

  const searchFields = (r: any) => [
    r.amc_type,
    r.amc_date,
    r.state,
    r.district,
    r.dept_name,
    r.site_name,
    r.location,
    r.address,
    r.firm_name,
    r.ca_no,
    r.sanction_load,
    r.plant_sc,
    r.wo_no,
    r.phase,
    r.assign_date,
    r.assigned_to,
    r.vendor_id,
    r.site_id,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Amc Type', value: formatAmcType(r.amc_type) },
    { label: 'Amc Date', value: r.amc_date || '—' },
    { label: 'State', value: r.state || '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Dept Name', value: r.dept_name || '—' },
    { label: 'Site Name', value: r.site_name || '—' },
    { label: 'Location', value: r.location || r.address || '—' },
    { label: 'Firm Name', value: r.firm_name || '—' },
    { label: 'CA No', value: r.ca_no || '—' },
    { label: 'Sanction Load', value: r.sanction_load || '—' },
    { label: 'Plant SC', value: r.plant_sc || '—' },
    { label: 'WO No', value: r.wo_no || '—' },
    { label: 'Phase', value: r.phase || '—' },
    { label: 'Assigned Date', value: r.assign_date || '—' },
    { label: 'Assigned To', value: r.assigned_to || '—' },
    { label: 'Contact Person', value: cleanText(r.contact_person, '—') },
    { label: 'Contact Number', value: cleanText(r.contact_number, '—') },
    { label: 'Site ID', value: String(r.site_id || r.id || '—') },
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
      searchPlaceholder="Search site, district, dept, firm, CA, WO…"
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
