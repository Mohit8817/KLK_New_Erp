import {
  upComplaintService,
  type UpKusumCComplaintItem,
} from '../../up-services';
import { documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpKusumCComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('KCID', ['kcid', 'kc_id'], { strong: true }),
  T('Complaint Date', ['created_date', 'complaint_date', 'created_at']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Post', ['post']),
  T('Village', ['village']),
  T('Farmer Name', ['farmer_name', 'f_name', 'beneficiary_name'], { strong: true }),
  T('Father Name', ['father_name', 'f_father_name']),
  T('Contact No', ['contact_no', 'contact_number', 'f_mobile']),
  T('Lot No', ['lot_no']),
  T('Pump Capacity', ['pump_capicity', 'pump_capacity', 'spv_capacity'], { strong: true }),
  T('Contractor Name', ['contractor_name']),
  T('Contractor No', ['contractor_mo_no', 'contractor_mobile_no', 'contractor_no']),
  T('Installation Date', ['installation_date']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
];

export function UPComplaintKCAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP Kusum C Complaints"
      subtitle="Manage assigned solar water pump complaints and file resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Kusum C Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned water pumps',
        open: 'Pumps requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, KCID, farmer, village, contact, pump…"
      fetchData={() => upComplaintService.getKusumCAssignedComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['kcid', 'kc_id'], ''),
        pick(c, ['farmer_name', 'f_name', 'beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['post'], ''),
        pick(c, ['village'], ''),
        pick(c, ['contact_no'], ''),
        pick(c, ['pump_capicity', 'pump_capacity'], ''),
        pick(c, ['contractor_name'], ''),
        pick(c, ['contractor_mo_no', 'contractor_mobile_no', 'contractor_no'], ''),
        pick(c, ['complaint'], ''),
      ]}
      exportName="UP_KusumC_Assigned"
      exportTitle="UP Kusum C Assigned Complaints"
      close={{
        heading: 'Close Kusum C Complaint',
        defaultSuccess: 'Complaint closed successfully!',
        summary: (c) => [
          { label: 'KCID', value: pick(c, ['kcid', 'kc_id']) },
          { label: 'Farmer', value: pick(c, ['farmer_name', 'f_name', 'beneficiary_name']) },
          { label: 'Father Name', value: pick(c, ['father_name', 'f_father_name']) },
          { label: 'Contact', value: pick(c, ['contact_no', 'contact_number', 'f_mobile']) },
          { label: 'Location', value: `${pick(c, ['district'])}, ${pick(c, ['village'])}` },
          { label: 'Pump Capacity', value: pick(c, ['pump_capicity', 'pump_capacity', 'spv_capacity']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. replaced burnt cable, serviced pump motor)…',
        fileLabel: 'Repair / site verification document',
        fileHint: 'Post-repair photo or signed customer satisfaction sheet',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));
          fd.append('remarks', v.remarks);
          fd.append('closing_date', v.date);
          fd.append('document', v.file);
          fd.append('file', v.file);
          return upComplaintService.closeKusumCComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintKCAssigned;