import { PageHead } from '../../../../shell/PageHead';

export function AssignLights() {
  const lightAssignments = [
    { block: 'Jammu West Ward 12', poleCount: 120, vendor: 'KLK Energy Pvt Ltd', status: 'Assigned' },
    { block: 'Udhampur Main Market', poleCount: 85, vendor: 'SolarTech Solutions', status: 'In Progress' },
    { block: 'Kathua Rural Sector 4', poleCount: 200, vendor: 'Luminary Renewables', status: 'Assigned' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SSL - Assign Lights"
        subtitle="Assign solar street light poles and battery packs to installation contractors"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Assign Lights' },
        ]}
      />

      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="ax-card__title">Light Pole Allocation</h3>
            <button className="ax-btn ax-btn--primary">Assign New Sector</button>
          </div>
          <div className="ax-card__body">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Ward / Sector Block</th>
                  <th style={{ padding: '12px 8px' }}>Poles Allocated</th>
                  <th style={{ padding: '12px 8px' }}>Assigned Vendor</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lightAssignments.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{a.block}</td>
                    <td style={{ padding: '12px 8px' }}>{a.poleCount} Poles</td>
                    <td style={{ padding: '12px 8px' }}>{a.vendor}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="ax-badge ax-badge--success" style={{ padding: '4px 8px' }}>{a.status}</span>
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

export default AssignLights;
