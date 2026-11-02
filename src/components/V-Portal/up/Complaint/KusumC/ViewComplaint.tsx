import {
  upComplaintService,
  type UpKusumCComplaintItem,
} from '../../up-services';
import {
  ComplaintViewPage,
  StatusBadge,
  documentCol,
  pick,
  statusCol,
  textCol,
  type ComplaintColumn,
} from '../CommonSharedComplaints/ViewComplaints';

const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) =>
  textCol<UpKusumCComplaintItem>(h, keys, o);

const COLUMNS: ComplaintColumn<UpKusumCComplaintItem>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Post', ['post']),
  T('Village', ['village']),
  T('Farmer Name', ['farmer_name', 'beneficiary_name'], { strong: true }),
  T('Father Name', ['father_name']),
  T('Contact No', ['contact_no']),
  T('Lot No', ['lot_no']),
  T('Pump Capacity', ['pump_capacity'], { strong: true }),
  T('Contractor Name', ['contractor_name']),
  T('Contractor No', ['contractor_mobile_no', 'contractor_no']),
  T('Installation Date', ['installation_date']),
  documentCol<UpKusumCComplaintItem>(),
  T('Assigned Date', ['assigned_date']),
  statusCol<UpKusumCComplaintItem>(),
  T('Created By', ['created_by']),
];

export function UPComplaintKCView() {
  return (
    <ComplaintViewPage<UpKusumCComplaintItem>
      title="View Vendor Kusum C Complaints"
      subtitle="Manage and track vendor solar pump maintenance requests"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Kusum C' },
      ]}
      addLink="/v/complaint/up/swp-add-complaint"
      addLabel="Add Complaint"
      cardTitle="Report Bifurcation Details"
      searchPlaceholder="Search ID, farmer, village, contact, pump…"
      loadingText="Loading Kusum C complaints…"
      emptyMessage="Kusum C complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getKusumCViewComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['farmer_name', 'beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['post'], ''),
        pick(c, ['village'], ''),
        pick(c, ['contact_no'], ''),
        pick(c, ['pump_capacity'], ''),
        pick(c, ['complaint'], ''),
      ]}
      detailEyebrow="Kusum C (SWP) Complaint Details"
      detailFields={(c) => [
        { label: 'Farmer / Beneficiary', value: pick(c, ['farmer_name', 'beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_no']) },
        { label: 'Father Name', value: pick(c, ['father_name']) },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
        { label: 'Post / Village', value: `${pick(c, ['post'])} / ${pick(c, ['village'])}` },
        { label: 'Pump Capacity', value: pick(c, ['pump_capacity']) },
        { label: 'Lot No. / Invoice No.', value: `${pick(c, ['lot_no'])} / ${pick(c, ['invoice_no'])}` },
        {
          label: 'Contractor Name / Mobile',
          value: `${pick(c, ['contractor_name'])}${
            pick(c, ['contractor_mobile_no'], '') ? ` (${pick(c, ['contractor_mobile_no'])})` : ''
          }`,
        },
        { label: 'Installation Date', value: pick(c, ['installation_date']) },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
      ]}
      exportName="UP_KusumC_Complaints"
      exportTitle="UP Kusum C Complaints"
    />
  );
}

export default UPComplaintKCView;