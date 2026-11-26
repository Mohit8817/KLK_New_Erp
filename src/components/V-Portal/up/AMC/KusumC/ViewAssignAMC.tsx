import {
  UpAmcTablePage,
  DocThumb,
  resolveUpMediaUrl,
  amcStatusCol,
  type AmcColumn,
  type CellCtx,
  type DetailField,
} from '../CommonSharedAMC';
import { upKusumCAmcApi } from '../../up-services';

export function UP_AMC_KusumC_ViewAssignAMC() {
  const fetchAssigned = async () => {
    const res = await upKusumCAmcApi.fetchViewAssignSite();
    if (!res || !res.status || !Array.isArray(res.data)) return [];
    return res.data;
  };

  const columns: AmcColumn<any>[] = [
    {
      header: 'AMC Type',
      cell: (r: any) => {
        const t = String(r.amc_type || '—').toUpperCase();
        if (t === 'M') return <span className="ax-badge ax-badge--soft ax-badge--primary">Monthly (M)</span>;
        if (t === 'Q') return <span className="ax-badge ax-badge--soft ax-badge--info">Quarterly (Q)</span>;
        if (t === 'H') return <span className="ax-badge ax-badge--soft ax-badge--warning">Half-Yearly (H)</span>;
        if (t === 'Y') return <span className="ax-badge ax-badge--soft ax-badge--success">Yearly (Y)</span>;
        return <span className="ax-badge ax-badge--soft">{r.amc_type || '—'}</span>;
      },
      exportValue: (r: any) => (r.amc_type === 'M' ? 'Monthly' : r.amc_type || '—'),
    },
    {
      header: 'State',
      cell: (r: any) => (
        <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
          {r.state || '—'}
        </span>
      ),
      exportValue: (r: any) => (r.state ? String(r.state).toUpperCase() : '—'),
    },
    {
      header: 'District',
      cell: (r: any) => (
        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
          {r.district || '—'}
        </span>
      ),
      exportValue: (r: any) => r.district || '—',
    },
    {
      header: 'Project',
      cell: (r: any) => {
        const p = String(r.project || '—');
        return <span style={{ fontWeight: 500 }}>{p.toLowerCase() === 'kusumc' ? 'Kusum C' : p}</span>;
      },
      exportValue: (r: any) => (r.project === 'kusumc' ? 'Kusum C' : r.project || '—'),
    },
    {
      header: 'Purpose',
      cell: (r: any) => (
        <span style={{ textTransform: 'uppercase' }}>
          {r.purpose || '—'}
        </span>
      ),
      exportValue: (r: any) => (r.purpose ? String(r.purpose).toUpperCase() : '—'),
    },
    {
      header: 'Amc Date',
      cell: (r: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {r.amc_date ? String(r.amc_date).split('T')[0] : '—'}
        </span>
      ),
      exportValue: (r: any) => (r.amc_date ? String(r.amc_date).split('T')[0] : '—'),
    },
    {
      header: 'Applicant Name',
      cell: (r: any) => {
        const name = r.applicant_name || r.farmer_name || r.beneficiary_name || r.f_farmer_name || r.site_name || '—';
        return <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{name}</span>;
      },
      exportValue: (r: any) => r.applicant_name || r.farmer_name || r.beneficiary_name || r.f_farmer_name || r.site_name || '—',
    },
    {
      header: 'Site Count',
      cell: (r: any) => (
        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 600 }}>
          {r.site_count ?? (Array.isArray(r.site_id) ? r.site_id.length : '1')}
        </span>
      ),
      exportValue: (r: any) => String(r.site_count ?? '1'),
    },
    {
      header: 'Document File',
      cell: (r: any, ctx: CellCtx) => {
        const fileUrl = r.file ? resolveUpMediaUrl(r.file) : '';
        if (!fileUrl) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
        const isPdf = /\.pdf$/i.test(fileUrl.split('?')[0]);
        const isImg = !isPdf && !/\.(docx?|xlsx?|csv|zip)$/i.test(fileUrl.split('?')[0]);
        if (isImg) {
          return (
            <DocThumb
              url={fileUrl}
              alt={`Document #${r.id}`}
              onPreview={ctx.openPreview}
              size={36}
            />
          );
        }
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              height: 28,
              padding: '0 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--ax-border, #e2e8f0)',
              color: 'var(--ax-primary-default, #2563eb)',
              textDecoration: 'none',
            }}
            title="Open Document ↗"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{isPdf ? 'PDF' : 'Doc'} ↗</span>
          </a>
        );
      },
      exportValue: (r: any) => (r.file ? resolveUpMediaUrl(r.file) : '—'),
    },
    {
      header: 'Remarks',
      cell: (r: any) => (
        <span
          title={r.remarks || ''}
          style={{
            display: 'block',
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {r.remarks || '—'}
        </span>
      ),
      exportValue: (r: any) => r.remarks || '—',
    },
    {
      header: 'Assigned Date',
      cell: (r: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {r.assign_date ? String(r.assign_date).split('T')[0] : (r.assigned_date ? String(r.assigned_date).split('T')[0] : '—')}
        </span>
      ),
      exportValue: (r: any) => (r.assign_date ? String(r.assign_date).split('T')[0] : r.assigned_date || '—'),
    },
    {
      header: 'Assigned Vendor',
      cell: (r: any) => (
        <span style={{ fontWeight: 500 }}>
          {r.vendor_name || r.assigned_vendor || r.vendor || '—'}
        </span>
      ),
      exportValue: (r: any) => String(r.vendor_name || r.assigned_vendor || r.vendor || '—'),
    },
    {
      header: 'Created By',
      cell: (r: any) => <span>{r.created_by || '—'}</span>,
      exportValue: (r: any) => String(r.created_by || '—'),
    },
    amcStatusCol('Status'),
  ];

  const searchFields = (r: any) => [
    r.id,
    r.amc_type,
    r.state,
    r.district,
    r.project,
    r.purpose,
    r.amc_date,
    r.applicant_name,
    r.farmer_name,
    r.beneficiary_name,
    r.f_farmer_name,
    r.site_count,
    r.remarks,
    r.assign_date,
    r.vendor,
    r.vendor_name,
    r.created_by,
    r.site_id,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Assignment ID', value: `#${r.id}` },
    { label: 'AMC Type', value: r.amc_type === 'M' ? 'Monthly (M)' : r.amc_type || '—' },
    { label: 'State', value: r.state ? String(r.state).toUpperCase() : '—' },
    { label: 'District', value: r.district || '—' },
    { label: 'Project', value: r.project === 'kusumc' ? 'Kusum C' : r.project || '—' },
    { label: 'Purpose', value: r.purpose ? String(r.purpose).toUpperCase() : '—' },
    { label: 'Amc Date', value: r.amc_date ? String(r.amc_date).split('T')[0] : '—' },
    { label: 'Applicant Name', value: r.applicant_name || r.farmer_name || r.beneficiary_name || r.f_farmer_name || r.site_name || '—' },
    { label: 'Site Count', value: String(r.site_count ?? (Array.isArray(r.site_id) ? r.site_id.length : '1')) },
    {
      label: 'Document File',
      value: r.file ? (
        <a
          href={resolveUpMediaUrl(r.file)}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'underline' }}
        >
          View Document File
        </a>
      ) : '—',
    },
    { label: 'Remarks', value: r.remarks || '—' },
    { label: 'Assigned Date', value: r.assign_date ? String(r.assign_date).split('T')[0] : (r.assigned_date ? String(r.assigned_date).split('T')[0] : '—') },
    { label: 'Assigned Vendor', value: String(r.vendor_name || r.assigned_vendor || r.vendor || '—') },
    { label: 'Created By', value: String(r.created_by || '—') },
    { label: 'Volume', value: r.volume || '—' },
    { label: 'Company ID', value: r.company_id || '—' },
    { label: 'Site IDs', value: Array.isArray(r.site_id) ? r.site_id.join(', ') : String(r.site_id || '—') },
  ];

  return (
    <UpAmcTablePage
      title="UP Kusum C — View Assign AMC"
      subtitle="View all assigned AMC sites, schedules, documents and vendor allocations for PM Kusum Component-C"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum C' },
        { label: 'View Assign AMC' },
      ]}
      addLink="/v/up/kusumc/amc/assign-site"
      addLabel="Pending AMC"
      cardTitle="Assigned Kusum C AMC Sites"
      searchPlaceholder="Search type, project, state, district, vendor, remarks…"
      loadingText="Loading assigned Kusum C AMC sites…"
      emptyMessage="No Kusum C AMC assignments found."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned Kusum C AMC Details"
      detailTitle={(r: any) => `Assignment #${r.id} — ${r.applicant_name || r.farmer_name || r.project || 'Kusum C'}`}
      detailFields={detailFields}
      exportName="up_kusumc_view_assign_amc"
      exportTitle="UP Kusum C View Assign AMC"
    />
  );
}

export default UP_AMC_KusumC_ViewAssignAMC;