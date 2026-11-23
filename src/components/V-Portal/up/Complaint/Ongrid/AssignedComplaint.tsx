import {
  upComplaintService,
  type UpOngridComplaintItem,
} from '../../up-services';
import {
  DASH,
  documentCol,
  pick,
  textCol,
  type ComplaintColumn,
} from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

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
];

export function UPComplaintOngridAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP On Grid Complaints"
      subtitle="Manage assigned ongrid solar plant complaints and record resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'On Grid Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned ongrid plants',
        open: 'Plants requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, OGID, name, contact, work order…"
      fetchData={() => upComplaintService.getOngridAssignedComplaints()}
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
      ]}
      exportName="UP_Ongrid_Assigned"
      exportTitle="UP On Grid Assigned Complaints"
      close={{
        heading: 'Close On Grid Complaint',
        defaultSuccess: 'On Grid Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'OGID', value: pick(c, ['ogid', 'og_id']) },
          { label: 'Contact', value: pick(c, ['contact_no', 'contact_number']) },
          { label: 'District', value: pick(c, ['district']) },
          { label: 'Work Order No.', value: pick(c, ['wo_no', 'work_order_no']) },
          { label: 'Plant Capacity', value: pick(c, ['plant_capacity', 'capacity']) },
          { label: 'Firm Name', value: pick(c, ['firm_name', 'firm']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. replaced DC isolator, checked net meter sync)…',
        fileLabel: 'Repair verification / handover document',
        fileHint: 'Post-repair generation photo or customer acknowledgement',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));
          fd.append('resolved_by', v.resolvedBy);
          fd.append('remarks', v.remarks);
          fd.append('closing_date', v.date);
          fd.append('document', v.file);
          fd.append('file', v.file);
          return upComplaintService.closeOngridComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintOngridAssigned;
