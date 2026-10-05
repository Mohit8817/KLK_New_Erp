import { useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';

interface InstallSiteRow {
  id: string;
  siteName: string;
  district: string;
  capacity: string;
  vendor: string;
  completionDate: string;
  progress: number;
}

const SITES_DATA: InstallSiteRow[] = [
  { id: 'JK-INS-101', siteName: 'Civil Secretariat Jammu', district: 'Jammu', capacity: '150 kW', vendor: 'SolarTech Energy', completionDate: '2026-09-25', progress: 100 },
  { id: 'JK-INS-102', siteName: 'District Court Complex Udhampur', district: 'Udhampur', capacity: '80 kW', vendor: 'KLK Renewable Ltd', completionDate: '2026-10-05', progress: 75 },
  { id: 'JK-INS-103', siteName: 'Government Medical College Kathua', district: 'Kathua', capacity: '200 kW', vendor: 'GreenWave Solar', completionDate: '2026-10-12', progress: 40 },
  { id: 'JK-INS-104', siteName: 'Polytechnic College Samba', district: 'Samba', capacity: '60 kW', vendor: 'SunPower Solutions', completionDate: '2026-09-28', progress: 90 },
];

export function InstallSites() {
  const [filterText, setFilterText] = useState('');

  const filtered = SITES_DATA.filter((s) => s.siteName.toLowerCase().includes(filterText.toLowerCase()) || s.id.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - Install Sites"
        subtitle="Track live site installations, physical milestones, and commissioning progress"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Install Sites' },
        ]}
      />

      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="ax-card__title">Rooftop Installation Sites</h3>
              <p className="ax-card__subtitle">Monitored progress for active rooftop solar sites</p>
            </div>
          </div>
          <div className="ax-card__body">
            <input
              type="text"
              className="ax-sidebar__filter"
              placeholder="Search installation site..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ padding: '8px 12px', width: '300px', marginBottom: '16px', borderRadius: '6px', border: '1px solid var(--ax-border)' }}
            />
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Site ID</th>
                  <th style={{ padding: '12px 8px' }}>Site Name</th>
                  <th style={{ padding: '12px 8px' }}>District</th>
                  <th style={{ padding: '12px 8px' }}>Capacity</th>
                  <th style={{ padding: '12px 8px' }}>Vendor</th>
                  <th style={{ padding: '12px 8px' }}>Target Date</th>
                  <th style={{ padding: '12px 8px' }}>Completion Progress</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.id}</td>
                    <td style={{ padding: '12px 8px' }}>{s.siteName}</td>
                    <td style={{ padding: '12px 8px' }}>{s.district}</td>
                    <td style={{ padding: '12px 8px' }}>{s.capacity}</td>
                    <td style={{ padding: '12px 8px' }}>{s.vendor}</td>
                    <td style={{ padding: '12px 8px' }}>{s.completionDate}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: 'var(--ax-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.progress}%`, height: '100%', background: s.progress === 100 ? '#10b981' : '#3b82f6' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{s.progress}%</span>
                      </div>
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

export default InstallSites;
