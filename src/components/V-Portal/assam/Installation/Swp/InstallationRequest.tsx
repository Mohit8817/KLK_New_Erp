/*
 * Installation Request — Assam SWP assigned installations.
 * Refactored to pure Tailwind CSS (zero inline styles) and Toastify notifications for all states.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  ASSET_BASE_URL,
  SAMPLE_INSTALLATION_REQUESTS,
  type InstallationRequestRecord as Rec,
} from '../../../../../data/demo/assamInstallationRequests';
import {
  ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_SITES_URL,
  ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_DETAIL_URL,
  ASSAM_SWP_ASSIGN_INSTALLATION_ACCEPT_URL,
} from '../../../V_Portal_APIS/Assam_API';
import { authService } from '../../../../../services/authService';

const svg = (children: ReactElement | ReactElement[]) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const ICON = {
  refresh: svg([<path key="a" d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />, <path key="b" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />]),
  search: svg([<path key="a" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />, <path key="b" d="M21 21l-6 -6" />]),
  chevL: svg(<path d="M15 6l-6 6l6 6" />),
  chevR: svg(<path d="M9 6l6 6l-6 6" />),
  close: svg([<path key="a" d="M18 6l-12 12" />, <path key="b" d="M6 6l12 12" />]),
  eye: svg([<path key="a" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />, <path key="b" d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />]),
  download: svg([<path key="a" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />, <path key="b" d="M7 11l5 5l5 -5" />, <path key="c" d="M12 4l0 12" />]),
  lock: svg([<rect key="a" x="5" y="11" width="14" height="10" rx="2" />, <circle key="b" cx="12" cy="16" r="1" />, <path key="c" d="M8 11v-4a4 4 0 0 1 8 0v4" />]),
  check: svg(<path d="M5 12l5 5l10 -10" />),
  sortDef: <svg className="ax-table__sort opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>,
  sortAsc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>,
  sortDesc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>,
};

/* Toastify Icons */
const TOAST_ICONS = {
  success: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

/* Toastify Container Component using pure Tailwind CSS with vibrant status-colored cards */
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const config = {
          success: {
            bg: 'bg-emerald-600 dark:bg-emerald-700',
            border: 'border border-emerald-500/80',
            shadow: 'shadow-lg shadow-emerald-950/25',
            badgeBg: 'bg-emerald-700/70 dark:bg-emerald-800/80',
            msgColor: 'text-emerald-50',
          },
          error: {
            bg: 'bg-rose-600 dark:bg-rose-700',
            border: 'border border-rose-500/80',
            shadow: 'shadow-lg shadow-rose-950/25',
            badgeBg: 'bg-rose-700/70 dark:bg-rose-800/80',
            msgColor: 'text-rose-50',
          },
          warning: {
            bg: 'bg-amber-500 dark:bg-amber-600',
            border: 'border border-amber-400/80',
            shadow: 'shadow-lg shadow-amber-950/25',
            badgeBg: 'bg-amber-600/70 dark:bg-amber-700/80',
            msgColor: 'text-amber-50',
          },
          info: {
            bg: 'bg-sky-600 dark:bg-sky-700',
            border: 'border border-sky-500/80',
            shadow: 'shadow-lg shadow-sky-950/25',
            badgeBg: 'bg-sky-700/70 dark:bg-sky-800/80',
            msgColor: 'text-sky-50',
          },
        }[t.type];

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl ${config.bg} ${config.border} ${config.shadow} transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 p-4 text-white`}
            role="alert"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.badgeBg} flex items-center justify-center mt-0.5 shadow-inner`}>
              {TOAST_ICONS[t.type]}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">{t.title}</h5>
              <p className={`mt-0.5 text-xs ${config.msgColor} leading-relaxed break-words font-medium`}>{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onClose(t.id)}
              className="flex-shrink-0 text-white/70 hover:text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <span className="w-4 h-4 block">{ICON.close}</span>
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
              <div className="h-full bg-white/40 animate-pulse w-full" />
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

/* Modal Component */
function Modal({ open, onClose, labelledBy, dialogClass = '', children }: {
  open: boolean; onClose: () => void; labelledBy: string; dialogClass?: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={ref} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>{children}</div>
    </div>,
    document.body,
  );
}

/* status code -> label + badge tone (only "2" = Accepted is confirmed) */
const STATUS: Record<string, { label: string; tone: string }> = {
  '0': { label: 'Pending', tone: 'warning' },
  '1': { label: 'Assigned', tone: 'info' },
  '2': { label: 'Accepted', tone: 'success' },
  '3': { label: 'Rejected', tone: 'danger' },
};
const statusOf = (s: string) => STATUS[s] ?? { label: s || '—', tone: 'neutral' };

/* "2026-05-13 13:37:00" -> "13-05-2026" */
const fmtDate = (s: string) => {
  const [y, m, d] = (s || '').slice(0, 10).split('-');
  return y && m && d ? `${d}-${m}-${y}` : '—';
};
const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fileUrl = (p: string) => (p ? `${ASSET_BASE_URL}${p}` : '');
const fileExt = (p: string) => (p.split('.').pop() || '').toLowerCase();
const namesText = (r: Rec) => r.names.map((n) => `${n.farmer_name ?? '-'} - ${n.father_name ?? '-'}`).join('; ');

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', visible: true },
  { key: 'vendorName', label: 'Vendor', visible: true },
  { key: 'assignDate', label: 'Assign Date', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'district', label: 'District', visible: true },
  { key: 'names', label: 'Farmer Name - Father Name', visible: true },
  { key: 'siteCount', label: 'Count', visible: true },
  { key: 'deadlineDate', label: 'Deadline Date', visible: true },
  { key: 'file', label: 'File', visible: true },
  { key: 'view', label: 'View', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

type SortKey = 'vendorName' | 'assignDate' | 'state' | 'district' | 'siteCount' | 'deadlineDate' | 'status';
const SORTABLE: string[] = ['vendorName', 'assignDate', 'state', 'district', 'siteCount', 'deadlineDate', 'status'];

function ActionCell({
  item,
  onAccept,
  isAccepting,
}: {
  item: Rec;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  const isAccepted = item.status === '2';

  if (isAccepted) {
    return (
      <button
        type="button"
        className="ax-btn ax-btn--secondary ax-btn--sm inline-flex items-center gap-1.5 opacity-65 cursor-not-allowed border border-dashed border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 text-dark-500"
        disabled
        title="Installation Accepted — Action Locked"
      >
        <span className="ax-btn__icon inline-flex w-3.5 h-3.5">{ICON.lock}</span>
        <span className="ax-btn__label">Locked</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="ax-btn ax-btn--primary ax-btn--sm inline-flex items-center gap-1.5"
      onClick={onAccept}
      disabled={isAccepting}
      title="Accept SWP Installation"
    >
      <span className="ax-btn__icon inline-flex w-3.5 h-3.5">{ICON.check}</span>
      <span className="ax-btn__label">{isAccepting ? 'Accepting…' : 'Accept Installation'}</span>
    </button>
  );
}

export function InstallationRequest() {
  const [requests, setRequests] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('assignDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [detail, setDetail] = useState<Rec | null>(null);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; ext: string; title: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Toastify state management
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const defaultTitle = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
    }[type];
    setToasts((prev) => [...prev, { id, type, message, title: title || defaultTitle }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (msg: string, title?: string) => addToast('success', msg, title),
    error: (msg: string, title?: string) => addToast('error', msg, title),
    warning: (msg: string, title?: string) => addToast('warning', msg, title),
    info: (msg: string, title?: string) => addToast('info', msg, title),
  }), [addToast]);

  // 1. Fetch assigned installations from API
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_SITES_URL, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const list = json?.data;
        if (Array.isArray(list)) {
          if (list.length > 0) {
            const mapped: Rec[] = list.map((item: any) => {
              const rawNames = Array.isArray(item.Names)
                ? item.Names
                : Array.isArray(item.names)
                ? item.names
                : [];

              let parsedSiteIds: number[] = [];
              if (item.site_id !== undefined && item.site_id !== null) {
                try {
                  const parsed = typeof item.site_id === 'string' ? JSON.parse(item.site_id) : item.site_id;
                  if (Array.isArray(parsed)) {
                    parsedSiteIds = parsed.map(Number).filter((n) => !isNaN(n) && n > 0);
                  } else if (!isNaN(Number(parsed)) && Number(parsed) > 0) {
                    parsedSiteIds = [Number(parsed)];
                  }
                } catch {
                  const matches = String(item.site_id).match(/\d+/g);
                  if (matches) {
                    parsedSiteIds = matches.map(Number).filter((n) => !isNaN(n) && n > 0);
                  }
                }
              }
              if (parsedSiteIds.length === 0 && rawNames.length > 0) {
                parsedSiteIds = rawNames
                  .map((n: any) => n.site_id ?? n.assam_swp_id ?? n.swp_id ?? n.id)
                  .filter((v: any) => v !== undefined && v !== null && !isNaN(Number(v)) && Number(v) > 0)
                  .map(Number);
              }

              const siteCount = rawNames.length || parsedSiteIds.length || 1;

              return {
                id: Number(item.id),
                vendorName: item.vendors?.name || (typeof item.vendor === 'string' ? item.vendor : 'Vendor'),
                assignDate: item.created_at || item.assign_date || item.assignDate || '',
                deadlineDate: item.deadline_date || item.deadlineDate || '',
                state: item.state || 'assam',
                district: item.district || rawNames[0]?.district || '—',
                siteCount: siteCount,
                names: rawNames,
                file: item.file || '',
                remarks: item.remarks || '',
                status: String(item.status ?? '1'),
                siteIds: parsedSiteIds,
              };
            });
            setRequests(mapped);
          } else {
            setRequests([]);
          }
        }
      } else {
        // Fallback to demo only if API unavailable
        setRequests((prev) => (prev.length === 0 ? SAMPLE_INSTALLATION_REQUESTS : prev));
      }
    } catch (err) {
      console.warn('Failed to fetch assigned installation sites:', err);
      toast.warning('Could not connect to live API. Fallback records loaded.', 'Network Notice');
      setRequests((prev) => (prev.length === 0 ? SAMPLE_INSTALLATION_REQUESTS : prev));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // 2. Fetch assign site detail
  const handleViewDetail = async (r: Rec) => {
    if (!r?.id) {
      toast.warning('Invalid assignment ID provided.', 'Validation Notice');
      return;
    }
    setDetail(r);
    setDetailRecord(null);
    setLoadingDetail(true);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const callDetailApi = async (idParam: number) => {
        const res = await fetch(`${ASSAM_SWP_VIEW_ASSIGN_INSTALLATION_DETAIL_URL}?id=${idParam}`, {
          method: 'GET',
          headers,
        });
        const json = await res.json().catch(() => null);
        return { ok: res.ok, status: res.status, json };
      };

      // 1. First attempt with assign ID
      let result = await callDetailApi(r.id);

      // 2. Fallback to site ID if 422 validation error
      if (!result.ok && result.status === 422 && r.siteIds && r.siteIds.length > 0) {
        for (const sId of r.siteIds) {
          if (sId !== r.id) {
            const fallbackRes = await callDetailApi(sId);
            if (fallbackRes.ok && fallbackRes.json?.data) {
              result = fallbackRes;
              break;
            }
          }
        }
      }

      if (result.ok && result.json?.data) {
        setDetailRecord(result.json.data);
      } else {
        const errorText =
          result.json?.errors?.id?.[0] ||
          result.json?.message ||
          'Selected assign ID does not exist in the database.';
        toast.error(errorText, 'Failed to Load Details');
      }
    } catch (err) {
      console.warn('Failed to fetch site detail:', err);
      toast.error('Network error while retrieving assignment details.', 'Network Error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 3. Accept installation
  const handleAccept = async (r: Rec) => {
    if (!r?.id) {
      toast.warning('Invalid assignment ID provided.', 'Validation Notice');
      return;
    }
    setActionLoadingId(r.id);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const callAcceptApi = async (idParam: number) => {
        const res = await fetch(`${ASSAM_SWP_ASSIGN_INSTALLATION_ACCEPT_URL}?id=${idParam}`, {
          method: 'GET',
          headers,
        });
        const json = await res.json().catch(() => null);
        return { ok: res.ok, status: res.status, json };
      };

      // 1. Standard request with assign ID (r.id)
      let result = await callAcceptApi(r.id);

      // 2. If 422 validation error ("The selected id is invalid."), check if server expects site_id
      // (as noted in API doc: "assign ka id; fix ke baad exists:assigns,id")
      if (!result.ok && result.status === 422 && r.siteIds && r.siteIds.length > 0) {
        for (const sId of r.siteIds) {
          if (sId !== r.id) {
            const fallbackRes = await callAcceptApi(sId);
            if (fallbackRes.ok && (fallbackRes.json?.status === true || fallbackRes.json?.success === true)) {
              result = fallbackRes;
              break;
            }
          }
        }
      }

      if (result.ok && (result.json?.status === true || result.json?.success === true)) {
        toast.success(result.json?.message || 'Installation Accepted Successfully!', 'Accepted');
        setRequests((prev) => prev.map((item) => (item.id === r.id ? { ...item, status: '2' } : item)));
      } else {
        const errObj = result.json?.errors;
        const errorText =
          errObj?.id?.[0] ||
          result.json?.message ||
          'Error occurred while accepting installation';

        if (errorText.includes('selected id is invalid')) {
          toast.error(
            `${errorText} (ID: ${r.id}). Server validation failed. Backend API note: "fix ke baad exists:assigns,id" — please ensure backend fix is deployed on klkerp.com.`,
            'Validation Error'
          );
        } else {
          toast.error(errorText, 'Acceptance Failed');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error occurred while accepting installation.', 'Network Error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const all = requests;
  const visibleCols = columns.filter((c) => c.visible);
  const toggleColumn = (key: string) => setColumns((p) => p.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = all.filter((x) => !t || [x.vendorName, x.state, x.district, x.remarks, namesText(x), statusOf(x.status).label].some((v) => (v || '').toLowerCase().includes(t)));
    const dir = sortDir === 'asc' ? 1 : -1;
    r = [...r].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return r;
  }, [q, all, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);
  const rangeStart = filtered.length ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * perPage, filtered.length);
  const pageList: (number | '…')[] = useMemo(() => {
    const out: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) out.push(i); return out; }
    out.push(1);
    if (curPage > 3) out.push('…');
    for (let i = Math.max(2, curPage - 1); i <= Math.min(totalPages - 1, curPage + 1); i++) out.push(i);
    if (curPage < totalPages - 2) out.push('…');
    out.push(totalPages);
    return out;
  }, [totalPages, curPage]);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };
  const ariaSort = (k: SortKey): 'ascending' | 'descending' | 'none' => (sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
  const glyph = (k: SortKey) => (sortKey !== k ? ICON.sortDef : sortDir === 'asc' ? ICON.sortAsc : ICON.sortDesc);

  /* export */
  const cellText = (r: Rec, i: number, key: string): string => {
    switch (key) {
      case 'srNo': return String(i + 1);
      case 'assignDate': return fmtDate(r.assignDate);
      case 'deadlineDate': return fmtDate(r.deadlineDate);
      case 'state': return capital(r.state);
      case 'names': return namesText(r);
      case 'file': return fileUrl(r.file);
      case 'status': return statusOf(r.status).label;
      default: return String((r as unknown as Record<string, unknown>)[key] ?? '');
    }
  };
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const handleExportCSV = () => {
    const cols = columns.filter((c) => c.visible && c.key !== 'action' && c.key !== 'view');
    const rows = filtered.map((r, i) => cols.map((c) => esc(cellText(r, i, c.key))).join(','));
    const blob = new Blob(['\uFEFF' + [cols.map((c) => esc(c.label)).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assam_SWP_Installation_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Assam SWP installation requests exported as CSV.', 'Export Complete');
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(filtered.map((r, i) => [i + 1, r.vendorName, fmtDate(r.assignDate), capital(r.state), r.district, r.siteCount, fmtDate(r.deadlineDate), statusOf(r.status).label].join('\t')).join('\n'));
    toast.success('Table data copied to clipboard!', 'Copied');
  };
  const triggerRefresh = () => {
    toast.info('Refreshing installation requests…', 'Refreshing');
    loadRequests();
  };

  const renderCell = (key: string, r: Rec, i: number) => {
    switch (key) {
      case 'srNo': return <td key={key} className="ax-table__td ax-num text-dark-400 dark:text-dark-500">{start + i + 1}</td>;
      case 'vendorName': return <td key={key} className="ax-table__td font-medium text-dark-900 dark:text-dark-100">{r.vendorName}</td>;
      case 'assignDate': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.assignDate)}</td>;
      case 'state': return <td key={key} className="ax-table__td">{capital(r.state)}</td>;
      case 'district': return <td key={key} className="ax-table__td">{r.district || '—'}</td>;
      case 'names':
        return (
          <td key={key} className="ax-table__td">
            <ul className="m-0 pl-4 text-xs list-disc space-y-0.5 text-dark-700 dark:text-dark-300">
              {r.names.map((n, k) => <li key={k}>{n.farmer_name ?? '-'} - {n.father_name ?? '-'}</li>)}
            </ul>
          </td>
        );
      case 'siteCount': return <td key={key} className="ax-table__td ax-table__td--num">{r.siteCount}</td>;
      case 'deadlineDate': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.deadlineDate)}</td>;
      case 'file': {
        if (!r.file) return <td key={key} className="ax-table__td text-dark-400">—</td>;
        const url = fileUrl(r.file);
        const ext = fileExt(r.file);
        return (
          <td key={key} className="ax-table__td">
            <div className="ax-cluster items-center gap-1">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm ax-btn--icon"
                onClick={() => setFilePreview({ url, ext, title: `${r.vendorName} — Assignment File` })}
                title="View File"
                aria-label="View File"
              >
                <span className="ax-btn__icon">{ICON.eye}</span>
              </button>
              <a
                className="ax-btn ax-btn--ghost ax-btn--sm ax-btn--icon"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
                title="Download File"
                aria-label="Download File"
                onClick={() => toast.info('Starting file download…', 'Download')}
              >
                <span className="ax-btn__icon">{ICON.download}</span>
              </a>
            </div>
          </td>
        );
      }
      case 'view':
        return (
          <td key={key} className="ax-table__td">
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => handleViewDetail(r)}>
              <span className="ax-btn__icon">{ICON.eye}</span>
              <span className="ax-btn__label">View</span>
            </button>
          </td>
        );
      case 'remarks': return <td key={key} className="ax-table__td text-xs text-dark-500 max-w-[200px] whitespace-normal break-words">{r.remarks || '—'}</td>;
      case 'status': {
        const s = statusOf(r.status);
        return <td key={key} className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${s.tone}`}><span className="ax-badge__dot" />{s.label}</span></td>;
      }
      case 'action': return (
        <td key={key} className="ax-table__td text-center">
          <ActionCell item={r} onAccept={() => handleAccept(r)} isAccepting={actionLoadingId === r.id} />
        </td>
      );
      default: return <td key={key} className="ax-table__td" />;
    }
  };

  return (
    <>
      {/* Toastify floating notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <PageHead
        title="View Assigned SWP Installation"
        subtitle="Assam installation requests assigned to vendors"
        actions={
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={triggerRefresh} aria-label="Refresh data" aria-busy={loading}>
            <span className="ax-btn__icon">{ICON.refresh}</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned SWP installation requests">
          <div className="ax-card__header flex-wrap gap-3">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Assigned SWP Site</h2>
              <p className="ax-card__subtitle ax-num font-mono">{filtered.length} of {all.length} records</p>
            </div>
            <div className="ax-card__actions flex-wrap gap-2">
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportCSV}
                onExportPDF={handleExportCSV}
                columns={columns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover min-w-[1100px]">
              <caption className="ax-visually-hidden">Assigned SWP installation requests, sortable</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => {
                    const sortable = SORTABLE.includes(c.key);
                    return sortable ? (
                      <th key={c.key} className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort(c.key as SortKey)} onClick={() => sortBy(c.key as SortKey)}>
                        {c.label} {glyph(c.key as SortKey)}
                      </th>
                    ) : (
                      <th key={c.key} className={`ax-table__th ${c.key === 'action' ? 'text-center' : ''}`} scope="col">{c.label}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading
                  ? [0, 1, 2, 3, 4, 5].map((n) => (
                      <tr key={n} className="ax-table__row">
                        <td className="ax-table__td" colSpan={visibleCols.length}><div className="ax-skeleton ax-skeleton--line w-full" /></td>
                      </tr>
                    ))
                  : paged.map((r, i) => (
                      <tr key={r.id} className="ax-table__row">{visibleCols.map((c) => renderCell(c.key, r, i))}</tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div className="text-center py-10 px-5">
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle mx-auto mb-4 bg-dark-100 dark:bg-dark-800 text-dark-400">
                <span className="ax-avatar__icon inline-flex w-7 h-7">{ICON.search}</span>
              </span>
              <h3 className="text-dark-900 dark:text-dark-100 font-semibold text-lg mb-2">No requests found</h3>
              <p className="text-dark-500 text-sm mb-4">There are no installation requests to show.</p>
              {q && <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setPage(1); toast.info('Filter cleared.'); }}>Clear filter</button>}
            </div>
          )}

          {!!filtered.length && (
            <div className="ax-card__footer justify-between flex-wrap gap-3">
              <div className="ax-cluster gap-3">
                <span className="ax-pagination__summary ax-num font-mono text-xs">
                  Showing {rangeStart}–{rangeEnd} of {filtered.length}
                </span>
                <label className="ax-cluster">
                  Rows
                  <select className="ax-select ax-select--sm min-w-[72px]" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                  </select>
                </label>
              </div>
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(Math.max(1, curPage - 1))} aria-label="Previous page">{ICON.chevL}</button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p, i) => (
                    <li key={`${p}-${i}`}>
                      {p === '…'
                        ? <span className="ax-pagination__ellipsis">…</span>
                        : <button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => setPage(p)}>{p}</button>}
                    </li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(Math.min(totalPages, curPage + 1))} aria-label="Next page">{ICON.chevR}</button>
              </nav>
            </div>
          )}
        </section>
      </div>

      {/* VIEW DETAILS MODAL */}
      <Modal open={!!detail} onClose={() => setDetail(null)} labelledBy="req-detail-title" dialogClass="ax-modal__dialog--xl">
        {detail && (
          <>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="req-detail-title">Assignment details </h2>
              <button type="button" className="ax-modal__close" onClick={() => setDetail(null)} aria-label="Close dialog">{ICON.close}</button>
            </div>

            <div className="ax-modal__body flex flex-col gap-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  ['Vendor', detail.vendorName],
                  ['State', capital(detail.state)],
                  ['District', detail.district || '—'],
                  ['Sites', String(detail.siteCount)],
                  ['Assign date', fmtDate(detail.assignDate)],
                  ['Deadline', fmtDate(detail.deadlineDate)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="p-3.5 bg-light-10 dark:bg-light-800/60 border border-dark-200 dark:border-dark-700 rounded-lg">
                    <div className="text-[10px] uppercase tracking-wider text-dark-400 font-semibold">{k}</div>
                    <div className="mt-1 text-sm font-semibold text-dark-900 dark:text-dark-100">{v}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-dark-500 dark:text-dark-400">Status</span>
                <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusOf(detail.status).tone}`}><span className="ax-badge__dot" />{statusOf(detail.status).label}</span>
              </div>

              <div className="ax-table-wrap">
                {loadingDetail ? (
                  <div className="p-4 text-center text-sm text-dark-500">
                    Loading assignment site details…
                  </div>
                ) : (
                  <table className="ax-table ax-table--compact">
                    <caption className="ax-visually-hidden">Farmers in this assignment</caption>
                    <thead className="ax-table__head">
                      <tr>
                        <th className="ax-table__th" scope="col">#</th>
                        <th className="ax-table__th" scope="col">Farmer Name</th>
                        <th className="ax-table__th" scope="col">Father Name</th>
                        {detailRecord?.Names?.[0]?.district && <th className="ax-table__th" scope="col">District / Block</th>}
                        {detailRecord?.Names?.[0]?.pump_capacity && <th className="ax-table__th" scope="col">Pump</th>}
                        {detailRecord?.Names?.[0]?.farmer_contact && <th className="ax-table__th" scope="col">Contact</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(detailRecord?.Names || detail.names).map((n: any, i: number) => (
                        <tr key={i} className="ax-table__row">
                          <td className="ax-table__td ax-num text-dark-400 dark:text-dark-800">{i + 1}</td>
                          <td className="ax-table__td font-semibold">{n.farmer_name ?? '—'}</td>
                          <td className="ax-table__td">{n.father_name ?? '—'}</td>
                          {detailRecord?.Names?.[0]?.district && (
                            <td className="ax-table__td text-xs">
                              {n.district || '—'} {n.block ? `(${n.block})` : ''}
                            </td>
                          )}
                          {detailRecord?.Names?.[0]?.pump_capacity && (
                            <td className="ax-table__td text-xs">
                              {n.pump_capacity || '—'} {n.pump_type || ''} {n.pump_sub_type ? `(${n.pump_sub_type})` : ''}
                            </td>
                          )}
                          {detailRecord?.Names?.[0]?.farmer_contact && (
                            <td className="ax-table__td ax-num text-xs">
                              {n.farmer_contact || '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-dark-400 font-semibold mb-1">Remarks</div>
                <div className="text-sm text-dark-700 dark:text-dark-300">{detail.remarks || '—'}</div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <a
                className="ax-btn ax-btn--secondary"
                href={fileUrl(detail.file)}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={() => toast.info('Starting file download…', 'Download')}
              >
                <span className="ax-btn__icon">{ICON.download}</span>
                <span className="ax-btn__label">Download file</span>
              </a>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetail(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>

      {/* FILE VIEW & DOWNLOAD MODAL */}
      <Modal open={!!filePreview} onClose={() => setFilePreview(null)} labelledBy="file-preview-title" dialogClass="ax-modal__dialog--lg">
        {filePreview && (
          <>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="file-preview-title">{filePreview.title}</h2>
              <button type="button" className="ax-modal__close" onClick={() => setFilePreview(null)} aria-label="Close dialog">{ICON.close}</button>
            </div>
            <div className="ax-modal__body text-center p-4 max-h-[70vh] overflow-auto">
              {['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(filePreview.ext) ? (
                <img
                  src={filePreview.url}
                  alt={filePreview.title}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-dark-200 dark:border-dark-700 mx-auto shadow-sm"
                />
              ) : filePreview.ext === 'pdf' ? (
                <iframe
                  src={filePreview.url}
                  title={filePreview.title}
                  className="w-full h-[60vh] border border-dark-200 dark:border-dark-700 rounded-lg"
                />
              ) : (
                <div className="py-8 px-4 text-dark-500">
                  <p className="mb-2 text-base font-medium text-dark-900 dark:text-dark-100">
                    Direct inline preview not available for <strong className="font-semibold">.{filePreview.ext}</strong> files.
                  </p>
                  <p className="text-sm text-dark-500">
                    Please use the download button below to view this assignment document.
                  </p>
                </div>
              )}
            </div>
            <div className="ax-modal__footer justify-between">
              <a
                className="ax-btn ax-btn--primary"
                href={filePreview.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={() => toast.info('Starting file download…', 'Download')}
              >
                <span className="ax-btn__icon">{ICON.download}</span>
                <span className="ax-btn__label">Download File</span>
              </a>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setFilePreview(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default InstallationRequest;