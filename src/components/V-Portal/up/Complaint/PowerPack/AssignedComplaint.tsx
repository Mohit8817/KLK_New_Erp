import {
  upComplaintService,
  type UpPowerpackComplaintItem,
} from '../../up-services';
import { documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpPowerpackComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Village', ['village']),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Address', ['address']),
  T('Gender', ['gender']),
  T('Contact Number', ['contact_number', 'contact_no']),
  T('Uid', ['uid', 'uid_no']),
  T('Empanelled Agency', ['empanelled_agency', 'empanelled_agencies']),
  T('Longitude', ['longitude']),
  T('Latitude', ['latitude']),
  T('Installation', ['installation', 'installation_status']),
  T('Installation Date', ['installation_date']),
  T('Contractor Name', ['contractor_name']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
];

export function UPComplaintPPAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP Power Pack Complaints"
      subtitle="Manage assigned solar power pack complaints and submit resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Power Pack Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned power packs',
        open: 'Packs requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, name, block, village, UID…"
      fetchData={() => upComplaintService.getPowerpackAssignedComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['block'], ''),
        pick(c, ['village'], ''),
        pick(c, ['contact_number', 'contact_no'], ''),
        pick(c, ['uid', 'uid_no'], ''),
        pick(c, ['contractor_name'], ''),
        pick(c, ['complaint'], ''),
      ]}
      exportName="UP_Powerpack_Assigned"
      exportTitle="UP Power Pack Assigned Complaints"
      detail={{
        eyebrow: 'Solar Power Pack',
        fields: (c: Row) => [
          { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact Number', value: pick(c, ['contact_number', 'contact_no']) },
          { label: 'Gender', value: pick(c, ['gender']) },
          { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
          { label: 'Block / Village', value: `${pick(c, ['block'])} / ${pick(c, ['village'])}` },
          { label: 'UID No.', value: pick(c, ['uid', 'uid_no']) },
          { label: 'Empanelled Agency', value: pick(c, ['empanelled_agency', 'empanelled_agencies']) },
          { label: 'Installation Status', value: pick(c, ['installation', 'installation_status']) },
          { label: 'Installation Date', value: pick(c, ['installation_date']) },
          { label: 'Contractor Name', value: pick(c, ['contractor_name']) },
          { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
          { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
          { label: 'Address', value: pick(c, ['address']) },
          { label: 'Complaint', value: pick(c, ['complaint']) },
        ],
      }}
      close={{
        heading: 'Close Power Pack Complaint',
        variant: 'resolver',
        showContactFields: true,
        smsDefault: 'Yes',
        defaultSuccess: 'Power Pack Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_number', 'contact_no']) },
          { label: 'District / Block', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}` },
          { label: 'Village', value: pick(c, ['village']) },
          { label: 'UID No.', value: pick(c, ['uid', 'uid_no']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. serviced battery terminal, replaced bypass diode)…',
        fileLabel: 'Resolution Document / Proof Image 1 (Required)',
        fileHint: 'Post-repair photo or signed site work sheet',
        file1Label: 'Resolution File 2 (Optional)',
        file1Hint: 'Secondary photo or customer sign-off sheet (Optional)',
        submit: (v, item) => {
          const fd = new FormData();
          const cId = String(item.id || item.complaint_id || '');
          fd.append('id', cId);
          fd.append('complain_id', cId);
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));

          // Resolver info (Backend requires r_mobile)
          fd.append('resolved_by', v.resolvedBy);
          fd.append('r_mobile', v.mobile);
          fd.append('mobile', v.mobile);
          if (v.email) {
            fd.append('r_email', v.email);
            fd.append('email', v.email);
          }

          // Dates (Backend requires manual_close_date)
          fd.append('manual_close_date', v.date);
          fd.append('closing_date', v.date);
          fd.append('close_date', v.date);

          // Remarks & SMS (Backend requires close_sms)
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          fd.append('sms', v.closeSms);

          // Beneficiary & Contact (Backend requires beneficiary_name & contact_no)
          const beneficiary =
            v.contactPerson?.trim() ||
            pick(item, ['beneficiary_name', 'name', 'contact_person']) ||
            '';
          const contact =
            v.contactNumber?.trim() ||
            pick(item, ['contact_no', 'contact_number', 'mobile_no', 'mobile']) ||
            '';

          fd.append('beneficiary_name', beneficiary);
          fd.append('close_beneficiary_name', beneficiary);
          fd.append('contact_person', beneficiary);

          fd.append('contact_no', contact);
          fd.append('close_beneficiary_contact', contact);
          fd.append('contact_number', contact);
          fd.append('mobile_no', contact);

          // Proof files
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

          if ((item as any).complaint_type) fd.append('complaint_type', String((item as any).complaint_type));
          if ((item as any).type) fd.append('type', String((item as any).type));

          return upComplaintService.closePowerpackComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintPPAssigned;