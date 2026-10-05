import { PageHead } from '../../../../shell/PageHead';

export function SWPDashboard() {
  const stats = [
    { label: 'Total SWP Pumps Sanctioned', value: '4,850', badge: 'KUSUM Scheme' },
    { label: 'Installed Solar Pumps', value: '3,210', badge: '66% Completed' },
    { label: 'Pending District Allocations', value: '540', badge: 'Action Required' },
    { label: 'Total Disbursed Payment', value: '₹ 18.4 Cr', badge: 'Settled' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SWP - Solar Water Pump Dashboard"
        subtitle="Operational metrics and district stats for Solar Water Pump installations in Jammu"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
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

export default SWPDashboard;
