import { useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';

interface SiteAssignRow {
  id: string;
  siteName: string;
  district: string;
  capacityKw: number;
  vendor: string;
  assignDate: string;
  status: 'Assigned' | 'Pending' | 'In Progress';
}

const INITIAL_SITES: SiteAssignRow[] = [
  { id: 'JK-SRT-001', siteName: 'Govt Higher Secondary School Jammu', district: 'Jammu', capacityKw: 50, vendor: 'SolarTech Energy', assignDate: '2026-09-10', status: 'Assigned' },
  { id: 'JK-SRT-002', siteName: 'District Hospital Udhampur', district: 'Udhampur', capacityKw: 100, vendor: 'KLK Renewable Ltd', assignDate: '2026-09-12', status: 'In Progress' },
  { id: 'JK-SRT-003', siteName: 'Tehsil Complex Kathua', district: 'Kathua', capacityKw: 30, vendor: 'GreenWave Solar', assignDate: '2026-09-15', status: 'Pending' },
  { id: 'JK-SRT-004', siteName: 'Degree College Samba', district: 'Samba', capacityKw: 75, vendor: 'SolarTech Energy', assignDate: '2026-09-18', status: 'Assigned' },
  { id: 'JK-SRT-005', siteName: 'Sub District Hospital Rajouri', district: 'Rajouri', capacityKw: 40, vendor: 'SunPower Solutions', assignDate: '2026-09-20', status: 'Pending' },
];

export function AssignSite() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('All');

  const filtered = INITIAL_SITES.filter((item) => {
    const matchSearch = item.siteName.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVendor = selectedVendor === 'All' || item.vendor === selectedVendor;
    return matchSearch && matchVendor;
  });

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - Assign Site"
        subtitle="Allocate and assign 70MW rooftop solar sites to vendors across Jammu districts"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Assign Site' },
        ]}
      />

      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="ax-card__title" style={{ margin: 0 }}>Site Assignment List</h3>
              <p className="ax-card__subtitle" style={{ margin: 0 }}>Manage vendor allocations for SRT 70MW projects</p>
            </div>
            <button className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Assign New Site
            </button>
          </div>

          <div className="ax-card__body">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="ax-sidebar__filter"
                placeholder="Search site name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--ax-border)' }}
              />
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--ax-border)', background: 'var(--ax-card-bg)', color: 'var(--ax-text)' }}
              >
                <option value="All">All Vendors</option>
                <option value="SolarTech Energy">SolarTech Energy</option>
                <option value="KLK Renewable Ltd">KLK Renewable Ltd</option>
                <option value="GreenWave Solar">GreenWave Solar</option>
                <option value="SunPower Solutions">SunPower Solutions</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ax-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px' }}>Site ID</th>
                    <th style={{ padding: '12px 8px' }}>Site Name</th>
                    <th style={{ padding: '12px 8px' }}>District</th>
                    <th style={{ padding: '12px 8px' }}>Capacity (kW)</th>
                    <th style={{ padding: '12px 8px' }}>Assigned Vendor</th>
                    <th style={{ padding: '12px 8px' }}>Assign Date</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.id}</td>
                      <td style={{ padding: '12px 8px' }}>{row.siteName}</td>
                      <td style={{ padding: '12px 8px' }}>{row.district}</td>
                      <td style={{ padding: '12px 8px' }}>{row.capacityKw} kW</td>
                      <td style={{ padding: '12px 8px' }}>{row.vendor}</td>
                      <td style={{ padding: '12px 8px' }}>{row.assignDate}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`ax-badge ${row.status === 'Assigned' ? 'ax-badge--success' : row.status === 'In Progress' ? 'ax-badge--info' : 'ax-badge--warning'}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button className="ax-btn ax-btn--sm ax-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignSite;
