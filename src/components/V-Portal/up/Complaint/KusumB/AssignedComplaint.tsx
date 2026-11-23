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
  T('Beneficiary Name', ['beneficiary_name', 'farmer_name', 'f_name'], { strong: true }),
  T('Father Name', ['father_name', 'f_father_name']),
  T('Contact No', ['contact_no', 'contact_number', 'f_mobile']),
  T('Saral ID', ['saral_id']),
  T('Application No', ['application_no', 'app_no']),
  T('Category', ['category']),
  T('Installation Date', ['sys_installed', 'installation_date', 'sys_installed_date', 'inst_date']),
  T('Pump Type', ['required_pump', 'pump_type', 'pump_sub_type']),
  T('Pump Make', ['pump_make']),
  T('Module Make', ['module_make']),
  T('SPV Capacity', ['spv_capacity'], { strong: true }),
  T('Total Pump Cost', ['total_pumb_cost', 'total_pump_cost', 'pumb_cost', 'pump_cost']),
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
          fd.append('resolved_by', v.resolvedBy);
          fd.append('remarks', v.remarks);
          fd.append('closing_date', v.date);
          fd.append('document', v.file);
          fd.append('file', v.file);
          fd.append('r_file', v.file);
          fd.append('r_file1', v.file);
          fd.append('r_file2', v.file);
          return upComplaintService.closeKusumBComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintKBAssigned;