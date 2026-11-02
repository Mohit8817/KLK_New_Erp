import {
  upComplaintService,
  type UpOngridComplaintItem,
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

type Row = UpOngridComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Contact Number', ['contact_number', 'contact_no']),
  T('Work Order No.', ['work_order_no']),
  T('Work Order Date', ['work_order_date']),
  T('Plant Capacity', ['plant_capacity'], { strong: true }),
  T('Contractor Name', ['contractor_name']),
  T('Contractor Number', ['contractor_number', 'contractor_no']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
  statusCol<Row>(),
  T('Created By', ['created_by']),
];

export function UPComplaintOngridView() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP On Grid Complaints"
      subtitle="Manage and resolve grid-tied solar plant customer issues"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'On Grid' },
      ]}
      addLink="/v/complaint/up/ongrid-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor UP On Grid Complaints"
      searchPlaceholder="Search ID, name, contact, work order…"
      loadingText="Loading On Grid complaints…"
      emptyMessage="On Grid complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getOngridViewComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['contact_number', 'contact_no'], ''),
        pick(c, ['work_order_no'], ''),
        pick(c, ['plant_capacity'], ''),
        pick(c, ['complaint'], ''),
      ]}
      detailEyebrow="On Grid Solar Plant Complaint"
      detailFields={(c) => [
        { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_number', 'contact_no']) },
        { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'Work Order No.', value: pick(c, ['work_order_no']) },
        { label: 'Work Order Date', value: pick(c, ['work_order_date']) },
        { label: 'Plant Capacity', value: pick(c, ['plant_capacity']) },
        {
          label: 'Contractor Name / Number',
          value: `${pick(c, ['contractor_name'])}${
            pick(c, ['contractor_number', 'contractor_no'], '') ? ` (${pick(c, ['contractor_number', 'contractor_no'])})` : ''
          }`,
        },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
      ]}
      exportName="UP_Ongrid_Complaints"
      exportTitle="UP On Grid Complaints"
    />
  );
}

export default UPComplaintOngridView;