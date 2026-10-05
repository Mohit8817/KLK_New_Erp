/*
 * Vireo React — Sweet Alerts (route "pages/sweet-alerts").
 *
 * Faithful re-expression of src/html/pages/sweet-alerts.html: a gallery of status
 * dialogs (success/error/warning/info), confirmations (destructive + async
 * loading→success), prompt/input alerts (text, select, email) and a stack of
 * corner toasts. The Alpine axModal() instances + global $toast store are ported
 * to native React state. DOM classes + ARIA match the reference 1:1.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PageHead } from '../../components/shell/PageHead';

/* ── Toast store (page-local mirror of the global $toast) ── */
interface Toast { id: number; msg: string; ttl: number; }
let TOAST_ID = 0;

/* ── A centered modal that teleports to <body>, traps focus, Esc-closes ── */
function Modal({ open, onClose, labelledBy, describedBy, role = 'dialog', busy, children, closeOnBackdrop = true }: {
  open: boolean; onClose: () => void; labelledBy: string; describedBy?: string;
  role?: 'dialog' | 'alertdialog'; busy?: boolean; children: ReactNode; closeOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ax-modal ax-modal--centered" role={role} aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} aria-busy={busy}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--sm">{children}</div>
    </div>,
    document.body,
  );
}

const STATUS = {
  success: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>,
  danger: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>,
  warning: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>,
  info: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9h.01" /><path d="M11 12h1v4h1" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /></svg>,
  trash: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /></svg>,
  publish: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>,
  pencil: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5z" /><path d="M13.5 6.5l4 4" /></svg>,
  mail: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>,
};

export function SweetAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, number>>({});
  const toast = useCallback((msg: string, ttl: number) => {
    const id = ++TOAST_ID;
    setToasts((t) => [...t, { id, msg, ttl }]);
    timers.current[id] = window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      delete timers.current[id];
    }, ttl);
  }, []);

  /* modal open-state for each demo */
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const [warn, setWarn] = useState(false);
  const [info, setInfo] = useState(false);
  const [del, setDel] = useState(false);
  const [pub, setPub] = useState(false);
  const [async1, setAsync1] = useState(false);
  const [asyncState, setAsyncState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [rename, setRename] = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [choice, setChoice] = useState('shipped');
  const [sub, setSub] = useState(false);
  const [email, setEmail] = useState('');

  const runAsync = () => { setAsync1(true); setAsyncState('loading'); setTimeout(() => setAsyncState('done'), 1600); };
  const renameValid = renameVal.trim().length > 1;

  return (
    <>
      <PageHead
        title="Sweet Alerts"
        subtitle="A gallery of status dialogs — success, error, warning, confirm, prompt and a stack of corner toasts. Pure Alpine, no library."
        actions={
          <a className="ax-btn ax-btn--secondary ax-btn--pill" href="#">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M9 9h6v6h-6z" /></svg>
            <span className="ax-btn__label">Modals</span>
          </a>
        }
      />

      <div className="ax-dash-grid">
        {/* STATUS ALERTS */}
        <section className="ax-card ax-col--6" role="region" aria-label="Status alerts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Status</span>
              <h2 className="ax-card__title">Status alerts</h2>
              <p className="ax-card__subtitle">A coloured status glyph, a title and a short message — one button to dismiss.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setOk(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-success-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
              <span className="ax-btn__label">Success</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setErr(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-danger-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
              <span className="ax-btn__label">Error</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setWarn(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-warning-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
              <span className="ax-btn__label">Warning</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setInfo(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-info-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9h.01" /><path d="M11 12h1v4h1" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /></svg>
              <span className="ax-btn__label">Info</span>
            </button>
          </div>
        </section>

        {/* CONFIRM */}
        <section className="ax-card ax-col--6" role="region" aria-label="Confirmation alerts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Confirm</span>
              <h2 className="ax-card__title">Confirmations</h2>
              <p className="ax-card__subtitle">Two-button decisions — destructive actions get a danger primary and a result toast.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDel(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
              <span className="ax-btn__label">Delete invoice</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setPub(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12l2 2l4 -4" /><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" /></svg>
              <span className="ax-btn__label">Publish report</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={runAsync}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 13l2 2l4 -4" /></svg>
              <span className="ax-btn__label">Sync &amp; confirm</span>
            </button>
          </div>
        </section>

        {/* PROMPT */}
        <section className="ax-card ax-col--6" role="region" aria-label="Prompt alerts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Prompt</span>
              <h2 className="ax-card__title">Input alerts</h2>
              <p className="ax-card__subtitle">Collect a value inside the dialog — text or a single choice. Submit is simulated.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setRename(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5z" /><path d="M13.5 6.5l4 4" /></svg>
              <span className="ax-btn__label">Rename board</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setStatusOpen(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></svg>
              <span className="ax-btn__label">Change status</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSub(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
              <span className="ax-btn__label">Subscribe</span>
            </button>
          </div>
        </section>

        {/* TOASTS */}
        <section className="ax-card ax-col--6" role="region" aria-label="Toast notifications">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Toast</span>
              <h2 className="ax-card__title">Corner toasts</h2>
              <p className="ax-card__subtitle">Lightweight, auto-dismissing notifications that stack in the corner — fired through the global toast store.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => toast('Changes saved', 3000)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-success-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
              <span className="ax-btn__label">Success toast</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => toast('Couldn’t reach the server — retrying', 3500)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-danger-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
              <span className="ax-btn__label">Error toast</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => toast('New order #10483 just landed', 4000)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="var(--ax-info-500)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2" /></svg>
              <span className="ax-btn__label">Info toast</span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { toast('Export ready', 3000); toast('Report shared with the team', 3500); toast('2 reminders scheduled', 4000); }}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
              <span className="ax-btn__label">Stack three</span>
            </button>
          </div>
          <div className="ax-card__footer">
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Toasts render through the app's global toast region — they stack and auto-dismiss on their own timer.</span>
          </div>
        </section>
      </div>

      {/* ───── Modals ───── */}
      <Modal open={ok} onClose={() => setOk(false)} labelledBy="sa-ok-title">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--success">{STATUS.success}</span>
          <h2 className="ax-modal__title" id="sa-ok-title">Payment received</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Order <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>#10482</span> was paid and is now being prepared for shipment.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}><button type="button" className="ax-btn ax-btn--primary" onClick={() => setOk(false)}>Great</button></div>
      </Modal>

      <Modal open={err} onClose={() => setErr(false)} labelledBy="sa-err-title" role="alertdialog">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--danger">{STATUS.danger}</span>
          <h2 className="ax-modal__title" id="sa-err-title">Payment failed</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>We couldn't charge the card on file. Update the payment method and try again.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}><button type="button" className="ax-btn ax-btn--secondary" onClick={() => setErr(false)}>Close</button><button type="button" className="ax-btn ax-btn--primary" onClick={() => setErr(false)}>Update card</button></div>
      </Modal>

      <Modal open={warn} onClose={() => setWarn(false)} labelledBy="sa-warn-title" role="alertdialog">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--warning">{STATUS.warning}</span>
          <h2 className="ax-modal__title" id="sa-warn-title">Your trial ends soon</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Just <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>3</span> days of your Scale trial remain. Add a plan to keep your reports live.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}><button type="button" className="ax-btn ax-btn--ghost" onClick={() => setWarn(false)}>Remind me later</button><button type="button" className="ax-btn ax-btn--primary" onClick={() => setWarn(false)}>Choose a plan</button></div>
      </Modal>

      <Modal open={info} onClose={() => setInfo(false)} labelledBy="sa-info-title">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--info">{STATUS.info}</span>
          <h2 className="ax-modal__title" id="sa-info-title">Weekly digest ready</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Your Northwind Pulse digest for this week is ready to read — five highlights and two flags.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}><button type="button" className="ax-btn ax-btn--primary" onClick={() => setInfo(false)}>Read digest</button></div>
      </Modal>

      <Modal open={del} onClose={() => setDel(false)} labelledBy="sa-del-title" describedBy="sa-del-desc" role="alertdialog">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--danger">{STATUS.trash}</span>
          <h2 className="ax-modal__title" id="sa-del-title">Delete invoice INV-2025-0118?</h2>
          <p id="sa-del-desc" style={{ margin: 0, color: 'var(--ax-text-muted)' }}>This permanently removes the invoice and its payment record. This action can't be undone.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDel(false)}>Cancel</button>
          <button type="button" className="ax-btn ax-btn--primary" style={{ background: 'var(--ax-danger-500)', boxShadow: 'none' }} onClick={() => { setDel(false); toast('Invoice INV-2025-0118 deleted', 3200); }}>Yes, delete it</button>
        </div>
      </Modal>

      <Modal open={pub} onClose={() => setPub(false)} labelledBy="sa-pub-title">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--info">{STATUS.publish}</span>
          <h2 className="ax-modal__title" id="sa-pub-title">Publish the weekly report?</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Everyone in the Northwind Labs workspace will be notified once it goes live.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setPub(false)}>Not yet</button>
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => { setPub(false); toast('Report published to your workspace', 3200); }}>Publish now</button>
        </div>
      </Modal>

      <Modal open={async1} onClose={() => { if (asyncState !== 'loading') setAsync1(false); }} labelledBy="sa-async-title" busy={asyncState === 'loading'} closeOnBackdrop={asyncState !== 'loading'}>
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          {asyncState === 'loading' && <span className="ax-spinner ax-spinner--lg" role="status" aria-label="Syncing"><span className="ax-spinner__glyph" /></span>}
          {asyncState === 'done' && <span className="ax-modal__status ax-modal__status--success">{STATUS.success}</span>}
          <h2 className="ax-modal__title" id="sa-async-title">{asyncState === 'loading' ? 'Syncing your data…' : 'All synced up'}</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>{asyncState === 'loading' ? 'Pulling the latest figures from your connected sources.' : 'Your dashboard now reflects the most recent data.'}</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
          {asyncState === 'done' && <button type="button" className="ax-btn ax-btn--primary" onClick={() => { setAsync1(false); setAsyncState('idle'); }}>Done</button>}
        </div>
      </Modal>

      <Modal open={rename} onClose={() => setRename(false)} labelledBy="sa-rename-title">
        <form onSubmit={(e) => { e.preventDefault(); if (renameValid) { setRename(false); toast(`Board renamed to “${renameVal}”`, 3200); setRenameVal(''); } }}>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', textAlign: 'center', alignItems: 'center', paddingTop: 'var(--ax-space-7)' }}>
            <span className="ax-modal__status ax-modal__status--info">{STATUS.pencil}</span>
            <h2 className="ax-modal__title" id="sa-rename-title">Rename this board</h2>
            <div className="ax-field" style={{ width: '100%', textAlign: 'start' }}>
              <label className="ax-label" htmlFor="sa-rename-input">Board name</label>
              <input id="sa-rename-input" type="text" className="ax-input" placeholder="e.g. Q3 Roadmap" value={renameVal} onChange={(e) => setRenameVal(e.target.value)} autoComplete="off" autoFocus />
              <span className="ax-help">Use at least two characters.</span>
            </div>
          </div>
          <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setRename(false)}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={!renameValid} aria-disabled={!renameValid}>Save name</button>
          </div>
        </form>
      </Modal>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} labelledBy="sa-status-title">
        <form onSubmit={(e) => { e.preventDefault(); setStatusOpen(false); toast(`Order #10482 marked as ${choice}`, 3200); }}>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-6)' }}>
            <h2 className="ax-modal__title" id="sa-status-title">Update order status</h2>
            <p style={{ margin: 0, color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Set a new status for order <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>#10482</span>.</p>
            <div className="ax-field">
              <label className="ax-label" htmlFor="sa-status-select">Status</label>
              <select id="sa-status-select" className="ax-select" value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setStatusOpen(false)}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary">Update status</button>
          </div>
        </form>
      </Modal>

      <Modal open={sub} onClose={() => setSub(false)} labelledBy="sa-sub-title">
        <form onSubmit={(e) => { e.preventDefault(); setSub(false); toast(`Subscribed ${email || 'you'} to Northwind Pulse`, 3200); setEmail(''); }}>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', textAlign: 'center', alignItems: 'center', paddingTop: 'var(--ax-space-7)' }}>
            <span className="ax-modal__status ax-modal__status--info">{STATUS.mail}</span>
            <h2 className="ax-modal__title" id="sa-sub-title">Get the weekly Pulse</h2>
            <p style={{ margin: 0, color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>One email a week — product news and your headline metrics.</p>
            <div className="ax-field" style={{ width: '100%', textAlign: 'start' }}>
              <label className="ax-label" htmlFor="sa-sub-input">Work email</label>
              <input id="sa-sub-input" type="email" className="ax-input" placeholder="name@northwindlabs.app" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
            </div>
          </div>
          <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setSub(false)}>No thanks</button>
            <button type="submit" className="ax-btn ax-btn--primary">Subscribe</button>
          </div>
        </form>
      </Modal>

      {/* ───── Toast region ───── */}
      {toasts.length > 0 && createPortal(
        <div className="ax-toast-region" aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 'var(--ax-space-6)', insetInlineEnd: 'var(--ax-space-6)', zIndex: 95, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          {toasts.map((t) => (
            <div key={t.id} className="ax-toast" role="status">
              <div className="ax-toast__content"><p className="ax-toast__message">{t.msg}</p></div>
              <button type="button" className="ax-toast__dismiss" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default SweetAlerts;
