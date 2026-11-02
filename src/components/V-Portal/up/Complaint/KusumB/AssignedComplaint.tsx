import {
  upComplaintService,
  type UpKusumBComplaintItem,
} from '../../up-services';
import { documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpKusumBComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Village', ['village']),
  T('Location', ['location']),
  T('Beneficiary Name', ['beneficiary_name'], { strong: true }),
  T('Father Name', ['father_name']),
  T('Contact No', ['contact_no']),
  T('Saral ID', ['saral_id']),
  T('Application No', ['application_no']),
  T('Category', ['category']),
  T('Installation Date', ['installation_date']),
  T('Pump Type', ['pump_type', 'pump_sub_type']),
  T('Pump Make', ['pump_make']),
  T('Module Make', ['module_make']),
  T('SPV Capacity', ['spv_capacity'], { strong: true }),
  T('Total Pump Cost', ['total_pump_cost']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
];

export function UPComplaintKBAssigned() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP Kusum B Complaints"
      subtitle="Manage assigned solar water pump complaints and file resolution closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Kusum B Assigned' },
      ]}
      cardTitle="Report Bifurcation"
      kpiSub={{
        total: 'Assigned water pumps',
        open: 'Pumps requiring service',
        approved: 'Submitted repair verification',
        close: 'Successfully verified & closed',
      }}
      searchPlaceholder="Search ID, name, village, contact, Saral ID…"
      fetchData={() => upComplaintService.getKusumBAssignedComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['village'], ''),
        pick(c, ['contact_no'], ''),
        pick(c, ['application_no'], ''),
        pick(c, ['saral_id'], ''),
        pick(c, ['pump_make'], ''),
        pick(c, ['complaint'], ''),
      ]}
      exportName="UP_KusumB_Assigned"
      exportTitle="UP Kusum B Assigned Complaints"
      close={{
        heading: 'Close Kusum B Complaint',
        defaultSuccess: 'Kusum B Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_no']) },
          { label: 'Village / District', value: `${pick(c, ['village'])}, ${pick(c, ['district'])}` },
          { label: 'Application No.', value: pick(c, ['application_no']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. replaced controller card, tested flow output)…',
        fileLabel: 'Repair verification / customer sign-off',
        fileHint: 'Post-repair photo or signed site work sheet',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));
          fd.append('remarks', v.remarks);
          fd.append('closing_date', v.date);
          fd.append('document', v.file);
          fd.append('file', v.file);
          return upComplaintService.closeKusumBComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintKBAssigned;