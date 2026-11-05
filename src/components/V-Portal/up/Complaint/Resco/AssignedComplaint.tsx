import {
  upComplaintService,
  type UpRescoComplaintItem,
} from '../../up-services';
import { DASH, documentCol, pick, textCol, type ComplaintColumn } from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpRescoComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const complaintId = (r: Row) => pick(r, ['complaint_id'], `CMP-${(r as any).id}`);
const kw = (r: Row, keys: string[]) => {
  const v = pick(r, keys);
  return v === DASH ? DASH : `${v} kW`;
};

const COLUMNS: ComplaintColumn<Row>[] = [
  {
    header: 'Complaint ID',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>#{complaintId(r)}</b>,
    exportValue: (r) => `#${complaintId(r)}`,
  },
  T('Complaint Date', ['start_date', 'complaint_date', 'created_at']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'Uttar Pradesh' }),
  T('District', ['district'], { strong: true }),
  T('Dept Name', ['dept_name', 'department']),
  T('Site Name', ['site_name'], { strong: true }),
  T('Address', ['address'], { clamp: true }),
  T('CA No', ['ca_no']),
  { header: 'Sanction Load', cell: (r) => kw(r, ['sanction_load']), exportValue: (r) => kw(r, ['sanction_load']) },
  { header: 'Plant SC', cell: (r) => kw(r, ['plant_sc', 'plant_capacity']), exportValue: (r) => kw(r, ['plant_sc', 'plant_capacity']) },
  T('Contact Person', ['contact_person']),
  T('Contact Number', ['contact_number', 'contact_no']),
  T('Inverter No', ['inverter_no']),
  T('Solarmeter No', ['solarmeter_no', 'solar_meter_no']),
  T('NM SM NO', ['nm_sm_no', 'nmsm_no']),
  T('Logger No', ['loger_no', 'logger_no']),
  T('Panel No', ['panel_no']),
  T('WO No', ['wo_no', 'work_order_no']),
  T('Phase', ['phase']),
  documentCol<Row>(),
];

export function UP_Complaint_Resco_AssignedComplaint() {
  return (
    <AssignedComplaintPage<Row>
      title="View Vendor UP Resco Complaints"
      subtitle="Track assigned solar rooftop complaints, resolution workflows and closures"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Resco Assigned' },
      ]}
      cardTitle="Report Bifurcation Details"
      kpiSub={{
        total: 'Assigned vendor complaints',
        open: 'Action required by vendor',
        approved: 'Under departmental review',
        close: 'Completed & closed complaints',
      }}
      searchPlaceholder="Search complaint, site, CA no, phone…"
      fetchData={() => upComplaintService.getRescoAssignedComplaints()}
      columns={COLUMNS}
      closeOnApproved
      searchFields={(r) => [
        pick(r, ['complaint_id', 'id'], ''),
        pick(r, ['site_name'], ''),
        pick(r, ['district'], ''),
        pick(r, ['dept_name', 'department'], ''),
        pick(r, ['contact_number', 'contact_no'], ''),
        pick(r, ['contact_person'], ''),
        pick(r, ['complaint'], ''),
        pick(r, ['ca_no'], ''),
        pick(r, ['start_date', 'complaint_date'], ''),
        pick(r, ['inverter_no'], ''),
        pick(r, ['solarmeter_no', 'solar_meter_no'], ''),
        pick(r, ['nm_sm_no', 'nmsm_no'], ''),
        pick(r, ['loger_no', 'logger_no'], ''),
        pick(r, ['wo_no', 'work_order_no'], ''),
      ]}
      exportName="UP_Resco_Assigned"
      exportTitle="UP Resco Assigned Complaints"
      detail={{
        eyebrow: 'Assigned Resco Complaint',
        fields: (r) => [
          { label: 'Site Name', value: pick(r, ['site_name']) },
          { label: 'District', value: pick(r, ['district']) },
          { label: 'Department', value: pick(r, ['dept_name', 'department']) },
          { label: 'Address', value: pick(r, ['address']) },
          { label: 'Contact Person', value: pick(r, ['contact_person']) },
          { label: 'Contact Number', value: pick(r, ['contact_number', 'contact_no']) },
          { label: 'CA Number', value: pick(r, ['ca_no']) },
          { label: 'Sanction Load', value: kw(r, ['sanction_load']) },
          { label: 'Plant Capacity', value: kw(r, ['plant_sc', 'plant_capacity']) },
          { label: 'Inverter No', value: pick(r, ['inverter_no']) },
          { label: 'Solar Meter No', value: pick(r, ['solarmeter_no', 'solar_meter_no']) },
          { label: 'NM/SM No', value: pick(r, ['nm_sm_no', 'nmsm_no']) },
          { label: 'Logger No', value: pick(r, ['loger_no', 'logger_no']) },
          { label: 'Panel No', value: pick(r, ['panel_no']) },
          { label: 'Work Order No', value: pick(r, ['wo_no', 'work_order_no']) },
          { label: 'Phase', value: pick(r, ['phase']) },
          { label: 'Complaint Date', value: pick(r, ['start_date', 'complaint_date', 'created_at']) },
        ],
      }}
      close={{
        heading: 'Resolve & Close Complaint',
        variant: 'resolver',
        emailRequired: true,
        smsDefault: 'Yes',
        file1Label: 'Resolution File 2 (Optional)',
        defaultSuccess: 'Complaint closed successfully!',
        summary: (r) => [
          { label: 'Site', value: pick(r, ['site_name']) },
          { label: 'District', value: pick(r, ['district']) },
          { label: 'Contact', value: pick(r, ['contact_number', 'contact_no']) },
          { label: 'CA No.', value: pick(r, ['ca_no']) },
        ],
        remarksPlaceholder: 'Detail action taken, replaced parts or site repair done',
        fileLabel: 'Resolution Document',
        fileHint: 'Image or PDF',
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('complain_id', String(item.id));
          fd.append('resolved_by', v.resolvedBy);
          fd.append('r_email', v.email);
          fd.append('r_mobile', v.mobile);
          fd.append('manual_close_date', v.date);
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          if (item.site_name) fd.append('beneficiary_name', item.site_name);
          if (item.contact_number || item.contact_no) fd.append('contact_no', String(item.contact_number || item.contact_no));
          fd.append('r_file', v.file);
          if (v.file1) fd.append('r_file1', v.file1);
          return upComplaintService.closeRescoComplaint(fd);
        },
      }}
    />
  );
}

export default UP_Complaint_Resco_AssignedComplaint;