import { PageHead } from '../../../../shell/PageHead';

export function ClaimRequest() {
  const claims = [
    { claimId: 'CLM-SRT-801', vendor: 'SolarTech Energy', amount: '₹ 12,40,000', date: '2026-09-15', status: 'Approved' },
    { claimId: 'CLM-SRT-802', vendor: 'KLK Renewable Ltd', amount: '₹ 24,50,000', date: '2026-09-20', status: 'Pending Review' },
    { claimId: 'CLM-SRT-803', vendor: 'GreenWave Solar', amount: '₹ 8,15,000', date: '2026-09-22', status: 'Approved' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - Claim Request"
        subtitle="Vendor installation subsidy and milestone claim processing"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Claim Request' },
        ]}
      />

      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="ax-card__title">Installation Claim Requests</h3>
            <button className="ax-btn ax-btn--primary">Submit New Claim</button>
          </div>
          <div className="ax-card__body">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Claim ID</th>
                  <th style={{ padding: '12px 8px' }}>Vendor</th>
                  <th style={{ padding: '12px 8px' }}>Claim Amount</th>
                  <th style={{ padding: '12px 8px' }}>Submission Date</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.claimId} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{c.claimId}</td>
                    <td style={{ padding: '12px 8px' }}>{c.vendor}</td>
                    <td style={{ padding: '12px 8px' }}>{c.amount}</td>
                    <td style={{ padding: '12px 8px' }}>{c.date}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`ax-badge ${c.status === 'Approved' ? 'ax-badge--success' : 'ax-badge--warning'}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <button className="ax-btn ax-btn--sm ax-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>View Details</button>
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

export default ClaimRequest;
