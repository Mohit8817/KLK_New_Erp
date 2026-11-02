import {
  upComplaintService,
  type UpPowerpackComplaintItem,
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
  statusCol<Row>(),
];

export function UPComplaintPPView() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP Power Pack Complaints"
      subtitle="Manage and track solar power pack breakdown and repair tickets"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'Power Pack' },
      ]}
      addLink="/v/complaint/up/powerpack/add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor Power Pack Complaint Data"
      searchPlaceholder="Search ID, name, block, village, UID…"
      loadingText="Loading Power Pack complaints…"
      emptyMessage="Power Pack complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getPowerpackViewComplaints()}
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
      detailEyebrow="Power Pack Complaint Details"
      detailFields={(c) => [
        { label: 'Beneficiary Name', value: pick(c, ['beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_number', 'contact_no']) },
        { label: 'Gender', value: pick(c, ['gender']) },
        { label: 'District / State', value: `${pick(c, ['district'])}, ${pick(c, ['state'], 'UP')}` },
        { label: 'Block / Village', value: `${pick(c, ['block'])} / ${pick(c, ['village'])}` },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'UID No.', value: pick(c, ['uid', 'uid_no']) },
        { label: 'Empanelled Agency', value: pick(c, ['empanelled_agency', 'empanelled_agencies']) },
        { label: 'Installation Status', value: pick(c, ['installation', 'installation_status']) },
        { label: 'Geo Coordinates', value: `${pick(c, ['latitude'])}, ${pick(c, ['longitude'])}` },
        { label: 'Contractor Name', value: pick(c, ['contractor_name']) },
        { label: 'Installation Date', value: pick(c, ['installation_date']) },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
        { label: 'Address', value: pick(c, ['address']) },
      ]}
      exportName="UP_Powerpack_Complaints"
      exportTitle="UP Power Pack Complaints"
    />
  );
}

export default UPComplaintPPView;