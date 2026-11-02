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

const COLUMNS: ComplaintColumn<Row>[] = [
  T('SSL Type', ['ssl_type', 'type'], { fallback: 'SSL 18W' }),
  {
    header: 'Complaint ID',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>{complaintId(r)}</b>,
    exportValue: complaintId,
  },
  T('Complaint Date', ['complaint_date']),
  {
    header: 'Complaint Issue',
    cell: (r) => (
      <span className="ax-badge ax-badge--soft ax-badge--neutral">{pick(r, ['complaint_issue', 'issue'])}</span>
    ),
    exportValue: (r) => pick(r, ['complaint_issue', 'issue']),
  },
  T('Complaint', ['complaint'], { clamp: true }),
  T('Complaint Source', ['complaint_source']),
  T('State', ['state'], { fallback: 'Uttar Pradesh' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Panchayat', ['panchayat']),
  T('Phase', ['phase']),
  T('Address', ['address'], { clamp: true }),
  T('Ward No', ['ward_no']),
  T('Pole No', ['pole_no']),
  T('Light No', ['light_no']),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Contact No', ['contact_no']),
  T('Latitude', ['latitude']),
  T('Longitude', ['longitude']),
  T('Along with Pole', ['along_with_pole']),
  T('Luminary No', ['luminary_no']),
  T('SIM No', ['sim_no']),
  T('Battery Serial No', ['battery_serial_no']),
  T('Module No', ['module_no']),
  T('Date of Installation', ['date_of_installation', 'installation_date']),
  { ...documentCol<Row>(), exportValue: (r) => pick(r, ['document', 'file']) },
  statusCol<Row>(),
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
      searchPlaceholder="Search beneficiary, UID, phone, panchayat…"
      loadingText="Loading SSL complaints…"
      emptyMessage="SSL complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getSslViewComplaints()}
      columns={COLUMNS}
      searchFields={(r) => [
        pick(r, ['complaint_id'], ''),
        pick(r, ['beneficiary_name'], ''),
        pick(r, ['district'], ''),
        pick(r, ['block'], ''),
        pick(r, ['panchayat'], ''),
        pick(r, ['contact_no'], ''),
        pick(r, ['uid_no'], ''),
        pick(r, ['complaint'], ''),
        pick(r, ['complaint_issue', 'issue'], ''),
      ]}
      detailEyebrow="SSL Complaint Details"
      detailFields={(r) => [
        { label: 'Beneficiary', value: pick(r, ['beneficiary_name']) },
        { label: 'Contact No', value: pick(r, ['contact_no']) },
        { label: 'District', value: pick(r, ['district']) },
        { label: 'Block', value: pick(r, ['block']) },
        { label: 'Panchayat', value: pick(r, ['panchayat']) },
        { label: 'Ward No', value: pick(r, ['ward_no']) },
        { label: 'Address', value: pick(r, ['address']) },
        { label: 'Phase', value: pick(r, ['phase']) },
        { label: 'UID No', value: pick(r, ['uid_no']) },
        { label: 'Pole No', value: pick(r, ['pole_no']) },
        { label: 'Light No', value: pick(r, ['light_no']) },
        { label: 'Luminary No', value: pick(r, ['luminary_no']) },
        { label: 'SIM No', value: pick(r, ['sim_no']) },
        { label: 'Battery Serial No', value: pick(r, ['battery_serial_no']) },
        { label: 'Module No', value: pick(r, ['module_no']) },
        { label: 'Installation Date', value: pick(r, ['date_of_installation', 'installation_date']) },
        { label: 'Complaint Date', value: pick(r, ['complaint_date']) },
        { label: 'Complaint Issue', value: pick(r, ['complaint_issue', 'issue']) },
        { label: 'Complaint Source', value: pick(r, ['complaint_source']) },
        { label: 'Status', value: <StatusBadge row={r} /> },
      ]}
      exportName="UP_Vendor_SSL_Complaints"
      exportTitle="UP Vendor SSL Complaints Register"
    />
  );
}

export default UP_Complaint_SSL_ViewComplaint;