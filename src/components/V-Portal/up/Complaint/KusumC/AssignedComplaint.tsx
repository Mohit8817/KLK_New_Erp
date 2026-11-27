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
  T('Contact No', ['contact_no', 'contact_number', 'f_contact', 'f_mobile']),
  T('Lot No', ['lot_no']),
  T('Pump Capacity', ['pump_capicity', 'pump_capacity', 'spv_capacity'], { strong: true }),
  T('Contractor Name', ['contractor_name', 'c_contractor_name']),
  T('Contractor No', ['contractor_mo_no', 'contractor_mobile_no', 'contractor_no', 'c_contact_no']),
  T('Installation Date', ['installation_date', 'inst_date']),
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
        pick(c, ['father_name', 'f_father_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['post'], ''),
        pick(c, ['village'], ''),
        pick(c, ['contact_no', 'contact_number', 'f_contact', 'f_mobile'], ''),
        pick(c, ['lot_no'], ''),
        pick(c, ['pump_capicity', 'pump_capacity'], ''),
        pick(c, ['contractor_name', 'c_contractor_name'], ''),
        pick(c, ['contractor_mo_no', 'contractor_mobile_no', 'contractor_no', 'c_contact_no'], ''),
        pick(c, ['complaint'], ''),
      ]}
      exportName="UP_KusumC_Assigned"
      exportTitle="UP Kusum C Assigned Complaints"
      close={{
        heading: 'Close Kusum C Complaint',
        variant: 'resolver',
        showContactFields: true,
        smsDefault: 'Yes',
        defaultSuccess: 'Complaint closed successfully!',
        summary: (c) => [
          { label: 'KCID', value: pick(c, ['kcid', 'kc_id']) },
          { label: 'Farmer', value: pick(c, ['farmer_name', 'f_name', 'beneficiary_name']) },
          { label: 'Father Name', value: pick(c, ['father_name', 'f_father_name']) },
          { label: 'Contact', value: pick(c, ['contact_no', 'contact_number', 'f_contact', 'f_mobile']) },
          { label: 'Location', value: `${pick(c, ['district'])}, ${pick(c, ['village'])}` },
          { label: 'Pump Capacity', value: pick(c, ['pump_capicity', 'pump_capacity', 'spv_capacity']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. replaced burnt cable, serviced pump motor)…',
        fileLabel: 'Repair / site verification document (Required)',
        fileHint: 'Post-repair photo or signed customer satisfaction sheet',
        file1Label: 'Resolution File 2 (Optional)',
        file1Hint: 'Secondary photo or satisfaction sheet (Optional)',
        submit: (v, item) => {
          const fd = new FormData();
          const cId = String(item.id || item.complaint_id || '');
          fd.append('id', cId);
          fd.append('complain_id', cId);
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));

          // Resolver info
          fd.append('resolved_by', v.resolvedBy);
          fd.append('r_mobile', v.mobile);
          fd.append('mobile', v.mobile);
          if (v.email) {
            fd.append('r_email', v.email);
            fd.append('email', v.email);
          }

          // Dates
          fd.append('manual_close_date', v.date);
          fd.append('closing_date', v.date);
          fd.append('close_date', v.date);

          // Remarks & SMS
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          fd.append('sms', v.closeSms);

          // Beneficiary / Farmer & Contact
          const farmer =
            v.contactPerson?.trim() ||
            pick(item, ['farmer_name', 'f_name', 'beneficiary_name', 'name', 'contact_person']) ||
            '';
          const contact =
            v.contactNumber?.trim() ||
            pick(item, ['contact_no', 'contact_number', 'f_contact', 'f_mobile', 'mobile_no', 'mobile']) ||
            '';

          fd.append('beneficiary_name', farmer);
          fd.append('farmer_name', farmer);
          fd.append('close_beneficiary_name', farmer);
          fd.append('contact_person', farmer);

          fd.append('contact_no', contact);
          fd.append('close_beneficiary_contact', contact);
          fd.append('contact_number', contact);
          fd.append('mobile_no', contact);

          // Files
          if (v.file) {
            fd.append('document', v.file);
            fd.append('file', v.file);
            fd.append('r_file', v.file);
          }
          const f2 = v.file1 || v.file;
          if (f2) {
            fd.append('r_file1', f2);
            fd.append('r_file2', f2);
            fd.append('file1', f2);
            fd.append('file2', f2);
          }

          return upComplaintService.closeKusumCComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintKCAssigned;