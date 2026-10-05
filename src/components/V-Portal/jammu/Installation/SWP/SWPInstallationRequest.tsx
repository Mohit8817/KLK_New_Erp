import { PageHead } from '../../../../shell/PageHead';

export function SWPInstallationRequest() {
  const requests = [
    { reqId: 'SWP-REQ-401', farmerName: 'Gurdeep Singh', district: 'Jammu', pumpHp: '5 HP', vendor: 'KLK Renewable', status: 'Approved' },
    { reqId: 'SWP-REQ-402', farmerName: 'Mohd Rashid', district: 'Rajouri', pumpHp: '7.5 HP', vendor: 'SunEnergy Ltd', status: 'Pending Verification' },
    { reqId: 'SWP-REQ-403', farmerName: 'Ramesh Sharma', district: 'Kathua', pumpHp: '3 HP', vendor: 'GreenPumps Corp', status: 'Assigned' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SWP - Installation Request"
        subtitle="View and allocate farmer solar pump installation requests"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Installation Request' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SWP Installation Requests</h3>
          </div>
          <div className="ax-card__body">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Request ID</th>
                  <th style={{ padding: '12px 8px' }}>Farmer Name</th>
                  <th style={{ padding: '12px 8px' }}>District</th>
                  <th style={{ padding: '12px 8px' }}>Pump Rating</th>
                  <th style={{ padding: '12px 8px' }}>Assigned Vendor</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.reqId} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{r.reqId}</td>
                    <td style={{ padding: '12px 8px' }}>{r.farmerName}</td>
                    <td style={{ padding: '12px 8px' }}>{r.district}</td>
                    <td style={{ padding: '12px 8px' }}>{r.pumpHp}</td>
                    <td style={{ padding: '12px 8px' }}>{r.vendor}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="ax-badge ax-badge--info" style={{ padding: '4px 8px' }}>{r.status}</span>
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

export default SWPInstallationRequest;
