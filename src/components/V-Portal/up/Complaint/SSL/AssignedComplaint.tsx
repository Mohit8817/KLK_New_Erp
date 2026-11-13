import {
  upComplaintService,
  type UpSslComplaintItem,
} from '../../up-services';
import {
  documentCol,
  pick,
  textCol,
  type ComplaintColumn,
  type DetailField,
} from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpSslComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date', 'created_date', 'created_at']),
  T('Complaint Issue', ['complaint_issue', 'issue', 'complaint']),
  T('Complaint', ['complaint', 'complaint_issue'], { clamp: true }),
  T('Complaint Source', ['complaint_source']),
  T('State', ['state'], { fallback: 'Uttar Pradesh' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Panchayat', ['panchayat']),
  T('Phase', ['phase']),
  T('Address', ['address'], { clamp: true }),
  T('Ward No', ['ward_no']),
  T('Pole No', ['pole_no'], { strong: true }),
  T('Light No', ['light_no']),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Contact No', ['contact_no', 'contact_number']),
  T('Latitude', ['latitude']),
  T('Longitude', ['longitude']),
  T('Along with Pole', ['along_with_pole']),
  T('Luminary No', ['luminary_no'], { strong: true }),
  T('SIM No', ['sim_no']),
  T('Battery Serial No', ['battery_serial_no', 'battery_no']),
  T('Module No', ['module_no', 'panel_no']),
  T('Date of Installation', ['date_of_installation', 'installation_date']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
];

export function UPComplaintSSLAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View UP Vendor SSL Complaints"
      subtitle="Manage assigned solar street light complaints and submit repair closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'SSL Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned street lights',
        open: 'Street lights requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, pole, luminary, beneficiary, district, village…"
      fetchData={() => upComplaintService.getSslAssignedComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['pole_no'], ''),
        pick(c, ['luminary_no'], ''),
        pick(c, ['light_no'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['contact_no', 'contact_number'], ''),
        pick(c, ['district'], ''),
        pick(c, ['block'], ''),
        pick(c, ['panchayat'], ''),
        pick(c, ['ward_no'], ''),
        pick(c, ['battery_serial_no', 'battery_no'], ''),
        pick(c, ['module_no', 'panel_no'], ''),
        pick(c, ['complaint_issue', 'issue', 'complaint'], ''),
      ]}
      exportName="UP_SSL_Assigned"
      exportTitle="UP SSL Assigned Complaints"
      closeOnApproved={true}
      detail={{
        eyebrow: 'Solar Street Light',
        fields: (r: Row): DetailField[] => [
          { label: 'State', value: pick(r, ['state'], 'Uttar Pradesh') },
          { label: 'District', value: pick(r, ['district']) },
          { label: 'Block', value: pick(r, ['block']) },
          { label: 'Panchayat', value: pick(r, ['panchayat']) },
          { label: 'Pole No', value: pick(r, ['pole_no']) },
          { label: 'Light No', value: pick(r, ['light_no']) },
          { label: 'Luminary No', value: pick(r, ['luminary_no']) },
          { label: 'Beneficiary', value: pick(r, ['beneficiary_name']) },
          { label: 'Contact', value: pick(r, ['contact_no', 'contact_number']) },
          { label: 'Battery Serial No', value: pick(r, ['battery_serial_no', 'battery_no']) },
          { label: 'Module No', value: pick(r, ['module_no', 'panel_no']) },
          { label: 'Date of Installation', value: pick(r, ['date_of_installation', 'installation_date']) },
        ],
      }}
      close={{
        heading: 'Close SSL Complaint',
        variant: 'resolver',
        defaultSuccess: 'SSL Complaint closed successfully!',
        summary: (c) => [
          { label: 'Pole No', value: pick(c, ['pole_no']) },
          { label: 'Luminary No', value: pick(c, ['luminary_no']) },
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_no', 'contact_number']) },
          { label: 'Location', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}, ${pick(c, ['panchayat'])}` },
          { label: 'Issue', value: pick(c, ['complaint_issue', 'issue', 'complaint']) },
        ],
        remarksPlaceholder: 'Describe repairs completed (e.g. replaced battery, luminary repair, wiring fixed)…',
        fileLabel: 'Resolution Photo / Document',
        fileHint: 'Site repair photo or signed verification sheet (Required)',
        file1Label: 'Additional Photo (Optional)',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('complain_id', String(item.id || item.complaint_id || ''));
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));
          fd.append('resolved_by', v.resolvedBy);
          if (v.email) fd.append('r_email', v.email);
          fd.append('r_mobile', v.mobile);
          fd.append('manual_close_date', v.date);
          fd.append('closing_date', v.date);
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          if (item.beneficiary_name) fd.append('beneficiary_name', String(item.beneficiary_name));
          if (item.contact_no) fd.append('contact_no', String(item.contact_no));
          if (v.file) {
            fd.append('r_file', v.file);
            fd.append('document', v.file);
            fd.append('file', v.file);
          }
          if (v.file1) {
            fd.append('r_file1', v.file1);
            fd.append('file1', v.file1);
          }
          return upComplaintService.closeSslComplaint(fd);
        },
      }}
    />
  );
}

export const UP_Complaint_SSL_AssignedComplaint = UPComplaintSSLAssigned;
export default UPComplaintSSLAssigned;
