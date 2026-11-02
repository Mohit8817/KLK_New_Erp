import {
  upComplaintService,
  type UpKusumBComplaintItem,
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
  textCol<UpKusumBComplaintItem>(h, keys, o);

const COLUMNS: ComplaintColumn<UpKusumBComplaintItem>[] = [
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
  documentCol<UpKusumBComplaintItem>(),
  T('Assigned Date', ['assigned_date']),
  statusCol<UpKusumBComplaintItem>(),
  T('Created_by', ['created_by']),
];

export function UPComplaintKBView() {
  return (
    <ComplaintViewPage<UpKusumBComplaintItem>
      title="View Vendor UP Kusum B Complaints"
      subtitle="Track and resolve standalone solar pump maintenance requests"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Kusum B' },
      ]}
      addLink="/v/complaint/up/kusumb-add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor UP Kusum B Complaints"
      searchPlaceholder="Search ID, name, village, contact, Saral ID…"
      loadingText="Loading Kusum B complaints…"
      emptyMessage="Kusum B complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getKusumBViewComplaints()}
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
      detailEyebrow="Kusum Component-B Complaint"
      detailFields={(c) => [
        { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_no']) },
        { label: 'Application No.', value: pick(c, ['application_no']) },
        { label: 'Father Name', value: pick(c, ['father_name']) },
        { label: 'Location / Village', value: `${pick(c, ['location'])} / ${pick(c, ['village'])}` },
        { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
        { label: 'Saral ID', value: pick(c, ['saral_id']) },
        { label: 'Category', value: pick(c, ['category']) },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'Pump Type / Make', value: `${pick(c, ['pump_type', 'pump_sub_type'])} / ${pick(c, ['pump_make'])}` },
        { label: 'Module Make / SPV', value: `${pick(c, ['module_make'])} / ${pick(c, ['spv_capacity'])}` },
        { label: 'Total Pump Cost', value: pick(c, ['total_pump_cost']) },
        { label: 'Installation Date', value: pick(c, ['installation_date']) },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
        { label: 'Created By', value: pick(c, ['created_by']) },
      ]}
      exportName="UP_KusumB_Complaints"
      exportTitle="UP Kusum B Complaints"
    />
  );
}

export default UPComplaintKBView;