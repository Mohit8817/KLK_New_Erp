import {
  upComplaintService,
  type UpSslComplaintItem,
} from '../../up-services';
import {
  documentCol,
  getLoggedInUserName,
  pick,
  textCol,
  type ComplaintColumn,
  type DetailField,
} from '../../Complaint/CommonSharedComplaints/UpComplaintsShared';
import { AssignedComplaintPage } from '../../Complaint/CommonSharedComplaints/AssignedComplaints';

type Row = UpSslComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const SSL_TYPE_MAP: Record<string, string> = {
  upssl12w: 'SSL 12W',
  ssl12w: 'SSL 12W',
  'ssl 12w': 'SSL 12W',
  upssl18w: 'SSL 18W',
  ssl18w: 'SSL 18W',
  'ssl 18w': 'SSL 18W',
  ssl: 'SSL',
};

const formatSslType = (type?: string | null): string => {
  if (!type) return '—';
  const key = String(type).trim().toLowerCase();
  return SSL_TYPE_MAP[key] || String(type).toUpperCase();
};

const toApiType = (type?: string | null): string => {
  if (!type) return 'ssl';
  const key = String(type).trim().toLowerCase();
  if (key.includes('18w') || key === 'upssl18w' || key === 'ssl18w') return 'upssl18w';
  if (key.includes('12w') || key === 'upssl12w' || key === 'ssl12w') return 'upssl12w';
  if (key === 'ssl') return 'ssl';
  return key;
};

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('UID No', ['uid', 'uid_no', 'uuid_no', 'system_id'], { accent: true }),
  {
    header: 'SSL Type',
    cell: (row) => {
      const formatted = formatSslType(row.ssl_type);
      return formatted === '—' ? (
        <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
      ) : (
        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
          {formatted}
        </span>
      );
    },
    exportValue: (row) => formatSslType(row.ssl_type),
  },
  T('Complaint Date', ['start_date', 'complaint_date', 'created_date', 'created_at']),
  T('Complaint Issue', ['complaint_issue', 'issue', 'complaint']),
  T('Complaint', ['complaint', 'complaint_issue'], { clamp: true }),
  T('Complaint Source', ['complaint_source']),
  T('State', ['state'], { fallback: 'Uttar Pradesh' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Panchayat', ['panchyat', 'panchayat', 'panchayt']),
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
        pick(c, ['uid', 'uid_no', 'uuid_no', 'system_id'], ''),
        formatSslType(c.ssl_type),
        pick(c, ['pole_no'], ''),
        pick(c, ['luminary_no'], ''),
        pick(c, ['light_no'], ''),
        pick(c, ['beneficiary_name'], ''),
        pick(c, ['contact_no', 'contact_number'], ''),
        pick(c, ['district'], ''),
        pick(c, ['block'], ''),
        pick(c, ['panchyat', 'panchayat', 'panchayt'], ''),
        pick(c, ['ward_no'], ''),
        pick(c, ['battery_serial_no', 'battery_no'], ''),
        pick(c, ['module_no', 'panel_no'], ''),
        pick(c, ['complaint_issue', 'issue', 'complaint'], ''),
        pick(c, ['complaint_source'], ''),
        pick(c, ['created_by'], ''),
        pick(c, ['start_date', 'complaint_date', 'created_at'], ''),
      ]}
      exportName="UP_SSL_Assigned"
      exportTitle="UP SSL Assigned Complaints"
      closeOnApproved={true}
      detail={{
        eyebrow: 'Solar Street Light',
        fields: (r: Row): DetailField[] => [
          { label: 'UID No', value: pick(r, ['uid', 'uid_no', 'uuid_no', 'system_id']) },
          { label: 'SSL Type', value: formatSslType(r.ssl_type) },
          { label: 'State', value: pick(r, ['state'], 'Uttar Pradesh') },
          { label: 'District', value: pick(r, ['district']) },
          { label: 'Block', value: pick(r, ['block']) },
          { label: 'Panchayat', value: pick(r, ['panchyat', 'panchayat', 'panchayt']) },
          { label: 'Address', value: pick(r, ['address']) },
          { label: 'Ward No', value: pick(r, ['ward_no']) },
          { label: 'Pole No', value: pick(r, ['pole_no']) },
          { label: 'Light No', value: pick(r, ['light_no']) },
          { label: 'Luminary No', value: pick(r, ['luminary_no']) },
          { label: 'Beneficiary', value: pick(r, ['beneficiary_name']) },
          { label: 'Contact', value: pick(r, ['contact_no', 'contact_number']) },
          { label: 'Latitude / Longitude', value: `${pick(r, ['latitude'])}, ${pick(r, ['longitude'])}` },
          { label: 'Along with Pole', value: pick(r, ['along_with_pole']) },
          { label: 'Battery Serial No', value: pick(r, ['battery_serial_no', 'battery_no']) },
          { label: 'Module No', value: pick(r, ['module_no', 'panel_no']) },
          { label: 'SIM No', value: pick(r, ['sim_no']) },
          { label: 'Date of Installation', value: pick(r, ['date_of_installation', 'installation_date']) },
          { label: 'Complaint Issue', value: pick(r, ['complaint_issue', 'issue', 'complaint']) },
          { label: 'Complaint Description', value: pick(r, ['complaint']) },
          { label: 'Complaint Source', value: pick(r, ['complaint_source']) },
          { label: 'Created By', value: getLoggedInUserName() || pick(r, ['created_by_name', 'created_by']) },
          { label: 'Assigned Date', value: pick(r, ['assigned_date', 'start_date', 'created_at']) },
        ],
      }}
      close={{
        heading: 'Close SSL Complaint',
        variant: 'resolver',
        defaultSuccess: 'SSL Complaint closed successfully!',
        summary: (c) => [
          { label: 'SSL Type', value: formatSslType(c.ssl_type) },
          { label: 'Complaint Type', value: String(c.complaint_type || formatSslType(c.ssl_type)) },
          { label: 'Pole No', value: pick(c, ['pole_no']) },
          { label: 'Luminary No', value: pick(c, ['luminary_no']) },
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_no', 'contact_number']) },
          { label: 'Location', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}, ${pick(c, ['panchayat', 'panchyat', 'panchayt'])}` },
          { label: 'Issue', value: pick(c, ['complaint_issue', 'issue', 'complaint']) },
        ],
        remarksPlaceholder: 'Describe repairs completed (e.g. replaced battery, luminary repair, wiring fixed)…',
        fileLabel: 'Resolution Proof 1 / Repair Photo (Required)',
        fileHint: 'Site repair photo or rectified glowing light photo (Required)',
        file1Label: 'Resolution Proof 2 / Sign-off Sheet (Required)',
        file1Hint: 'Customer satisfaction sign-off sheet or secondary site photo (Required)',
        file1Required: true,
        submit: (v, item) => {
          const fd = new FormData();
          fd.append('complain_id', String(item.id || item.complaint_id || ''));
          fd.append('id', String(item.id || ''));
          if (item.complaint_id) fd.append('complaint_id', String(item.complaint_id));

          // Backend requires complaint_type! (e.g. upssl18w / upssl12w / ssl)
          const cType = String(
            item.complaint_type ||
            (item.ssl_type ? toApiType(item.ssl_type) : '') ||
            (item.type ? toApiType(item.type) : '') ||
            'ssl'
          ).trim();
          fd.append('complaint_type', cType);
          if (item.ssl_type) fd.append('ssl_type', toApiType(item.ssl_type));
          if (item.type) fd.append('type', toApiType(item.type));

          fd.append('resolved_by', v.resolvedBy);
          if (v.email) {
            fd.append('r_email', v.email);
            fd.append('email', v.email);
          }
          fd.append('r_mobile', v.mobile);
          fd.append('mobile', v.mobile);
          fd.append('manual_close_date', v.date);
          fd.append('closing_date', v.date);
          fd.append('close_date', v.date);
          fd.append('remarks', v.remarks);
          fd.append('close_sms', v.closeSms);
          fd.append('sms', v.closeSms);

          if (item.beneficiary_name) {
            fd.append('beneficiary_name', String(item.beneficiary_name));
            fd.append('close_beneficiary_name', String(item.beneficiary_name));
          }
          if (item.contact_no) {
            fd.append('contact_no', String(item.contact_no));
            fd.append('close_beneficiary_contact', String(item.contact_no));
          }

          if (v.file) {
            fd.append('r_file', v.file);
            fd.append('document', v.file);
            fd.append('file', v.file);
          }
          const file2 = v.file1 || v.file;
          if (file2) {
            fd.append('r_file2', file2);
            fd.append('r_file1', file2);
            fd.append('file1', file2);
            fd.append('file2', file2);
          }
          return upComplaintService.closeSslComplaint(fd);
        },
      }}
    />
  );
}

export const UP_Complaint_SSL_AssignedComplaint = UPComplaintSSLAssigned;
export default UPComplaintSSLAssigned;
