import {
  UpAmcTablePage,
  DocThumb,
  resolveUpMediaUrl,
  type AmcColumn,
  type CellCtx,
  type DetailField,
} from '../CommonSharedAMC';
import { upKusumBAmcApi } from '../../up-services';

const formatSiteIds = (val: any): string => {
  if (!val) return '—';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {}
    }
    return trimmed;
  }
  return String(val);
};

const formatAmcType = (type?: string) => {
  const t = String(type || '').toUpperCase().trim();
  if (t === 'M' || t === '1') return 'Monthly (M)';
  if (t === 'Q' || t === '3') return 'Quarterly (Q)';
  if (t === 'H' || t === '6') return 'Half-Yearly (H)';
  if (t === 'Y' || t === '12') return 'Yearly (Y)';
  return t ? `Type ${t}` : 'Monthly (M)';
};

const formatDate = (val?: string) => {
  if (!val) return '—';
  return String(val).split('T')[0];
};

export function UP_AMC_KusumB_ViewAssignAMC() {
  const fetchAssigned = async () => {
    let res: any;
    try {
      res = await upKusumBAmcApi.fetchViewAssignSite();
    } catch (e) {
      console.error('[Kusum B AMC] fetchViewAssignSite error:', e);
    }

    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res)
      ? res
      : [];

    const rows: any[] = [];
    rawList.forEach((assign: any) => {
      if (Array.isArray(assign.reports) && assign.reports.length > 0) {
        assign.reports.forEach((rep: any) => {
          rows.push({
            ...assign,
            ...rep,
            assignment_id: assign.id,
            amc_date: rep.amc_date || assign.amc_date,
            assign_date: rep.assign_date || assign.assign_date,
          });
        });
      } else {
        rows.push(assign);
      }
    });
    return rows;
  };

  const columns: AmcColumn<any>[] = [
    {
      header: 'Assign ID',
      cell: (r: any) => <span style={{ fontWeight: 700, color: '#1e293b' }}>#{r.id}</span>,
      exportValue: (r: any) => `#${r.id}`,
    },
    {
      header: 'AMC Type',
      cell: (r: any) => {
        const label = formatAmcType(r.amc_type);
        return <span className="ax-badge ax-badge--soft ax-badge--primary">{label}</span>;
      },
      exportValue: (r: any) => formatAmcType(r.amc_type),
    },
    {
      header: 'District',
      cell: (r: any) => (
        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
          {r.district || r.installation_dsitrict || '—'}
        </span>
      ),
      exportValue: (r: any) => r.district || r.installation_dsitrict || '—',
    },
    {
      header: 'Farmer / Beneficiary',
      cell: (r: any) => {
        const name = r.beneficiary_name || r.farmer_name || r.applicant_name || r.site_name || '—';
        return <span style={{ fontWeight: 600 }}>{name}</span>;
      },
      exportValue: (r: any) => r.beneficiary_name || r.farmer_name || r.applicant_name || r.site_name || '—',
    },
    {
      header: 'Volume / Sites',
      cell: (r: any) => {
        const count = r.site_count ?? (Array.isArray(r.site_id) ? r.site_id.length : '1');
        const ids = formatSiteIds(r.site_id);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 600 }}>{count} Site{String(count) === '1' ? '' : 's'}</span>
            <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>#{ids}</span>
          </div>
        );
      },
      exportValue: (r: any) => `${r.site_count ?? 1} (${formatSiteIds(r.site_id)})`,
    },
    {
      header: 'Assign Date',
      cell: (r: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {formatDate(r.amc_date || r.assign_date)}
        </span>
      ),
      exportValue: (r: any) => formatDate(r.amc_date || r.assign_date),
    },
    {
      header: 'Work Order / File',
      cell: (r: any, ctx: CellCtx) => {
        const fileUrl = r.file ? resolveUpMediaUrl(r.file) : '';
        if (!fileUrl) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
        const isImg = /\.(jpe?g|png|webp|gif)$/i.test(fileUrl);
        if (isImg) {
          return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <DocThumb url={fileUrl} alt={`Doc #${r.id}`} onPreview={ctx.openPreview} size={30} />
              <button
                type="button"
                onClick={() => ctx.openPreview(fileUrl, `Document #${r.id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ax-primary-default, #2563eb)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 12,
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                View
              </button>
            </div>
          );
        }
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="ax-btn ax-btn--ghost ax-btn--sm"
            style={{ height: 26, padding: '0 8px', fontSize: 12 }}
          >
            View File ↗
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
      header: 'Status',
      cell: (r: any) => {
        const isComplete = String(r.status) === '1' || String(r.status).toLowerCase() === 'completed';
        return (
          <span className={`ax-badge ax-badge--soft ${isComplete ? 'ax-badge--success' : 'ax-badge--warning'}`}>
            <span className="ax-badge__dot" />
            {isComplete ? 'Completed' : 'Assigned'}
          </span>
        );
      },
      exportValue: (r: any) => (String(r.status) === '1' ? 'Completed' : 'Assigned'),
    },
  ];

  const searchFields = (r: any) => [
    r.id,
    r.district,
    r.installation_dsitrict,
    r.project,
    r.volume,
    r.amc_type,
    r.amc_date,
    r.assign_date,
    r.remarks,
    r.site_id,
    r.site_count,
    r.beneficiary_name,
    r.farmer_name,
    r.applicant_name,
    r.site_name,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Assignment ID', value: `#${r.id}` },
    { label: 'Project', value: 'PM-KUSUM Component-B Solar Pump' },
    { label: 'State', value: r.state ? String(r.state).toUpperCase() : 'UP' },
    { label: 'District', value: r.district || r.installation_dsitrict || '—' },
    { label: 'Farmer / Beneficiary', value: r.beneficiary_name || r.farmer_name || r.applicant_name || r.site_name || '—' },
    { label: 'Contact', value: r.beneficiary_contact || r.mobile || r.contact || '—' },
    { label: 'Volume / Capacity', value: r.volume ? `${r.volume} HP` : '—' },
    { label: 'Site Count', value: String(r.site_count ?? '1') },
    { label: 'Site ID(s)', value: formatSiteIds(r.site_id) },
    { label: 'AMC Frequency', value: formatAmcType(r.amc_type) },
    { label: 'AMC Date', value: formatDate(r.amc_date) },
    { label: 'Assign Date', value: formatDate(r.assign_date) },
    {
      label: 'Work Order / File',
      value: r.file ? (
        <a href={resolveUpMediaUrl(r.file)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
          View Document ↗
        </a>
      ) : '—',
    },
    { label: 'Remarks', value: r.remarks || '—' },
    {
      label: 'AMC Status',
      value: String(r.status) === '1' ? 'Completed' : 'Assigned / Pending Execution',
    },
  ];

  return (
    <UpAmcTablePage
      title="UP Kusum B — Assigned AMC Sites"
      subtitle="View all Solar Agriculture Pump sites assigned under PM Kusum Component-B"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum B' },
        { label: 'View Assigned AMC' },
      ]}
      addLink="/v/up/kusumb/amc/assign-site"
      addLabel="Pending AMC"
      cardTitle="Assigned Kusum B Pump Sites"
      searchPlaceholder="Search assignment ID, farmer, district, volume, AMC type…"
      loadingText="Loading assigned Kusum B sites…"
      emptyMessage="No Kusum B sites currently assigned for AMC."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned Kusum B Site Details"
      detailTitle={(r: any) => r.beneficiary_name || r.farmer_name || `Kusum B Assignment #${r.id} (${r.district || 'UP'})`}
      detailFields={detailFields}
      exportName="up_kusumb_assigned_sites"
      exportTitle="UP Kusum B Assigned AMC Sites"
    />
  );
}

export default UP_AMC_KusumB_ViewAssignAMC;
