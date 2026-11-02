import {
  upComplaintService,
  type UpOngridComplaintItem,
} from '../../up-services';
import { documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

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
      searchPlaceholder="Search ID, name, contact, work order…"
      fetchData={() => upComplaintService.getOngridAssignedComplaints()}
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
      exportName="UP_Ongrid_Assigned"
      exportTitle="UP On Grid Assigned Complaints"
      close={{
        heading: 'Close On Grid Complaint',
        defaultSuccess: 'On Grid Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_number', 'contact_no']) },
          { label: 'District', value: pick(c, ['district']) },
          { label: 'Plant Capacity', value: pick(c, ['plant_capacity']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. replaced DC isolator, checked net meter sync)…',
        fileLabel: 'Repair verification / handover document',
        fileHint: 'Post-repair generation photo or customer acknowledgement',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));
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