import { PageHead } from '../../../../shell/PageHead';

export function SSLAMC() {
  const complaints = [
    { complaintId: 'CMP-SSL-001', location: 'Gandhi Nagar Ward 5', issue: 'Luminaire Failure', date: '2026-09-24', status: 'Open' },
    { complaintId: 'CMP-SSL-002', location: 'Trikuta Nagar Pole 42', issue: 'Battery Drain', date: '2026-09-22', status: 'Resolved' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu AMC - SSL Complaints & Maintenance"
        subtitle="Annual Maintenance Contract (AMC) tracker for Solar Street Lights"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View SSL Complaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SSL Complaints Log</h3>
          </div>
          <div className="ax-card__body">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Complaint ID</th>
                  <th style={{ padding: '12px 8px' }}>Location / Pole</th>
                  <th style={{ padding: '12px 8px' }}>Reported Issue</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.complaintId} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{c.complaintId}</td>
                    <td style={{ padding: '12px 8px' }}>{c.location}</td>
                    <td style={{ padding: '12px 8px' }}>{c.issue}</td>
                    <td style={{ padding: '12px 8px' }}>{c.date}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`ax-badge ${c.status === 'Resolved' ? 'ax-badge--success' : 'ax-badge--warning'}`} style={{ padding: '4px 8px' }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SSLAMC;
