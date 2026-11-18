import {
  upComplaintService,
  type UpSslComplaintItem,
} from '../../up-services';
import {
  ComplaintViewPage,
  StatusBadge,
  documentCol,
  pick,
  statusCol,
  textCol,
  type ComplaintColumn,
} from '../CommonSharedComplaints/ViewComplaints';

type Row = UpSslComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const complaintId = (r: Row) => pick(r, ['complaint_id'], `CMP-${(r as any).id}`);
const uidVal = (r: Row) => pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id']);

const COLUMNS: ComplaintColumn<Row>[] = [
  {
    header: 'SSL Type',
    cell: (r) => {
      const v = pick(r, ['ssl_type', 'type'], 'SSL 18W');
      return String(v).trim().toLowerCase() === 'ssl' ? 'SSL 18W' : v;
    },
    exportValue: (r) => {
      const v = pick(r, ['ssl_type', 'type'], 'SSL 18W');
      return String(v).trim().toLowerCase() === 'ssl' ? 'SSL 18W' : v;
    },
  },
  {
    header: 'Complaint ID',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>{complaintId(r)}</b>,
    exportValue: complaintId,
  },
  {
    header: 'UID No',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>{uidVal(r)}</b>,
    exportValue: uidVal,
  },
  T('Complaint Date', ['start_date', 'complaint_date', 'created_at', 'created_date']),
  {
    header: 'Complaint Issue',
    cell: (r) => {
      const issue = pick(r, ['complaint_issue', 'issue', 'complaint_type'], 'General Issue');
      return <span className="ax-badge ax-badge--soft ax-badge--neutral">{issue}</span>;
    },
    exportValue: (r) => pick(r, ['complaint_issue', 'issue', 'complaint_type'], 'General Issue'),
  },
  T('Complaint', ['complaint', 'remarks'], { clamp: true }),
  T('Complaint Source', ['complaint_source', 'source'], { fallback: 'Portal' }),
  {
    header: 'State',
    cell: (r) => {
      const s = pick(r, ['state'], 'Uttar Pradesh');
      return String(s).toLowerCase() === 'up' ? 'Uttar Pradesh' : s;
    },
    exportValue: (r) => {
      const s = pick(r, ['state'], 'Uttar Pradesh');
      return String(s).toLowerCase() === 'up' ? 'Uttar Pradesh' : s;
    },
  },
  T('District', ['district', 'district_name'], { strong: true }),
  T('Block', ['block', 'block_name']),
  T('Panchayat', ['panchyat', 'panchayat', 'panchayt', 'gp_name']),
  T('Phase', ['phase']),
  T('Address', ['address'], { clamp: true }),
  T('Ward No', ['ward_no', 'ward']),
  T('Pole No', ['pole_no', 'pole_number']),
  T('Light No', ['light_no', 'light_num']),
  T('Beneficiary Name', ['beneficiary_name', 'name'], { strong: true }),
  T('Contact No', ['contact_no', 'mobile', 'phone']),
  T('Latitude', ['latitude']),
  T('Longitude', ['longitude']),
  T('Along with Pole', ['along_with_pole']),
  T('Luminary No', ['luminary_no', 'luminary_sr_no', 'luminary_serial_no']),
  T('SIM No', ['sim_no', 'sim_number']),
  T('Battery Serial No', ['battery_serial_no', 'battery_no', 'battery_sr_no']),
  T('Module No', ['module_no', 'panel_no', 'module_serial_no']),
  T('Date of Installation', ['date_of_installation', 'installation_date', 'inst_date']),
  { ...documentCol<Row>(), exportValue: (r) => pick(r, ['file', 'document', 'r_file', 'r_file2']) },
  statusCol<Row>(),
  T('Created By', ['created_by', 'complaint_raised_by']),
];

export function UP_Complaint_SSL_ViewComplaint() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP SSL Complaints"
      subtitle="Complete record of Uttar Pradesh Solar Street Light complaints and operational breakdown"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'SSL' },
      ]}
      addLink="/v/complaint/up/ssl-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor UP SSL Complaint Data"
      searchPlaceholder="Search beneficiary, UID, complaint ID, phone, panchayat…"
      loadingText="Loading SSL complaints…"
      emptyMessage="SSL complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getSslViewComplaints()}
      columns={COLUMNS}
      searchFields={(r) => [
        pick(r, ['complaint_id', 'id'], ''),
        pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id'], ''),
        pick(r, ['beneficiary_name', 'name'], ''),
        pick(r, ['contact_no', 'mobile', 'phone'], ''),
        pick(r, ['district', 'district_name'], ''),
        pick(r, ['block', 'block_name'], ''),
        pick(r, ['panchyat', 'panchayat', 'panchayt', 'gp_name'], ''),
        pick(r, ['ward_no', 'ward'], ''),
        pick(r, ['pole_no'], ''),
        pick(r, ['light_no'], ''),
        pick(r, ['luminary_no'], ''),
        pick(r, ['sim_no'], ''),
        pick(r, ['battery_serial_no', 'battery_no'], ''),
        pick(r, ['module_no', 'panel_no'], ''),
        pick(r, ['complaint'], ''),
        pick(r, ['complaint_issue', 'issue', 'complaint_type'], ''),
        pick(r, ['start_date', 'complaint_date', 'created_at'], ''),
      ]}
      detailEyebrow="SSL Complaint Details"
      detailFields={(r) => [
        { label: 'UID No', value: pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id']) },
        { label: 'Complaint ID', value: pick(r, ['complaint_id', 'id']) },
        { label: 'Complaint Date', value: pick(r, ['start_date', 'complaint_date', 'created_at']) },
        { label: 'Beneficiary Name', value: pick(r, ['beneficiary_name', 'name']) },
        { label: 'Contact No', value: pick(r, ['contact_no', 'mobile', 'phone']) },
        { label: 'State', value: String(pick(r, ['state'], 'Uttar Pradesh')).toLowerCase() === 'up' ? 'Uttar Pradesh' : pick(r, ['state'], 'Uttar Pradesh') },
        { label: 'District', value: pick(r, ['district', 'district_name']) },
        { label: 'Block', value: pick(r, ['block', 'block_name']) },
        { label: 'Panchayat', value: pick(r, ['panchyat', 'panchayat', 'panchayt', 'gp_name']) },
        { label: 'Ward No', value: pick(r, ['ward_no', 'ward']) },
        { label: 'Address', value: pick(r, ['address']) },
        { label: 'Phase', value: pick(r, ['phase']) },
        { label: 'Pole No', value: pick(r, ['pole_no', 'pole_number']) },
        { label: 'Light No', value: pick(r, ['light_no', 'light_num']) },
        { label: 'Luminary No', value: pick(r, ['luminary_no', 'luminary_serial_no']) },
        { label: 'SIM No', value: pick(r, ['sim_no', 'sim_number']) },
        { label: 'Battery Serial No', value: pick(r, ['battery_serial_no', 'battery_no']) },
        { label: 'Module No', value: pick(r, ['module_no', 'panel_no']) },
        { label: 'Installation Date', value: pick(r, ['date_of_installation', 'installation_date', 'inst_date']) },
        {
          label: 'Latitude / Longitude',
          value: r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : (r.latitude || r.longitude || '—'),
        },
        { label: 'Along with Pole', value: pick(r, ['along_with_pole']) },
        { label: 'Complaint Issue', value: pick(r, ['complaint_issue', 'issue', 'complaint_type'], 'General Issue') },
        { label: 'Complaint Source', value: pick(r, ['complaint_source', 'source'], 'Portal') },
        { label: 'Complaint Raised By', value: pick(r, ['complaint_raised_by', 'created_by']) },
        { label: 'Status', value: <StatusBadge row={r} /> },
        { label: 'Close Date', value: pick(r, ['close_date', 'manual_close_date']) },
        { label: 'Resolved By', value: pick(r, ['resolved_by']) },
        { label: 'Resolution Mobile', value: pick(r, ['r_mobile']) },
        { label: 'Resolution Email', value: pick(r, ['r_email']) },
        { label: 'Close Beneficiary', value: pick(r, ['close_beneficiary_name']) },
        { label: 'Close Contact', value: pick(r, ['close_beneficiary_contact']) },
        { label: 'Remarks', value: pick(r, ['remarks']) },
      ]}
      exportName="UP_Vendor_SSL_Complaints"
      exportTitle="UP Vendor SSL Complaints Register"
    />
  );
}

export default UP_Complaint_SSL_ViewComplaint;
