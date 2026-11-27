import {
  upComplaintService,
  type UpSrlmsrtComplaintItem,
} from '../../up-services';
import { DASH, docUrlOf, documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpSrlmsrtComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Site Name', ['site_name'], { strong: true }),
  T('Customer Name', ['customer_name', 'beneficiary_name']),
  T('Contact No.', ['contact_no']),
  T('CA No.', ['ca_no']),
  T('Capacity', ['capacity'], { strong: true }),
  T('Sanction Load', ['sanction_load']),
  T('Roof Shed Area', ['roof_shed_area']),
  T('Shadow Free Area', ['shadow_free_area']),
  T('Phase', ['phase']),
  T('Installtion', ['installtion', 'installation']),
  T('Installtion Date', ['installtion_date', 'installation_date']),
  T('Required Sqft', ['required_sqft']),
  T('Latitude', ['latitude']),
  T('Longitude', ['longitude']),
  { ...documentCol<Row>(), exportValue: (r) => docUrlOf(r) || DASH },
  T('Assigned Date', ['assigned_date']),
];

export function UP_Complaint_SRLMSRT_AssignedComplaint() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP SRLMSRT Complaints"
      subtitle="Manage assigned UP SRLMSRT complaints and submit resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'SRLMSRT Assigned' },
      ]}
      cardTitle="Report Bifurcation Details"
      kpiSub={{
        total: 'All SRLMSRT complaints',
        open: 'Awaiting vendor resolution',
        approved: 'Submitted for verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, site, customer, CA no, contact…"
      fetchData={() => upComplaintService.getSrlmsrtAssignedComplaints()}
      columns={COLUMNS}
      closeOnApproved
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['site_name'], ''),
        pick(c, ['customer_name', 'beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['block'], ''),
        pick(c, ['contact_no'], ''),
        pick(c, ['ca_no'], ''),
        pick(c, ['capacity'], ''),
        pick(c, ['complaint'], ''),
      ]}
      exportName="SRLMSRT_Assigned_Complaints"
      exportTitle="Vendor UP SRLMSRT Assigned Complaints"
      detail={{
        eyebrow: 'SRLMSRT Complaint Details',
        fields: (c) => [
          { label: 'Site Name', value: pick(c, ['site_name']) },
          { label: 'Customer Name', value: pick(c, ['customer_name', 'beneficiary_name']) },
          { label: 'Contact No.', value: pick(c, ['contact_no']) },
          { label: 'CA No.', value: pick(c, ['ca_no']) },
          { label: 'District', value: pick(c, ['district']) },
          { label: 'Block', value: pick(c, ['block']) },
          { label: 'State', value: pick(c, ['state'], 'UP') },
          { label: 'Coordinates', value: pick(c, ['latitude'], '') ? `${pick(c, ['latitude'])}, ${pick(c, ['longitude'])}` : DASH },
          { label: 'Capacity', value: pick(c, ['capacity']) },
          { label: 'Sanction Load', value: pick(c, ['sanction_load']) },
          { label: 'Phase', value: pick(c, ['phase']) },
          { label: 'Roof Shed Area', value: pick(c, ['roof_shed_area']) },
          { label: 'Shadow Free Area', value: pick(c, ['shadow_free_area']) },
          { label: 'Required Sqft', value: pick(c, ['required_sqft']) },
          { label: 'Installation Status', value: pick(c, ['installtion', 'installation']) },
          { label: 'Installation Date', value: pick(c, ['installtion_date', 'installation_date']) },
          { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
          { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
        ],
      }}
      close={{
        heading: 'Close SRLMSRT Complaint',
        variant: 'resolver',
        showContactFields: true,
        smsDefault: 'Yes',
        defaultSuccess: 'SRLMSRT Complaint closed successfully!',
        summary: (c) => [
          { label: 'Site Name', value: pick(c, ['site_name']) },
          { label: 'Customer', value: pick(c, ['customer_name', 'beneficiary_name']) },
          { label: 'District / Block', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}` },
          { label: 'Contact No.', value: pick(c, ['contact_no']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. inverter reset, module alignment, grid sync verified)…',
        fileLabel: 'Repair verification / customer sign-off (Required)',
        fileHint: 'Rooftop inspection photo or signed resolution certificate',
        file1Label: 'Resolution File 2 (Optional)',
        file1Hint: 'Secondary photo or satisfaction certificate (Optional)',
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

          // Beneficiary / Customer & Contact
          const customer =
            v.contactPerson?.trim() ||
            pick(item, ['customer_name', 'beneficiary_name', 'site_name', 'name', 'contact_person']) ||
            '';
          const contact =
            v.contactNumber?.trim() ||
            pick(item, ['contact_no', 'contact_number', 'mobile_no', 'mobile']) ||
            '';

          fd.append('beneficiary_name', customer);
          fd.append('customer_name', customer);
          fd.append('close_beneficiary_name', customer);
          fd.append('contact_person', customer);

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

          return upComplaintService.closeSrlmsrtComplaint(fd);
        },
      }}
    />
  );
}

export const UPComplaintSRLMAssigned = UP_Complaint_SRLMSRT_AssignedComplaint;
export default UP_Complaint_SRLMSRT_AssignedComplaint;