import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../common';
import {
  vendorCommonService,
  type VendorSubUserItem,
  type SubUserPermissionModule,
} from '../common-services/vendorCommonService';

/* ───────── Responsive page CSS (Matching Reference Code) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* Modal Details Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  /* Permissions Modal Styling */
  .vp-perm-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-radius: 10px;
    border: 1px solid var(--ax-border, #e2e8f0);
    margin-bottom: 16px;
  }
  @media (max-width: 680px) {
    .vp-perm-meta-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 440px) {
    .vp-perm-meta-grid {
      grid-template-columns: 1fr;
    }
  }

  .vp-perm-toggle-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    background: rgba(37, 99, 235, 0.06);
    border-radius: 8px;
    margin-bottom: 14px;
    border: 1px solid rgba(37, 99, 235, 0.18);
  }

  .vp-perm-table-container {
    overflow-x: auto;
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 8px;
    max-height: 420px;
    overflow-y: auto;
  }

  .vp-perm-table {
    width: 100%;
    margin: 0;
    white-space: nowrap;
    border-collapse: separate;
    border-spacing: 0;
  }

  .vp-perm-table thead th {
    position: sticky;
    top: 0;
    background: var(--ax-surface-subtle, #f8fafc);
    z-index: 2;
    padding: 11px 14px;
    font-size: 12px;
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    box-shadow: 0 1px 0 var(--ax-border, #e2e8f0);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .vp-perm-table tbody tr {
    transition: background-color 0.15s ease;
  }
  .vp-perm-table tbody tr:hover {
    background-color: var(--ax-surface-hover, #f8fafc);
  }

  .vp-perm-table tbody td {
    padding: 9px 14px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    vertical-align: middle;
  }

  .vp-perm-na {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    border-radius: 4px;
    background: #f1f5f9;
    color: #94a3b8;
    letter-spacing: 0.04em;
    user-select: none;
  }

  .vp-perm-checkbox {
    width: 17px;
    height: 17px;
    cursor: pointer;
    accent-color: var(--asw-primary, #2563eb);
    margin: 0 auto;
    display: block;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── 22 Projects Permission Matrix Specification ───────── */
interface ProjectPermissionRow {
  module_name: string;
  hasSurvey: boolean;
  hasInstallation: boolean;
  hasAmc: boolean;
  survey: boolean;
  installation: boolean;
  amc: boolean;
  complaint?: boolean;
}

const DEFAULT_PROJECT_PERMISSIONS: ProjectPermissionRow[] = [
  { module_name: 'Assam SWP', hasSurvey: false, hasInstallation: true, hasAmc: false, survey: false, installation: false, amc: false },
  { module_name: 'Bihar SSL', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Bihar SRT', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Jammu SSL', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Jammu SRT-70MW', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Jammu SWP', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP RESCO', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP SSL', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP SWP', hasSurvey: false, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'JK Resco', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Karnataka SWP', hasSurvey: false, hasInstallation: true, hasAmc: false, survey: false, installation: false, amc: false },
  { module_name: 'Goa SRT', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP KusumB', hasSurvey: false, hasInstallation: false, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP Ongrid', hasSurvey: false, hasInstallation: false, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP Offgrid', hasSurvey: false, hasInstallation: false, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP Powerpack', hasSurvey: false, hasInstallation: false, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Bihar ULA', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Kashmir SRT-70MW', hasSurvey: true, hasInstallation: true, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'UP SSL18W', hasSurvey: false, hasInstallation: false, hasAmc: true, survey: false, installation: false, amc: false },
  { module_name: 'Arunachal Pradesh SHL', hasSurvey: false, hasInstallation: true, hasAmc: false, survey: false, installation: false, amc: false },
  { module_name: 'Punjab SSL', hasSurvey: false, hasInstallation: true, hasAmc: false, survey: false, installation: false, amc: false },
  { module_name: 'UP SRT', hasSurvey: true, hasInstallation: false, hasAmc: false, survey: false, installation: false, amc: false },
];

export function ViewUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<VendorSubUserItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Edit Sub-User Modal State (B7 & B8)
  const [editModalItem, setEditModalItem] = useState<VendorSubUserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editRegisterFor, setEditRegisterFor] = useState<'field-work' | 'documentation'>('field-work');
  const [editStatus, setEditStatus] = useState<'1' | '0'>('1');
  const [updatingUser, setUpdatingUser] = useState(false);
  const editDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(editDialogRef, !!editModalItem);

  // Role Permissions Modal State (B9 & B10)
  const [permModalUser, setPermModalUser] = useState<VendorSubUserItem | null>(null);
  const [permModules, setPermModules] = useState<ProjectPermissionRow[]>(() =>
    DEFAULT_PROJECT_PERMISSIONS.map((item) => ({ ...item }))
  );
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const permDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(permDialogRef, !!permModalUser);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load sub-users (B6: GET /vendor-view-user)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorCommonService.getSubUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[ViewUsers] load error:', err);
      setUsers([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load vendor sub-users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered by Search & Status
  const filtered = useMemo(() => {
    let list = users;
    if (statusFilter === 'active') list = list.filter((u) => Number(u.status) === 1);
    else if (statusFilter === 'inactive') list = list.filter((u) => Number(u.status) === 0);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const idMatch = String(u.id).includes(q) || String(u.vendor_id || '').toLowerCase().includes(q);
        const nameMatch = String(u.name || '').toLowerCase().includes(q);
        const contactMatch = String(u.contact || '').includes(q);
        const emailMatch = String(u.email || '').toLowerCase().includes(q);
        const regMatch = String(u.register_for || '').toLowerCase().includes(q);
        return idMatch || nameMatch || contactMatch || emailMatch || regMatch;
      });
    }
    return list;
  }, [users, search, statusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  // Metrics
  const totalCount = users.length;
  const activeCount = users.filter((u) => Number(u.status) === 1).length;
  const inactiveCount = users.filter((u) => Number(u.status) === 0).length;
  const fieldWorkCount = users.filter((u) => u.register_for === 'field-work').length;

  // Open Edit User Modal (B7: GET /vendor-edit-user/{id})
  const handleOpenEdit = async (u: VendorSubUserItem) => {
    setEditModalItem(u);
    setEditName(u.name || '');
    setEditContact(u.contact || '');
    setEditRegisterFor((u.register_for as any) === 'documentation' ? 'documentation' : 'field-work');
    setEditStatus(Number(u.status) === 0 ? '0' : '1');

    try {
      const fetched = await vendorCommonService.getSubUserForEdit(u.id);
      if (fetched) {
        if (fetched.name) setEditName(fetched.name);
        if (fetched.contact) setEditContact(fetched.contact);
        if (fetched.register_for) {
          setEditRegisterFor((fetched.register_for as any) === 'documentation' ? 'documentation' : 'field-work');
        }
        if (fetched.status != null) setEditStatus(Number(fetched.status) === 0 ? '0' : '1');
      }
    } catch (err) {
      console.warn('[ViewUsers] fetch edit detail failed:', err);
    }
  };

  // Submit Edit User (B8: POST /vendor-update-user/{id})
  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editModalItem) return;

    if (!editName.trim()) {
      setToastMsg({ type: 'danger', text: 'Full Name is required.' });
      return;
    }

    const cleanContact = editContact.replace(/\D/g, '').trim();
    if (cleanContact.length < 10) {
      setToastMsg({ type: 'danger', text: 'Contact must be at least 10 digits.' });
      return;
    }

    setUpdatingUser(true);
    try {
      const res = await vendorCommonService.updateSubUser(editModalItem.id, {
        name: editName.trim(),
        contact: cleanContact,
        registerFor: editRegisterFor,
        status: editStatus,
      });

      setToastMsg({ type: 'success', text: res?.message || 'Sub-User Updated Successfully!' });
      setEditModalItem(null);
      await loadData();
    } catch (err: any) {
      console.error('[ViewUsers] update error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update sub-user.' });
    } finally {
      setUpdatingUser(false);
    }
  };

  // Open Permissions Modal (B9: GET /vendor-role-permission-user/{id})
  const handleOpenPermissions = async (u: VendorSubUserItem) => {
    setPermModalUser(u);
    setLoadingPerms(true);

    // Initialize with fresh default matrix
    const freshRows = DEFAULT_PROJECT_PERMISSIONS.map((row) => ({ ...row }));
    setPermModules(freshRows);

    try {
      // Attempt B9 fetch
      const res = await vendorCommonService.getSubUserRolePermissions(u.id);
      if (res?.child_permissions) {
        try {
          const parsed = typeof res.child_permissions === 'string'
            ? JSON.parse(res.child_permissions)
            : res.child_permissions;

          if (parsed && typeof parsed === 'object') {
            setPermModules((prev) =>
              prev.map((item) => {
                const normName = item.module_name.toLowerCase().replace(/[\s\-_]+/g, '');
                const matchKey = Object.keys(parsed).find((k) => {
                  const normKey = k.toLowerCase().replace(/[\s\-_]+/g, '');
                  return normKey === normName || k.toLowerCase() === item.module_name.toLowerCase();
                });

                if (matchKey && parsed[matchKey]) {
                  const entry = parsed[matchKey];
                  return {
                    ...item,
                    survey: item.hasSurvey ? Boolean(entry.survey) : false,
                    installation: item.hasInstallation ? Boolean(entry.installation) : false,
                    amc: item.hasAmc ? Boolean(entry.amc) : false,
                  };
                }
                return item;
              })
            );
          }
        } catch (e) {
          console.warn('[ViewUsers] failed to parse child_permissions:', e);
        }
      }
    } catch (err: any) {
      console.warn('[ViewUsers] role permissions fetch note:', err);
    } finally {
      setLoadingPerms(false);
    }
  };

  // Permissions summary calculation
  const { totalValidPermissions, grantedCount, isAllChecked } = useMemo(() => {
    let total = 0;
    let granted = 0;
    for (const p of permModules) {
      if (p.hasSurvey) {
        total++;
        if (p.survey) granted++;
      }
      if (p.hasInstallation) {
        total++;
        if (p.installation) granted++;
      }
      if (p.hasAmc) {
        total++;
        if (p.amc) granted++;
      }
    }
    return {
      totalValidPermissions: total,
      grantedCount: granted,
      isAllChecked: total > 0 && granted === total,
    };
  }, [permModules]);

  // Master All Permissions toggle
  const handleToggleAll = (checked: boolean) => {
    setPermModules((prev) =>
      prev.map((item) => ({
        ...item,
        survey: item.hasSurvey ? checked : false,
        installation: item.hasInstallation ? checked : false,
        amc: item.hasAmc ? checked : false,
      }))
    );
  };

  // Save Permissions (B10: POST /vendor-save-user-permissions)
  const handleSavePermissions = async (e: FormEvent) => {
    e.preventDefault();
    if (!permModalUser) return;

    setSavingPerms(true);
    try {
      const formattedPermissions: SubUserPermissionModule[] = permModules.map((p) => ({
        module_name: p.module_name,
        survey: p.hasSurvey ? Boolean(p.survey) : false,
        installation: p.hasInstallation ? Boolean(p.installation) : false,
        amc: p.hasAmc ? Boolean(p.amc) : false,
        complaint: false,
      }));

      const res = await vendorCommonService.saveSubUserPermissions({
        vendor_id: Number(permModalUser.id),
        permissions: formattedPermissions,
      });

      setToastMsg({ type: 'success', text: res?.message || 'Permissions Saved Successfully!' });
      setPermModalUser(null);
    } catch (err: any) {
      console.error('[ViewUsers] save permissions error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update permissions.' });
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Sub-Users"
        subtitle="Manage authorized vendor sub-users, update field/documentation assignments, toggle active status, and grant module permissions"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Users' },
          { label: 'View Users' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/users/add-user" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Sub-User</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Sub-Users"
          value={`${totalCount} / 5`}
          sub="Maximum 5 sub-users quota"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Active Accounts"
          value={activeCount.toLocaleString('en-IN')}
          sub="Ready for field execution"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Inactive Accounts"
          value={inactiveCount.toLocaleString('en-IN')}
          sub="Access currently disabled"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Field Engineers"
          value={fieldWorkCount.toLocaleString('en-IN')}
          sub="On-site assignment staff"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          }
        />
      </div>

      {/* ── Sub-Users Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Sub-users register table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Sub-Users List</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{users.length}</span> sub-users
              {' '}· Active: <b className="ax-num">{activeCount}</b> · Quota: <b className="ax-num">{5 - totalCount} remaining</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name, contact, ID…"
                size="sm"
                ariaLabel="Search sub-users"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((u, i) =>
                      [
                        i + 1,
                        u.vendor_id || `#${u.id}`,
                        u.name,
                        u.contact,
                        u.email,
                        u.register_for || '—',
                        Number(u.status) === 1 ? 'Active' : 'Inactive',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,User ID,Full Name,Contact,Email,Registered For,Status',
                    ...filtered.map(
                      (u, i) =>
                        `"${i + 1}","${u.vendor_id || `#${u.id}`}","${u.name}","${u.contact}","${u.email}","${u.register_for || ''}","${Number(u.status) === 1 ? 'Active' : 'Inactive'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Sub_Users.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,User ID,Full Name,Contact,Email,Registered For,Status',
                    ...filtered.map(
                      (u, i) =>
                        `"${i + 1}","${u.vendor_id || `#${u.id}`}","${u.name}","${u.contact}","${u.email}","${u.register_for || ''}","${Number(u.status) === 1 ? 'Active' : 'Inactive'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Sub_Users.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">User ID</th>
                <th className="ax-table__th" scope="col">Full Name</th>
                <th className="ax-table__th" scope="col">Mobile Contact</th>
                <th className="ax-table__th" scope="col">Email Address</th>
                <th className="ax-table__th" scope="col">Department</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={8} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading sub-users…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sub-users registered yet"
                      message="You have not created any sub-users. Click '+ Add Sub-User' to create up to 5 user accounts."
                      onClear={() => setSearch('')}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isActive = Number(row.status) === 1;
                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.vendor_id || `#${row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.name}
                      </td>
                      <td className="ax-table__td">{row.contact}</td>
                      <td className="ax-table__td">{row.email}</td>
                      <td className="ax-table__td">
                        <span style={{ textTransform: 'capitalize' }}>
                          {row.register_for ? row.register_for.replace('-', ' ') : '—'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        {isActive ? (
                          <Badge tone="success">Active</Badge>
                        ) : (
                          <Badge tone="danger">Inactive</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => handleOpenEdit(row)}
                            title="Edit user details"
                            style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => handleOpenPermissions(row)}
                            title="Configure module permissions"
                            style={{ padding: '4px 10px', fontSize: 12, color: 'var(--asw-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>Permissions</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Modal 1: Edit Sub-User Modal (B7 & B8) ── */}
      {editModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
          <div className="ax-modal__backdrop" onClick={() => !updatingUser && setEditModalItem(null)} />
          <div ref={editDialogRef} className="ax-modal__dialog" style={{ maxWidth: 480 }}>
            <form onSubmit={handleUpdateUser}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="edit-user-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Edit Sub-User: {editModalItem.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Update sub-user contact, department, and active login status.
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-modal__close"
                  onClick={() => setEditModalItem(null)}
                  disabled={updatingUser}
                  aria-label="Close dialog"
                >
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="edit_user_name" style={{ fontSize: 12, fontWeight: 600 }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="edit_user_name"
                    type="text"
                    className="ax-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="edit_user_contact" style={{ fontSize: 12, fontWeight: 600 }}>
                    Mobile Contact <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="edit_user_contact"
                    type="tel"
                    className="ax-input"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="edit_user_regfor" style={{ fontSize: 12, fontWeight: 600 }}>
                    Department / Work Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="edit_user_regfor"
                    className="ax-input"
                    value={editRegisterFor}
                    onChange={(e) => setEditRegisterFor(e.target.value as any)}
                  >
                    <option value="field-work">Field Work</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="edit_user_status" style={{ fontSize: 12, fontWeight: 600 }}>
                    Account Login Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="edit_user_status"
                    className="ax-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                  >
                    <option value="1">Active (Login Enabled)</option>
                    <option value="0">Inactive (Login Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setEditModalItem(null)}
                  disabled={updatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={updatingUser}
                >
                  {updatingUser ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Role Permissions Modal (B9 & B10) ── */}
      {permModalUser && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="perm-user-title">
          <div className="ax-modal__backdrop" onClick={() => !savingPerms && setPermModalUser(null)} />
          <div ref={permDialogRef} className="ax-modal__dialog" style={{ maxWidth: 740 }}>
            <form onSubmit={handleSavePermissions}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="perm-user-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    User Permissions: {permModalUser.name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Configure project module permissions for Survey, Installation, and AMC operations.
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-modal__close"
                  onClick={() => setPermModalUser(null)}
                  disabled={savingPerms}
                  aria-label="Close dialog"
                >
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body">
                {/* 1. User Meta Info Cards */}
                <div className="vp-perm-meta-grid">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
                      User Name
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)', marginTop: 2 }}>
                      {permModalUser.name || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
                      Mobile
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', marginTop: 2 }}>
                      {permModalUser.contact || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
                      User Id
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--asw-primary, #2563eb)', marginTop: 2 }}>
                      {permModalUser.vendor_id || `#${permModalUser.id}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
                      Email
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ax-text-strong, #0f172a)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={permModalUser.email}
                    >
                      {permModalUser.email || '—'}
                    </div>
                  </div>
                </div>

                {/* 2. All Permissions Toggle Bar */}
                <div className="vp-perm-toggle-bar">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--ax-text-strong, #0f172a)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--asw-primary, #2563eb)' }}
                    />
                    <span>All Permissions</span>
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--asw-primary, #2563eb)', fontWeight: 700 }}>
                    {grantedCount} of {totalValidPermissions} permissions granted
                  </span>
                </div>

                {/* 3. Matrix Table */}
                {loadingPerms ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading permissions…
                  </div>
                ) : (
                  <div className="vp-perm-table-container">
                    <table className="vp-perm-table">
                      <thead>
                        <tr>
                          <th>State &amp; Project Name</th>
                          <th style={{ textAlign: 'center', width: 110 }}>Survey</th>
                          <th style={{ textAlign: 'center', width: 120 }}>Installation</th>
                          <th style={{ textAlign: 'center', width: 110 }}>AMC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permModules.map((row, idx) => (
                          <tr key={row.module_name || idx}>
                            <td style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                              {row.module_name}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.hasSurvey ? (
                                <input
                                  type="checkbox"
                                  className="vp-perm-checkbox"
                                  checked={row.survey}
                                  onChange={() =>
                                    setPermModules((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, survey: !item.survey } : item))
                                    )
                                  }
                                  aria-label={`${row.module_name} Survey permission`}
                                />
                              ) : (
                                <span className="vp-perm-na">NA</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.hasInstallation ? (
                                <input
                                  type="checkbox"
                                  className="vp-perm-checkbox"
                                  checked={row.installation}
                                  onChange={() =>
                                    setPermModules((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, installation: !item.installation } : item))
                                    )
                                  }
                                  aria-label={`${row.module_name} Installation permission`}
                                />
                              ) : (
                                <span className="vp-perm-na">NA</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {row.hasAmc ? (
                                <input
                                  type="checkbox"
                                  className="vp-perm-checkbox"
                                  checked={row.amc}
                                  onChange={() =>
                                    setPermModules((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, amc: !item.amc } : item))
                                    )
                                  }
                                  aria-label={`${row.module_name} AMC permission`}
                                />
                              ) : (
                                <span className="vp-perm-na">NA</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setPermModalUser(null)}
                  disabled={savingPerms}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={savingPerms || loadingPerms}
                >
                  {savingPerms ? 'Saving…' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewUsers;
