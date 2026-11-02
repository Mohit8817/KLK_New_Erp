import {
  upComplaintService,
  type UpOffgridComplaintItem,
} from '../../up-services';
import { documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpOffgridComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
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
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
];

export function UPComplaintOffgridAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View UP Vendor OFF Grid Complaints"
      subtitle="Manage assigned offgrid solar plant complaints and submit resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Off Grid Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned offgrid plants',
        open: 'Plants requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, name, contact, work order…"
      fetchData={() => upComplaintService.getOffgridAssignedComplaints()}
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
      exportName="UP_Offgrid_Assigned"
      exportTitle="UP Off Grid Assigned Complaints"
      close={{
        heading: 'Close Off Grid Complaint',
        variant: 'resolver',
        defaultSuccess: 'Off Grid Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_number', 'contact_no']) },
          { label: 'District', value: pick(c, ['district']) },
          { label: 'Plant Capacity', value: pick(c, ['plant_capacity']) },
        ],
        remarksPlaceholder: 'Describe repairs completed (e.g. replaced inverter fuse, terminal lugs tightened)…',
        fileLabel: 'Proof file',
        fileHint: 'Image or PDF',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('complain_id', String(item.id || item.complaint_id || ''));
          fd.append('resolved_by', v.resolvedBy);
          if (v.email) fd.append('r_email', v.email);
          fd.append('r_mobile', v.mobile);
          fd.append('manual_close_date', v.date);
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          fd.append('beneficiary_name', String(item.beneficiary_name || ''));
          fd.append('contact_no', String(item.contact_number || item.contact_no || ''));
          fd.append('r_file', v.file);
          if (v.file1) fd.append('r_file1', v.file1);
          return upComplaintService.closeOffgridComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintOffgridAssigned;