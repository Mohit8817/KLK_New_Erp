import {
  upComplaintService,
  type UpSslComplaintItem,
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

type Row = UpSslComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const complaintId = (r: Row) => pick(r, ['complaint_id', 'id']);
const uidVal = (r: Row) => pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id']);

const formatSslType = (r: Row): string => {
  const v = pick(r, ['ssl_type', 'type']);
  if (v === DASH) return DASH;
  const lower = v.toLowerCase();
  if (lower === 'ssl') return 'SSL';
  if (lower === 'upssl18w' || lower === 'ssl18w' || lower === 'ssl 18w') return 'SSL 18W';
  if (lower === 'upssl12w' || lower === 'ssl12w' || lower === 'ssl 12w') return 'SSL 12W';
  return v.toUpperCase();
};

const formatState = (r: Row): string => {
  const s = pick(r, ['state']);
  if (s === DASH) return DASH;
  return s.toLowerCase() === 'up' ? 'Uttar Pradesh' : s;
};

const formatYesNo = (v: string): string => {
  if (v === DASH) return DASH;
  const lower = v.toLowerCase();
  if (lower === 'yes' || lower === '1' || lower === 'true') return 'Yes';
  if (lower === 'no' || lower === '0' || lower === 'false') return 'No';
  return v;
};

const formatDateTime = (v: string): string => {
  if (v === DASH) return DASH;
  if (v.includes('T')) return v.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
  return v;
};

const COLUMNS: ComplaintColumn<Row>[] = [
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
  {
    header: 'SSL Type',
    cell: (r) => formatSslType(r),
    exportValue: formatSslType,
  },
  T('Complaint Type', ['complaint_type']),
  T('Complaint Date', ['start_date', 'complaint_date', 'created_date', 'created_at']),
  {
    header: 'Complaint Issue',
    cell: (r) => {
      const issue = pick(r, ['complaint_issue', 'issue']);
      return issue === DASH ? DASH : <span className="ax-badge ax-badge--soft ax-badge--neutral">{issue}</span>;
    },
    exportValue: (r) => pick(r, ['complaint_issue', 'issue']),
  },
  T('Complaint', ['complaint'], { clamp: true }),
  T('Complaint Source', ['complaint_source', 'source']),
  T('Complaint Raised By', ['complaint_raised_by']),
  T('Vendor', ['vendor']),
  {
    header: 'State',
    cell: (r) => formatState(r),
    exportValue: formatState,
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
  documentCol<Row>(),
  {
    header: 'SMS',
    cell: (r) => formatYesNo(pick(r, ['sms'])),
    exportValue: (r) => formatYesNo(pick(r, ['sms'])),
  },
  T('Assigned To', ['assigned_to']),
  statusCol<Row>(),
  T('Close Date', ['close_date', 'manual_close_date']),
  T('Resolved By', ['resolved_by']),
  T('Remarks', ['remarks'], { clamp: true }),
  T('Created By', ['created_by']),
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
      onDeleteComplaint={(id) => upComplaintService.deleteSslComplaint(id)}
      columns={COLUMNS}
      searchFields={(r) => [
        pick(r, ['complaint_id', 'id'], ''),
        pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id'], ''),
        formatSslType(r),
        pick(r, ['company_id'], ''),
        pick(r, ['complaint_type'], ''),
        pick(r, ['vendor'], ''),
        pick(r, ['beneficiary_name', 'name'], ''),
        pick(r, ['contact_no', 'mobile', 'phone'], ''),
        pick(r, ['district', 'district_name'], ''),
        pick(r, ['block', 'block_name'], ''),
        pick(r, ['panchyat', 'panchayat', 'panchayt', 'gp_name'], ''),
        pick(r, ['ward_no', 'ward'], ''),
        pick(r, ['pole_no', 'pole_number'], ''),
        pick(r, ['light_no', 'light_num'], ''),
        pick(r, ['luminary_no', 'luminary_sr_no', 'luminary_serial_no'], ''),
        pick(r, ['sim_no', 'sim_number'], ''),
        pick(r, ['battery_serial_no', 'battery_no', 'battery_sr_no'], ''),
        pick(r, ['module_no', 'panel_no', 'module_serial_no'], ''),
        pick(r, ['complaint'], ''),
        pick(r, ['complaint_issue', 'issue'], ''),
        pick(r, ['complaint_source', 'source'], ''),
        pick(r, ['complaint_raised_by'], ''),
        pick(r, ['start_date', 'complaint_date', 'created_at'], ''),
        pick(r, ['assigned_to'], ''),
        pick(r, ['resolved_by'], ''),
        pick(r, ['remarks'], ''),
        pick(r, ['created_by'], ''),
      ]}
      detailEyebrow="SSL Complaint Details"
      detailFields={(r) => [
        { label: 'Company ID', value: pick(r, ['company_id']) },
        { label: 'Complaint ID', value: pick(r, ['complaint_id', 'id']) },
        { label: 'UID No', value: pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id']) },
        { label: 'SSL Type', value: formatSslType(r) },
        { label: 'Complaint Type', value: pick(r, ['complaint_type']) },
        { label: 'Complaint Date', value: pick(r, ['start_date', 'complaint_date', 'created_date', 'created_at']) },
        { label: 'Complaint Issue', value: pick(r, ['complaint_issue', 'issue']) },
        { label: 'Complaint Source', value: pick(r, ['complaint_source', 'source']) },
        { label: 'Complaint Raised By', value: pick(r, ['complaint_raised_by']) },
        { label: 'Vendor', value: pick(r, ['vendor']) },
        { label: 'Beneficiary Name', value: pick(r, ['beneficiary_name', 'name']) },
        { label: 'Contact No', value: pick(r, ['contact_no', 'mobile', 'phone']) },
        { label: 'State', value: formatState(r) },
        { label: 'District', value: pick(r, ['district', 'district_name']) },
        { label: 'Block', value: pick(r, ['block', 'block_name']) },
        { label: 'Panchayat', value: pick(r, ['panchyat', 'panchayat', 'panchayt', 'gp_name']) },
        { label: 'Phase', value: pick(r, ['phase']) },
        { label: 'Address', value: pick(r, ['address']) },
        { label: 'Ward No', value: pick(r, ['ward_no', 'ward']) },
        { label: 'Pole No', value: pick(r, ['pole_no', 'pole_number']) },
        { label: 'Light No', value: pick(r, ['light_no', 'light_num']) },
        { label: 'Latitude', value: pick(r, ['latitude']) },
        { label: 'Longitude', value: pick(r, ['longitude']) },
        { label: 'Along with Pole', value: pick(r, ['along_with_pole']) },
        { label: 'Luminary No', value: pick(r, ['luminary_no', 'luminary_sr_no', 'luminary_serial_no']) },
        { label: 'SIM No', value: pick(r, ['sim_no', 'sim_number']) },
        { label: 'Battery Serial No', value: pick(r, ['battery_serial_no', 'battery_no', 'battery_sr_no']) },
        { label: 'Module No', value: pick(r, ['module_no', 'panel_no', 'module_serial_no']) },
        { label: 'Date of Installation', value: pick(r, ['date_of_installation', 'installation_date', 'inst_date']) },
        { label: 'SMS', value: formatYesNo(pick(r, ['sms'])) },
        { label: 'Assigned To', value: pick(r, ['assigned_to']) },
        { label: 'Complaint Status', value: <StatusBadge row={r} /> },
        { label: 'Close Status', value: pick(r, ['close_status']) },
        { label: 'Close Date', value: pick(r, ['close_date']) },
        { label: 'Manual Close Date', value: pick(r, ['manual_close_date']) },
        { label: 'Resolved By', value: pick(r, ['resolved_by']) },
        { label: 'Resolution Mobile', value: pick(r, ['r_mobile']) },
        { label: 'Resolution Email', value: pick(r, ['r_email']) },
        { label: 'Close Beneficiary Name', value: pick(r, ['close_beneficiary_name']) },
        { label: 'Close Beneficiary Contact', value: pick(r, ['close_beneficiary_contact']) },
        { label: 'Close SMS', value: formatYesNo(pick(r, ['close_sms'])) },
        { label: 'Remarks', value: pick(r, ['remarks']) },
        { label: 'Created By', value: pick(r, ['created_by']) },
        { label: 'Created At', value: formatDateTime(pick(r, ['created_at'])) },
      ]}
      exportName="UP_Vendor_SSL_Complaints"
      exportTitle="UP Vendor SSL Complaints Register"
    />
  );
}

export default UP_Complaint_SSL_ViewComplaint;
