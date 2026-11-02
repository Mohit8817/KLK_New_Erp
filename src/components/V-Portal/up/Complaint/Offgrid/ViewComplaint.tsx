import {
  upComplaintService,
  type UpOffgridComplaintItem,
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

const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) =>
  textCol<UpOffgridComplaintItem>(h, keys, o);

const COLUMNS: ComplaintColumn<UpOffgridComplaintItem>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Contact Number', ['contact_number', 'contact_no']),
  T('Plant Capacity', ['plant_capacity'], { strong: true }),
  T('Work Order No.', ['wo_no', 'work_order_no']),
  T('Work Order Date', ['wo_date', 'work_order_date']),
  T('Contractor Name', ['contractor_name']),
  documentCol<UpOffgridComplaintItem>(),
  T('Assigned Date', ['assigned_date']),
  statusCol<UpOffgridComplaintItem>(),
  T('Created By', ['created_by']),
];

export function UPComplaintOffgridView() {
  return (
    <ComplaintViewPage<UpOffgridComplaintItem>
      title="View UP OFF Grid Complaints"
      subtitle="Manage and resolve off-grid solar plant customer breakdown tickets"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Off Grid' },
      ]}
      addLink="/v/complaint/up/offgrid-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor UP Offgrid Complaints"
      searchPlaceholder="Search ID, name, contact, work order…"
      loadingText="Loading Off Grid complaints…"
      emptyMessage="Off Grid complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getOffgridViewComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['contact_number', 'contact_no'], ''),
        pick(c, ['wo_no', 'work_order_no'], ''),
        pick(c, ['plant_capacity'], ''),
        pick(c, ['contractor_name'], ''),
        pick(c, ['complaint'], ''),
      ]}
      detailEyebrow="Off Grid Solar Plant Complaint"
      detailFields={(c) => [
        { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_number', 'contact_no']) },
        { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'Plant Capacity', value: pick(c, ['plant_capacity']) },
        {
          label: 'Work Order No. / Date',
          value: `${pick(c, ['wo_no', 'work_order_no'])} (${pick(c, ['wo_date', 'work_order_date'])})`,
        },
        { label: 'Contractor Name', value: pick(c, ['contractor_name']) },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
        { label: 'Created By', value: pick(c, ['created_by']) },
      ]}
      exportName="UP_Offgrid_Complaints"
      exportTitle="UP Off Grid Complaints"
    />
  );
}

export default UPComplaintOffgridView;