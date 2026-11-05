import {
  upComplaintService,
  type UpRescoComplaintItem,
} from '../../up-services';
import {
  ComplaintViewPage,
  DASH,
  StatusBadge,
  documentCol,
  pick,
  statusCol,
  textCol,
  type ComplaintColumn,
} from '../CommonSharedComplaints/ViewComplaints';

type Row = UpRescoComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const complaintId = (r: Row) => pick(r, ['complaint_id', 'id']);

const formatState = (v: string) => {
  const s = v?.trim()?.toLowerCase();
  if (!s || s === DASH || s === 'up') return 'Uttar Pradesh';
  return v;
};

const kw = (r: Row, keys: string[]) => {
  const v = pick(r, keys);
  if (v === DASH || v === 'NA') return v;
  return v.toLowerCase().includes('kw') ? v : `${v} kW`;
};

const formatDate = (v: string) => {
  if (!v || v === DASH || v === 'null') return DASH;
  return v;
};

const COLUMNS: ComplaintColumn<Row>[] = [
  {
    header: 'Complaint ID',
    cell: (r) => <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>#{complaintId(r)}</b>,
    exportValue: (r) => `#${complaintId(r)}`,
  },
  {
    header: 'Complaint Date',
    cell: (r) => formatDate(pick(r, ['start_date', 'complaint_date', 'created_at'])),
    exportValue: (r) => pick(r, ['start_date', 'complaint_date', 'created_at']),
  },
  T('Complaint', ['complaint'], { clamp: true }),
  {
    header: 'State',
    cell: (r) => formatState(pick(r, ['state'], 'Uttar Pradesh')),
    exportValue: (r) => formatState(pick(r, ['state'], 'Uttar Pradesh')),
  },
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
  statusCol<Row>(),
  {
    header: 'Close Date',
    cell: (r) => formatDate(pick(r, ['manual_close_date', 'close_date'])),
    exportValue: (r) => pick(r, ['manual_close_date', 'close_date']),
  },
  T('Created By', ['created_by']),
];

export function UP_Complaint_Resco_ViewComplaint() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP Resco Complaints"
      subtitle="Comprehensive listing of all filed solar rooftop complaints and real-time status"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Resco' },
      ]}
      addLink="/v/complaint/up/resco-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor Resco Complaint Data"
      searchPlaceholder="Search complaint, site, CA no, phone…"
      loadingText="Loading Resco complaints…"
      emptyMessage="Resco complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getRescoViewComplaints()}
      columns={COLUMNS}
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
        pick(r, ['created_by'], ''),
        pick(r, ['assigned_to'], ''),
        pick(r, ['resolved_by'], ''),
      ]}
      detailEyebrow="Resco Complaint Details"
      detailFields={(r) => {
        const fields: { label: string; value: React.ReactNode }[] = [
          { label: 'Site Name', value: pick(r, ['site_name']) },
          { label: 'District', value: pick(r, ['district']) },
          { label: 'State', value: formatState(pick(r, ['state'])) },
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
          { label: 'Complaint Date', value: formatDate(pick(r, ['start_date', 'complaint_date', 'created_at'])) },
          { label: 'Close Date', value: formatDate(pick(r, ['manual_close_date', 'close_date'])) },
          { label: 'Status', value: <StatusBadge row={r} /> },
        ];

        if (pick(r, ['assigned_to']) !== DASH) {
          fields.push({ label: 'Assigned To', value: pick(r, ['assigned_to']) });
        }
        if (pick(r, ['resolved_by']) !== DASH) {
          fields.push({ label: 'Resolved By', value: pick(r, ['resolved_by']) });
        }
        if (pick(r, ['r_mobile']) !== DASH) {
          fields.push({ label: 'Resolver Mobile', value: pick(r, ['r_mobile']) });
        }
        if (pick(r, ['r_email']) !== DASH) {
          fields.push({ label: 'Resolver Email', value: pick(r, ['r_email']) });
        }
        if (pick(r, ['remarks']) !== DASH) {
          fields.push({ label: 'Resolution Remarks', value: pick(r, ['remarks']) });
        }
        if (pick(r, ['latitude']) !== DASH && pick(r, ['longitude']) !== DASH) {
          fields.push({ label: 'Coordinates', value: `${pick(r, ['latitude'])}, ${pick(r, ['longitude'])}` });
        }
        if (pick(r, ['sms']) !== DASH) {
          fields.push({ label: 'SMS Notification', value: pick(r, ['sms']) === '1' ? 'Sent (Yes)' : pick(r, ['sms']) === '0' ? 'No' : pick(r, ['sms']) });
        }
        fields.push({ label: 'Created By', value: pick(r, ['created_by']) });
        fields.push({ label: 'Created At', value: pick(r, ['created_at']) });

        return fields;
      }}
      exportName="UP_Vendor_Resco_Complaints"
      exportTitle="UP Vendor Resco Complaints Register"
    />
  );
}

export default UP_Complaint_Resco_ViewComplaint;
