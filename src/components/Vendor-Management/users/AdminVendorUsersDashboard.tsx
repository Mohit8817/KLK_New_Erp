import { useState, useMemo } from 'react';
import { PageHead } from '../../shell/PageHead';

interface VendorDirectoryItem {
  id: string;
  agencyName: string;
  ownerName: string;
  email: string;
  phone: string;
  state: string;
  activeOrders: number;
  status: 'Active' | 'Suspended';
}

const SAMPLE_VENDORS: VendorDirectoryItem[] = [
  { id: 'KLK29045', agencyName: 'Assam Green Energy Works', ownerName: 'Bhaskar Jyoti', email: 'assamgreen@klkerp.com', phone: '+91 98640 11294', state: 'Assam', activeOrders: 14, status: 'Active' },
  { id: 'KLK29018', agencyName: 'Brahmaputra Solar Solutions', ownerName: 'Pranab Saikia', email: 'brahmaputra@klkerp.com', phone: '+91 94350 44912', state: 'Assam', activeOrders: 8, status: 'Active' },
  { id: 'KLK29012', agencyName: 'Eastern Renewable Contractors', ownerName: 'Anup Baruah', email: 'eastern@klkerp.com', phone: '+91 97060 88214', state: 'Assam', activeOrders: 6, status: 'Active' },
  { id: 'KLK29088', agencyName: 'Pragjyotish Power Pvt Ltd', ownerName: 'Debabrata Das', email: 'pragjyotish@klkerp.com', phone: '+91 98540 22019', state: 'Assam', activeOrders: 9, status: 'Active' },
  { id: 'KLK30101', agencyName: 'Awadh Solar Power Systems', ownerName: 'Ramesh Maurya', email: 'awadh@klkerp.com', phone: '+91 94150 99821', state: 'Uttar Pradesh', activeOrders: 28, status: 'Active' },
  { id: 'KLK30105', agencyName: 'Mithila Green Infra', ownerName: 'Suresh Jha', email: 'mithila@klkerp.com', phone: '+91 98350 77123', state: 'Bihar', activeOrders: 22, status: 'Active' },
];

export function AdminVendorUsersDashboard() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Vendor Form
  const [newVendorName, setNewVendorName] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newState, setNewState] = useState('Assam');
  const [vendorsList, setVendorsList] = useState<VendorDirectoryItem[]>(SAMPLE_VENDORS);
  const [feedback, setFeedback] = useState('');

  const filtered = useMemo(() => {
    return vendorsList.filter((v) => {
      const matchQ =
        !query ||
        v.id.toLowerCase().includes(query.toLowerCase()) ||
        v.agencyName.toLowerCase().includes(query.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        v.email.toLowerCase().includes(query.toLowerCase());
      const matchState = stateFilter === 'All' || v.state === stateFilter;
      return matchQ && matchState;
    });
  }, [vendorsList, query, stateFilter]);

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgency.trim() || !newVendorName.trim() || !newEmail.trim()) return;

    const generatedId = `KLK${Math.floor(29000 + Math.random() * 9000)}`;
    const newVendor: VendorDirectoryItem = {
      id: generatedId,
      agencyName: newAgency.trim(),
      ownerName: newVendorName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+91 98000 00000',
      state: newState,
      activeOrders: 0,
      status: 'Active',
    };

    setVendorsList([newVendor, ...vendorsList]);
    setFeedback(`New vendor ${newAgency} successfully registered with Vendor ID: ${generatedId}! Credentials active.`);
    setShowAddModal(false);
    setNewAgency('');
    setNewVendorName('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <div style={{ padding: '4px 8px 36px 8px', maxWidth: '1440px', margin: '0 auto' }}>
      <PageHead
        title="Vendor Master Directory (Super Admin)"
        subtitle="Manage certified vendor agencies, partner onboarding, and authentication credentials"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Vendor Users' },
        ]}
      />

      {feedback && (
        <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600 }}>
          ✓ {feedback}
        </div>
      )}

      {/* ── Filter & Search Bar ── */}
      <div
        style={{
          background: 'var(--ax-bg-surface, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agency, contact, vendor ID or email..."
            style={{ minWidth: 280, height: 38, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 13 }}
          />

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13, background: '#fff' }}
          >
            <option value="All">All States</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Jammu">Jammu</option>
            <option value="Kashmir">Kashmir</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            height: 38,
            padding: '0 16px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>+ Onboard New Vendor</span>
        </button>
      </div>

      {/* ── Vendors Table ── */}
      <div
        style={{
          background: 'var(--ax-bg-surface, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                <th style={{ padding: '12px 18px' }}>Vendor ID</th>
                <th style={{ padding: '12px 16px' }}>Agency / Firm Name</th>
                <th style={{ padding: '12px 16px' }}>Contact Person</th>
                <th style={{ padding: '12px 16px' }}>Phone & Email</th>
                <th style={{ padding: '12px 16px' }}>Operational State</th>
                <th style={{ padding: '12px 16px' }}>Active Orders</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#2563eb' }}>{v.id}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{v.agencyName}</td>
                  <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>{v.ownerName}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12 }}>
                    <div>{v.phone}</div>
                    <div style={{ color: '#64748b' }}>{v.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
                      {v.state}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{v.activeOrders}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#ecfdf5', color: '#065f46' }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal for Onboarding ── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <form
            onSubmit={handleAddVendor}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '24px',
              maxWidth: 480,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
              Onboard Certified Vendor Partner
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
              Create vendor account credentials for external field execution.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Agency / Company Name *
              </label>
              <input
                type="text"
                required
                value={newAgency}
                onChange={(e) => setNewAgency(e.target.value)}
                placeholder="e.g. Northeast Solar Infra"
                style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="e.g. Ratan Barman"
                style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Primary Operating State *
              </label>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: 13, background: '#fff' }}
              >
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Jammu">Jammu</option>
                <option value="Kashmir">Kashmir</option>
                <option value="Goa">Goa</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Punjab">Punjab</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 14px', borderRadius: 6, background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 18px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Create Vendor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminVendorUsersDashboard;
