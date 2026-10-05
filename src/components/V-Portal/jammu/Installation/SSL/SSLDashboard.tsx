import { PageHead } from '../../../../shell/PageHead';

export function SSLDashboard() {
  const stats = [
    { label: 'Total Solar Street Lights (SSL)', value: '15,400', badge: 'Sanctioned' },
    { label: 'Installed Lights', value: '11,250', badge: '73%' },
    { label: 'Assigned Vendors', value: '18', badge: 'Active' },
    { label: 'Pending Inspections', value: '820', badge: 'In Review' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SSL - Solar Street Lights Dashboard"
        subtitle="Overview of Solar Street Light installations across Jammu & Kashmir municipal zones"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Dashboard' },
        ]}
      />

      <div className="ax-dash-grid">
        {stats.map((st) => (
          <div key={st.label} className="ax-card ax-col--3">
            <div className="ax-card__body">
              <span style={{ fontSize: '13px', color: 'var(--ax-muted)' }}>{st.label}</span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{st.value}</h2>
              <span className="ax-badge ax-badge--info" style={{ fontSize: '11px' }}>{st.badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SSLDashboard;
