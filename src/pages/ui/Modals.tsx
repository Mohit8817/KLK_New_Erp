/*
 * Vireo React — UI · Modals.
 * Faithful re-expression of src/html/ui/modals.html: dialog sizes (sm/default/
 * lg/fullscreen), a destructive confirm (alertdialog), a form dialog, a
 * scrollable long-content dialog with an agree gate, and centered / top-aligned
 * / success status dialogs. Alpine axModal() instances → native React Modal that
 * teleports to <body>, traps focus and Esc-closes; $toast → page-local store.
 * DOM/classes/ARIA 1:1.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PageHead } from '../../components/shell/PageHead';

interface Toast { id: number; msg: string; }
let TID = 0;

const X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>;

function Modal({ open, onClose, labelledBy, describedBy, role = 'dialog', centered = true, dialogClass = '', dialogStyle, modalStyle, closeOnBackdrop = true, children }: {
  open: boolean; onClose: () => void; labelledBy: string; describedBy?: string;
  role?: 'dialog' | 'alertdialog'; centered?: boolean; dialogClass?: string;
  dialogStyle?: React.CSSProperties; modalStyle?: React.CSSProperties; closeOnBackdrop?: boolean; children: ReactNode;
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
    <div className={`ax-modal${centered ? ' ax-modal--centered' : ''}`} role={role} aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} style={modalStyle}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>{children}</div>
    </div>,
    document.body,
  );
}

export function Modals() {
  const [sm, setSm] = useState(false);
  const [md, setMd] = useState(false);
  const [lg, setLg] = useState(false);
  const [fs, setFs] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [top, setTop] = useState(false);
  const [center, setCenter] = useState(false);
  const [ok, setOk] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('scale');
  const [agreed, setAgreed] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, number>>({});
  const toast = useCallback((msg: string, ttl: number) => {
    const id = ++TID;
    setToasts((t) => [...t, { id, msg }]);
    timers.current[id] = window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  return (
    <>
      <PageHead
        title="Modals"
        subtitle="Dialogs in every size and shape — confirm, form, scrollable, centered and status."
        actions={
          <a className="ax-btn ax-btn--secondary ax-btn--pill" href="#">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M15 4v16" /></svg>
            <span className="ax-btn__label">Offcanvas</span>
          </a>
        }
      />

      <div className="ax-dash-grid">
        {/* Sizes */}
        <section className="ax-card ax-col--6" role="region" aria-label="Modal sizes">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Sizing</span>
              <h2 className="ax-card__title">Dialog sizes</h2>
              <p className="ax-card__subtitle">From small confirmations up to a full-screen editor surface.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSm(true)}>Small</button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setMd(true)}>Default</button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setLg(true)}>Large</button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setFs(true)}>Fullscreen</button>
          </div>
        </section>

        {/* Confirm */}
        <section className="ax-card ax-col--6" role="region" aria-label="Confirmation modal">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Confirm</span>
              <h2 className="ax-card__title">Destructive confirm</h2>
              <p className="ax-card__subtitle">A status glyph, plain-language body and a danger primary.</p>
            </div>
          </div>
          <div className="ax-card__body">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setConfirm(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
              <span className="ax-btn__label">Delete invoice</span>
            </button>
          </div>
        </section>

        {/* Form modal */}
        <section className="ax-card ax-col--6" role="region" aria-label="Form modal">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Form</span>
              <h2 className="ax-card__title">Form dialog</h2>
              <p className="ax-card__subtitle">Collect input inside a dialog; submit is simulated.</p>
            </div>
          </div>
          <div className="ax-card__body">
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setForm(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11h6m-3 -3v6" /></svg>
              <span className="ax-btn__label">Invite member</span>
            </button>
          </div>
        </section>

        {/* Scrollable */}
        <section className="ax-card ax-col--6" role="region" aria-label="Scrollable modal">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Scrollable</span>
              <h2 className="ax-card__title">Long-content dialog</h2>
              <p className="ax-card__subtitle">Header &amp; footer stay fixed; the body scrolls.</p>
            </div>
          </div>
          <div className="ax-card__body">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setScroll(true)}>Read terms</button>
          </div>
        </section>

        {/* Centered success + top-aligned */}
        <section className="ax-card ax-col--12" role="region" aria-label="Centered and top-aligned modals">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Alignment &amp; status</span>
              <h2 className="ax-card__title">Centered, top-aligned &amp; success</h2>
              <p className="ax-card__subtitle">Vertical placement and a celebratory status dialog.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setTop(true)}>Top-aligned</button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setCenter(true)}>Centered</button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setOk(true)}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
              <span className="ax-btn__label">Show success</span>
            </button>
          </div>
        </section>
      </div>

      {/* ───── Modals ───── */}
      <Modal open={sm} onClose={() => setSm(false)} labelledBy="m-sm-title" dialogClass="ax-modal__dialog--sm">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-sm-title">Small dialog</h2>
          <button type="button" className="ax-modal__close" onClick={() => setSm(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Compact 420px dialog — ideal for a single quick decision or short message.</p></div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--primary" onClick={() => setSm(false)}>Got it</button></div>
      </Modal>

      <Modal open={md} onClose={() => setMd(false)} labelledBy="m-md-title">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-md-title">Default dialog</h2>
          <button type="button" className="ax-modal__close" onClick={() => setMd(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>The 560px default — comfortable room for a paragraph, a short form or a summary block.</p></div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--ghost" onClick={() => setMd(false)}>Cancel</button><button type="button" className="ax-btn ax-btn--primary" onClick={() => setMd(false)}>Save</button></div>
      </Modal>

      <Modal open={lg} onClose={() => setLg(false)} labelledBy="m-lg-title" dialogClass="ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-lg-title">Large dialog</h2>
          <button type="button" className="ax-modal__close" onClick={() => setLg(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body"><p style={{ margin: '0 0 var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>760px wide — for side-by-side content, comparison tables or a two-column form.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-4)' }}>
            <div style={{ padding: 'var(--ax-space-4)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}><b style={{ color: 'var(--ax-text-strong)' }}>Current plan</b><p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Scale · $49/mo · 18 seats</p></div>
            <div style={{ padding: 'var(--ax-space-4)', background: 'var(--ax-accent-wash)', border: '1px solid var(--ax-accent)', borderRadius: 'var(--ax-radius-md)' }}><b style={{ color: 'var(--ax-accent)' }}>Upgrade to Pro</b><p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Unlimited seats · SSO · SLA</p></div>
          </div>
        </div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--ghost" onClick={() => setLg(false)}>Maybe later</button><button type="button" className="ax-btn ax-btn--primary" onClick={() => setLg(false)}>Upgrade</button></div>
      </Modal>

      <Modal open={fs} onClose={() => setFs(false)} labelledBy="m-fs-title" centered={false} dialogClass="ax-modal__dialog--fullscreen" modalStyle={{ padding: 0 }}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-fs-title">Fullscreen editor</h2>
          <button type="button" className="ax-modal__close" onClick={() => setFs(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body" style={{ display: 'grid', placeItems: 'center', color: 'var(--ax-text-muted)' }}><p style={{ margin: 0 }}>A 100vw × 100vh canvas — for immersive editors, galleries and onboarding flows.</p></div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--primary" onClick={() => setFs(false)}>Done</button></div>
      </Modal>

      <Modal open={confirm} onClose={() => setConfirm(false)} labelledBy="m-confirm-title" describedBy="m-confirm-desc" role="alertdialog" dialogClass="ax-modal__dialog--sm">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)' }}>
          <span className="ax-modal__status ax-modal__status--danger"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg></span>
          <h2 className="ax-modal__title" id="m-confirm-title">Delete invoice INV-2025-0118?</h2>
          <p id="m-confirm-desc" style={{ margin: 0, color: 'var(--ax-text-muted)' }}>This permanently removes the invoice and its payment record. This action can't be undone.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setConfirm(false)}>Cancel</button>
          <button type="button" className="ax-btn ax-btn--primary" style={{ background: 'var(--ax-danger-500)', boxShadow: 'none' }} onClick={() => { setConfirm(false); toast('Invoice deleted', 3000); }}>Delete invoice</button>
        </div>
      </Modal>

      <Modal open={form} onClose={() => setForm(false)} labelledBy="m-form-title">
        <form onSubmit={(e) => { e.preventDefault(); setForm(false); toast('Invitation sent to ' + (email || 'your teammate'), 3500); setName(''); setEmail(''); }}>
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="m-form-title">Invite a team member</h2>
            <button type="button" className="ax-modal__close" onClick={() => setForm(false)} aria-label="Close dialog">{X}</button>
          </div>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div className="ax-field">
              <label className="ax-label" htmlFor="m-name">Full name</label>
              <input id="m-name" type="text" className="ax-input" placeholder="e.g. Yuki Tanaka" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="m-email">Work email <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span></label>
              <input id="m-email" type="email" className="ax-input" placeholder="name@northwindlabs.app" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
              <span className="ax-help">They'll get an invite link valid for 7 days.</span>
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="m-role">Role</label>
              <select id="m-role" className="ax-select" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="scale">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setForm(false)}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary">Send invite</button>
          </div>
        </form>
      </Modal>

      <Modal open={scroll} onClose={() => setScroll(false)} labelledBy="m-scroll-title" dialogClass="ax-modal__dialog--scrollable" dialogStyle={{ maxHeight: 'calc(100vh - var(--ax-space-16))' }}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-scroll-title">Terms of service</h2>
          <button type="button" className="ax-modal__close" onClick={() => setScroll(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>1. Acceptance.</b> By using Vireo you agree to these terms in full. If you do not agree, do not use the product.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>2. License.</b> Northwind Labs grants you a non-exclusive licence to use the template on a single end product per regular licence.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>3. Restrictions.</b> You may not redistribute the source files as a competing template or stock item.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>4. Data.</b> All demo data shipped with the template is fictional and provided for illustration only.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>5. Support.</b> Item support covers responding to questions about features and assistance with reported bugs for six months.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>6. Updates.</b> You are entitled to all future updates of the item at no extra cost for the lifetime of the item.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>7. Liability.</b> The item is provided "as is" without warranty of any kind, express or implied.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>8. Termination.</b> This licence terminates automatically if you breach any of its terms.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>9. Governing law.</b> These terms are governed by the laws of the jurisdiction in which Northwind Labs operates.</p>
          <p style={{ margin: 0 }}><b style={{ color: 'var(--ax-text-strong)' }}>10. Contact.</b> Questions about these terms can be sent to legal@northwindlabs.app.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}><input type="checkbox" className="ax-checkbox" checked={agreed} onChange={() => setAgreed((a) => !a)} /> I have read the terms</label>
          <button type="button" className="ax-btn ax-btn--primary" disabled={!agreed} aria-disabled={!agreed} onClick={() => { setScroll(false); toast('Terms accepted', 3000); }}>Accept</button>
        </div>
      </Modal>

      <Modal open={top} onClose={() => setTop(false)} labelledBy="m-top-title" centered={false}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-top-title">Top-aligned dialog</h2>
          <button type="button" className="ax-modal__close" onClick={() => setTop(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Anchored near the top of the viewport — the default for content that may grow tall.</p></div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--primary" onClick={() => setTop(false)}>Close</button></div>
      </Modal>

      <Modal open={center} onClose={() => setCenter(false)} labelledBy="m-center-title">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="m-center-title">Centered dialog</h2>
          <button type="button" className="ax-modal__close" onClick={() => setCenter(false)} aria-label="Close dialog">{X}</button>
        </div>
        <div className="ax-modal__body"><p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Vertically centered in the viewport — best for short, focused confirmations.</p></div>
        <div className="ax-modal__footer"><button type="button" className="ax-btn ax-btn--primary" onClick={() => setCenter(false)}>Close</button></div>
      </Modal>

      <Modal open={ok} onClose={() => setOk(false)} labelledBy="m-ok-title" dialogClass="ax-modal__dialog--sm">
        <div className="ax-modal__body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-7)' }}>
          <span className="ax-modal__status ax-modal__status--success"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
          <h2 className="ax-modal__title" id="m-ok-title">Payment received</h2>
          <p style={{ margin: 0, color: 'var(--ax-text-muted)' }}>Order <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)' }}>#10482</span> was paid and is now being prepared for shipment.</p>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'center' }}><button type="button" className="ax-btn ax-btn--primary" onClick={() => setOk(false)}>View order</button></div>
      </Modal>

      {/* ───── Toast region ───── */}
      {toasts.length > 0 && createPortal(
        <div className="ax-toast-region" aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 'var(--ax-space-6)', insetInlineEnd: 'var(--ax-space-6)', zIndex: 95, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          {toasts.map((t) => (
            <div key={t.id} className="ax-toast" role="status">
              <div className="ax-toast__content"><p className="ax-toast__message">{t.msg}</p></div>
              <button type="button" className="ax-toast__dismiss" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Dismiss">{X}</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default Modals;
