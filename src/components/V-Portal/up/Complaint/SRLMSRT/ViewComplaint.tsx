import {
  upComplaintService,
  type UpSrlmsrtComplaintItem,
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

type Row = UpSrlmsrtComplaintItem;
const T = (h: string, keys: string[], o?: Parameters<typeof textCol>[2]) => textCol<Row>(h, keys, o);

const COLUMNS: ComplaintColumn<Row>[] = [
  T('Complaint ID', ['complaint_id', 'id'], { accent: true }),
  T('Complaint Date', ['complaint_date']),
  T('Complaint', ['complaint'], { clamp: true }),
  T('State', ['state'], { fallback: 'UP' }),
  T('District', ['district'], { strong: true }),
  T('Block', ['block']),
  T('Site Name', ['site_name']),
  T('Customer Name', ['customer_name', 'beneficiary_name'], { strong: true }),
  T('Contact No.', ['contact_no']),
  T('CA No.', ['ca_no']),
  T('Capacity', ['capacity'], { strong: true }),
  T('Sanction Load', ['sanction_load']),
  T('Roof Shed Area', ['roof_shed_area']),
  T('Shadow Free Area', ['shadow_free_area']),
  T('Phase', ['phase']),
  T('Installtion', ['installation', 'installtion']),
  T('Installtion Date', ['installation_date', 'installtion_date']),
  T('Required Sqft', ['required_sqft']),
  T('Latitude', ['latitude']),
  T('Longitude', ['longitude']),
  documentCol<Row>(),
  T('Assigned Date', ['assigned_date']),
  statusCol<Row>(),
  T('Created_by', ['created_by']),
];

export function UPComplaintSRLMView() {
  return (
    <ComplaintViewPage<Row>
      title="View Vendor UP SRLMSRT Complaints"
      subtitle="Track and resolve SRLM solar rooftop system customer breakdown reports"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP' },
        { label: 'Complaints' },
        { label: 'SRLMSRT' },
      ]}
      addLink="/v/complaint/up/srlmsrt/add-complaint"
      addLabel="Add Complaint"
      cardTitle="View Vendor UP SRLMSRT Complaint Data"
      searchPlaceholder="Search ID, site, customer, CA no, contact…"
      loadingText="Loading SRLMSRT complaints…"
      emptyMessage="SRLMSRT complaints will appear here once they are registered."
      fetchData={() => upComplaintService.getSrlmsrtViewComplaints()}
      columns={COLUMNS}
      searchFields={(c) => [
        pick(c, ['complaint_id', 'id'], ''),
        pick(c, ['site_name'], ''),
        pick(c, ['customer_name', 'beneficiary_name'], ''),
        pick(c, ['district'], ''),
        pick(c, ['block'], ''),
        pick(c, ['contact_no'], ''),
        pick(c, ['ca_no'], ''),
        pick(c, ['capacity'], ''),
        pick(c, ['complaint'], ''),
      ]}
      detailEyebrow="UP SRLMSRT Complaint Details"
      detailFields={(c) => [
        { label: 'Site Name', value: pick(c, ['site_name']) },
        { label: 'Customer Name', value: pick(c, ['customer_name', 'beneficiary_name']) },
        { label: 'Contact Number', value: pick(c, ['contact_no']) },
        { label: 'District / Block', value: `${pick(c, ['district'])}, ${pick(c, ['block'])}` },
        { label: 'State', value: pick(c, ['state'], 'UP') },
        { label: 'Status', value: <StatusBadge row={c} /> },
        { label: 'Capacity / Sanction Load', value: `${pick(c, ['capacity'])} / ${pick(c, ['sanction_load'])}` },
        { label: 'CA No. / Phase', value: `${pick(c, ['ca_no'])} / ${pick(c, ['phase'])}` },
        {
          label: 'Installation Status / Date',
          value: `${pick(c, ['installation', 'installtion'])} (${pick(c, ['installation_date', 'installtion_date'])})`,
        },
        { label: 'Roof Area / Type', value: `${pick(c, ['roof_shed_area'])} / ${pick(c, ['roof_type'])}` },
        { label: 'Shadow Free / Req Sqft', value: `${pick(c, ['shadow_free_area'])} / ${pick(c, ['required_sqft'])}` },
        { label: 'Coordinates', value: `${pick(c, ['latitude'])}, ${pick(c, ['longitude'])}` },
        { label: 'Complaint Date', value: pick(c, ['complaint_date']) },
        { label: 'Assigned Date', value: pick(c, ['assigned_date']) },
        { label: 'Created By', value: pick(c, ['created_by']) },
      ]}
      exportName="UP_SRLMSRT_Complaints"
      exportTitle="UP SRLMSRT Complaints"
    />
  );
}

export default UPComplaintSRLMView;