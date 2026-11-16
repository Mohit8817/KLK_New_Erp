import {
  UpAmcTablePage,
  DocThumb,
  resolveUpMediaUrl,
  type AmcColumn,
  type CellCtx,
  type DetailField,
} from '../CommonSharedAMC';
import { upSsl18wAmcApi } from '../../up-services';

const cleanText = (val: any, fallback = '—'): string => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return fallback;
  return s;
};

const formatDate = (val?: string) => {
  if (!val) return '—';
  return String(val).split('T')[0];
};

const formatAmcType = (val: any) => {
  const s = String(val || '').trim();
  if (s === '1') return 'Year 1';
  if (s === '2') return 'Year 2';
  if (s === '3') return 'Year 3';
  if (s === '4') return 'Year 4';
  if (s === '5') return 'Year 5';
  if (s.toUpperCase() === 'M') return 'Monthly (M)';
  if (s.toUpperCase() === 'Q') return 'Quarterly (Q)';
  if (s.toUpperCase() === 'H') return 'Half-Yearly (H)';
  if (s.toUpperCase() === 'Y') return 'Yearly (Y)';
  return s ? `Period ${s}` : 'Year 1';
};

export function UP_AMC_SSL18W_ViewAssignLight() {
  const fetchAssigned = async () => {
    let res: any;
    try {
      res = await upSsl18wAmcApi.getViewAssignLight();
    } catch (e) {
      console.error('[SSL 18W AMC] getViewAssignLight error:', e);
    }

    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res)
      ? res
      : [];

    return rawList;
  };

  const columns: AmcColumn<any>[] = [
    {
      header: 'Assign ID',
      cell: (r: any) => <span style={{ fontWeight: 700, color: '#1e293b' }}>#{r.id}</span>,
      exportValue: (r: any) => `#${r.id}`,
    },
    {
      header: 'District',
      cell: (r: any) => (
        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
          {cleanText(r.district)}
        </span>
      ),
      exportValue: (r: any) => cleanText(r.district),
    },
    {
      header: 'Block',
      cell: (r: any) => <span>{cleanText(r.block)}</span>,
      exportValue: (r: any) => cleanText(r.block),
    },
    {
      header: 'Village',
      cell: (r: any) => <span>{cleanText(r.village)}</span>,
      exportValue: (r: any) => cleanText(r.village),
    },
    {
      header: 'Volume',
      cell: (r: any) => (
        <span className="ax-badge ax-badge--soft" style={{ fontWeight: 600 }}>
          {cleanText(r.volume)} Nos
        </span>
      ),
      exportValue: (r: any) => `${cleanText(r.volume)} Nos`,
    },
    {
      header: 'AMC Period',
      cell: (r: any) => (
        <span className="ax-badge ax-badge--soft ax-badge--primary">
          {formatAmcType(r.amc_type)}
        </span>
      ),
      exportValue: (r: any) => formatAmcType(r.amc_type),
    },
    {
      header: 'Assign Date',
      cell: (r: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {formatDate(r.assign_date || r.start_date || r.amc_date)}
        </span>
      ),
      exportValue: (r: any) => formatDate(r.assign_date || r.start_date || r.amc_date),
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
          title={cleanText(r.remarks, '')}
          style={{
            display: 'block',
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cleanText(r.remarks)}
        </span>
      ),
      exportValue: (r: any) => cleanText(r.remarks),
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const isActive = Number(r.status) === 1 || String(r.status).toLowerCase() === 'active';
        return (
          <span className={`ax-badge ax-badge--soft ${isActive ? 'ax-badge--success' : 'ax-badge--warning'}`}>
            <span className="ax-badge__dot" />
            {isActive ? 'Active' : 'Pending'}
          </span>
        );
      },
      exportValue: (r: any) => (Number(r.status) === 1 ? 'Active' : 'Pending'),
    },
  ];

  const searchFields = (r: any) => [
    r.id,
    r.district,
    r.block,
    r.village,
    r.volume,
    r.amc_type,
    r.assign_date,
    r.start_date,
    r.remarks,
    r.project,
  ];

  const detailFields = (r: any): DetailField[] => [
    { label: 'Assignment ID', value: `#${r.id}` },
    { label: 'Project', value: 'SSL 18W (Solar Street Light)' },
    { label: 'State', value: r.state ? String(r.state).toUpperCase() : 'UP' },
    { label: 'District', value: cleanText(r.district) },
    { label: 'Block', value: cleanText(r.block) },
    { label: 'Village', value: cleanText(r.village) },
    { label: 'Volume (Lights)', value: r.volume ? `${cleanText(r.volume)} Nos` : '—' },
    { label: 'AMC Period', value: formatAmcType(r.amc_type) },
    { label: 'Assign Date', value: formatDate(r.assign_date || r.start_date) },
    { label: 'Start Date', value: formatDate(r.start_date) },
    {
      label: 'Work Order / File',
      value: r.file ? (
        <a href={resolveUpMediaUrl(r.file)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
          View Document ↗
        </a>
      ) : '—',
    },
    { label: 'Remarks', value: cleanText(r.remarks) },
    { label: 'Assignment Status', value: Number(r.status) === 1 ? 'Active / Assigned' : 'Pending' },
  ];

  return (
    <UpAmcTablePage
      title="UP SSL 18W — Assigned Street Lights"
      subtitle="View all Solar Street Light (SSL 18W) installations assigned to your account for AMC"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL 18W' },
        { label: 'View Assigned Lights' },
      ]}
      addLink="/v/up-ssl18w-amc-create-light"
      addLabel="Pending AMC"
      cardTitle="Assigned SSL 18W Installations"
      searchPlaceholder="Search assignment ID, district, block, village, volume, remarks…"
      loadingText="Loading assigned SSL 18W lights…"
      emptyMessage="No SSL 18W lights currently assigned for AMC."
      fetchData={fetchAssigned}
      columns={columns}
      searchFields={searchFields}
      detailEyebrow="Assigned SSL 18W Details"
      detailTitle={(r: any) => `SSL 18W AMC Assignment #${r.id} (${cleanText(r.district, 'UP')})`}
      detailFields={detailFields}
      exportName="up_ssl18w_assigned_lights"
      exportTitle="UP SSL 18W Assigned AMC Lights"
    />
  );
}

export default UP_AMC_SSL18W_ViewAssignLight;
