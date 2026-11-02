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
      close={{
        heading: 'Close Power Pack Complaint',
        defaultSuccess: 'Power Pack Complaint closed successfully!',
        summary: (c) => [
          { label: 'Beneficiary', value: pick(c, ['beneficiary_name']) },
          { label: 'Contact', value: pick(c, ['contact_number', 'contact_no']) },
          { label: 'District / Block', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}` },
          { label: 'UID No.', value: pick(c, ['uid', 'uid_no']) },
        ],
        remarksPlaceholder: 'Describe resolution details (e.g. serviced battery terminal, replaced bypass diode)…',
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
          return upComplaintService.closePowerpackComplaint(fd);
        },
      }}
    />
  );
}

export default UPComplaintPPAssigned;