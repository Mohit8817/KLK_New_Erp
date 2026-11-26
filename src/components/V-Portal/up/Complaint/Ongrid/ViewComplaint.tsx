import {
  upComplaintService,
  type UpOngridComplaintItem,
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

type Row = UpOngridComplaintItem;

const formatDate = (val?: string | null): string => {
  if (!val || val === 'null' || val === 'undefined') return DASH;
  const str = String(val).trim();
  if (!str) return DASH;
  if (str.includes('T')) return str.split('T')[0];
  return str;
};

const dateCol = (header: string, keys: string[]): ComplaintColumn<Row> => ({
  header,
  cell: (r) => formatDate(pick(r, keys)),
  exportValue: (r) => formatDate(pick(r, keys)),
});

const stateCol = (): ComplaintColumn<Row> => ({
  header: 'State',
  cell: (r) => {
    const s = pick(r, ['state'], 'UP');
    return s.toLowerCase() === 'up' ? 'UP' : s;
  },
  exportValue: (r) => {
    const s = pick(r, ['state'], 'UP');
    return s.toLowerCase() === 'up' ? 'UP' : s;
  },
});

const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('OGID', ['ogid', 'og_id'], { strong: true }),
  dateCol('Complaint Date', ['created_date', 'complaint_date', 'created_at']),
  T('Complaint', ['complaint'], { clamp: true }),
  stateCol(),
  T('District', ['district'], { strong: true }),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Contact Number', ['contact_no', 'contact_number']),
  T('Work Order No.', ['wo_no', 'work_order_no']),
  dateCol('Work Order Date', ['wo_date', 'work_order_date']),
  T('Plant Capacity', ['plant_capacity', 'capacity'], { strong: true }),
  T('Firm Name', ['firm_name', 'firm']),
  T('Contractor Name', ['contractor_name']),
  T('Contractor Number', ['contractor_number', 'contractor_no', 'contractor_mo_no']),
  documentCol<Row>(),
  dateCol('Assigned Date', ['assigned_date']),
  statusCol<Row>(),
  dateCol('Close Date', ['close_complaint_date', 'manual_close_date', 'close_date']),
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
      searchPlaceholder="Search ID, OGID, name, contact, work order…"
      loadingText="Loading On Grid complaints…"
      emptyMessage="On Grid complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getOngridViewComplaints()}
      onDeleteComplaint={(id) => upComplaintService.deleteOngridComplaint(id)}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['ogid', 'og_id'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['contact_no', 'contact_number'], ''),
        pick(c, ['wo_no', 'work_order_no'], ''),
        pick(c, ['wo_date', 'work_order_date'], ''),
        pick(c, ['firm_name', 'firm'], ''),
        pick(c, ['contractor_name'], ''),
        pick(c, ['contractor_number', 'contractor_no', 'contractor_mo_no'], ''),
        pick(c, ['plant_capacity', 'capacity'], ''),
        pick(c, ['complaint'], ''),
        pick(c, ['created_date', 'complaint_date', 'created_at'], ''),
        pick(c, ['created_by'], ''),
      ]}
      detailEyebrow="On Grid Solar Plant Complaint"
      detailFields={(c) => {
        const fields = [
          { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
          { label: 'OGID', value: pick(c, ['ogid', 'og_id']) },
          { label: 'Contact Number', value: pick(c, ['contact_no', 'contact_number']) },
          {
            label: 'District / State',
            value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP').toLowerCase() === 'up' ? 'UP' : pick(c, ['state'])}`,
          },
          { label: 'Status', value: <StatusBadge row={c} /> },
          { label: 'Work Order No.', value: pick(c, ['wo_no', 'work_order_no']) },
          { label: 'Work Order Date', value: formatDate(pick(c, ['wo_date', 'work_order_date'])) },
          { label: 'Plant Capacity', value: pick(c, ['plant_capacity', 'capacity']) },
          { label: 'Firm Name', value: pick(c, ['firm_name', 'firm']) },
          {
            label: 'Contractor Name / Number',
            value: `${pick(c, ['contractor_name'])}${
              pick(c, ['contractor_number', 'contractor_no'], '') !== DASH &&
              pick(c, ['contractor_number', 'contractor_no'], '') !== ''
                ? ` (${pick(c, ['contractor_number', 'contractor_no'])})`
                : ''
            }`,
          },
          { label: 'Complaint Date', value: formatDate(pick(c, ['created_date', 'complaint_date', 'created_at'])) },
          { label: 'Assigned Date', value: formatDate(pick(c, ['assigned_date'])) },
        ];

        if (pick(c, ['assigned_to']) !== DASH) {
          fields.push({ label: 'Assigned To', value: pick(c, ['assigned_to']) });
        }
        if (pick(c, ['resolved_by']) !== DASH) {
          fields.push({ label: 'Resolved By', value: pick(c, ['resolved_by']) });
        }
        if (pick(c, ['close_complaint_date', 'manual_close_date', 'close_date']) !== DASH) {
          fields.push({
            label: 'Close Date',
            value: formatDate(pick(c, ['close_complaint_date', 'manual_close_date', 'close_date'])),
          });
        }
        if (pick(c, ['sms']) !== DASH) {
          fields.push({ label: 'SMS Notification', value: pick(c, ['sms']) });
        }
        if (pick(c, ['created_by']) !== DASH) {
          fields.push({ label: 'Created By', value: pick(c, ['created_by']) });
        }
        if (pick(c, ['remarks']) !== DASH) {
          fields.push({ label: 'Remarks', value: pick(c, ['remarks']) });
        }

        return fields;
      }}
      exportName="UP_Ongrid_Complaints"
      exportTitle="UP On Grid Complaints"
    />
  );
}

export default UPComplaintOngridView;
