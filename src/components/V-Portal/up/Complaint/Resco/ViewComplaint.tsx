import {
  upComplaintService,
  type UpRescoComplaintItem,
} from '../../up-services';
import {
  ComplaintViewPage,
  DASH,
  StatusBadge,
  documentCol,
  pick,
  statusCol,
  textCol,
  type ComplaintColumn,
} from '../CommonSharedComplaints/ViewComplaints';

type Row = UpRescoComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const complaintId = (r: Row) => pick(r, ['complaint_id'], `CMP-${(r as any).id}`);
const kw = (r: Row, keys: string[]) => {
  const v = pick(r, keys);
  return v === DASH ? DASH : `${v} kW`;
};

const COLUMNS: ComplaintColumn<Row>[] = [
  {
    header: 'Complaint ID',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>{complaintId(r)}</b>,
    exportValue: complaintId,
  },
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'Uttar Pradesh' }),
  T('District', ['district'], { strong: true }),
  T('Dept Name', ['dept_name', 'department']),
  T('Site Name', ['site_name'], { strong: true }),
  T('Address', ['address'], { clamp: true }),
  T('CA No', ['ca_no']),
  { header: 'Sanction Load', cell: (r) => kw(r, ['sanction_load']), exportValue: (r) => kw(r, ['sanction_load']) },
  { header: 'Plant SC', cell: (r) => kw(r, ['plant_sc', 'plant_capacity']), exportValue: (r) => kw(r, ['plant_sc', 'plant_capacity']) },
  T('Contact Person', ['contact_person']),
  T('Contact Number', ['contact_number', 'contact_no']),
  T('Inverter No', ['inverter_no']),
  T('Solarmeter No', ['solarmeter_no', 'solar_meter_no']),
  T('NM SM NO', ['nm_sm_no']),
  T('Loger No', ['loger_no', 'logger_no']),
  T('Panel No', ['panel_no']),
  T('WO No', ['wo_no']),
  T('Phase', ['phase']),
  { ...documentCol<Row>(), exportValue: (r) => pick(r, ['document', 'file', 'file1']) },
  statusCol<Row>(),
  T('Created By', ['created_by']),
];

export function UP_Complaint_Resco_ViewComplaint() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP Resco Complaints"
      subtitle="Comprehensive listing of all filed solar rooftop complaints and real-time status"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Resco' },
      ]}
      addLink="/v/complaint/up/resco-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor Resco Complaint Data"
      searchPlaceholder="Search complaint, site, CA no, phone…"
      loadingText="Loading Resco complaints…"
      emptyMessage="Resco complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getRescoViewComplaints()}
      columns={COLUMNS}
      searchFields={(r) => [
        pick(r, ['complaint_id'], ''),
        pick(r, ['site_name'], ''),
        pick(r, ['district'], ''),
        pick(r, ['contact_number', 'contact_no'], ''),
        pick(r, ['contact_person'], ''),
        pick(r, ['complaint'], ''),
        pick(r, ['ca_no'], ''),
      ]}
      detailEyebrow="Resco Complaint Details"
      detailFields={(r) => [
        { label: 'Site Name', value: pick(r, ['site_name']) },
        { label: 'District', value: pick(r, ['district']) },
        { label: 'Department', value: pick(r, ['dept_name', 'department']) },
        { label: 'Address', value: pick(r, ['address']) },
        { label: 'Contact Person', value: pick(r, ['contact_person']) },
        { label: 'Contact Number', value: pick(r, ['contact_number', 'contact_no']) },
        { label: 'CA Number', value: pick(r, ['ca_no']) },
        { label: 'Sanction Load', value: pick(r, ['sanction_load']) },
        { label: 'Plant Capacity', value: pick(r, ['plant_sc', 'plant_capacity']) },
        { label: 'Inverter No', value: pick(r, ['inverter_no']) },
        { label: 'Solar Meter No', value: pick(r, ['solarmeter_no', 'solar_meter_no']) },
        { label: 'NM/SM No', value: pick(r, ['nm_sm_no']) },
        { label: 'Logger No', value: pick(r, ['loger_no', 'logger_no']) },
        { label: 'Panel No', value: pick(r, ['panel_no']) },
        { label: 'Work Order No', value: pick(r, ['wo_no']) },
        { label: 'Phase', value: pick(r, ['phase']) },
        { label: 'Complaint Date', value: pick(r, ['complaint_date']) },
        { label: 'Status', value: <StatusBadge row={r} /> },
      ]}
      exportName="UP_Vendor_Resco_Complaints"
      exportTitle="UP Vendor Resco Complaints Register"
    />
  );
}

export default UP_Complaint_Resco_ViewComplaint;