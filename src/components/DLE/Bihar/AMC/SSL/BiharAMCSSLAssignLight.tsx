import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  dleService,
  extractList,
  filterByCompany,
  filterApproved,
} from '../../../../../services/dleServices';
import {
  biharSslAmc,
  toOptions,
  type Option,
} from '../../../../../services/Sslamcservice';

const FLOAT_CSS = `
.ax-float{position:relative}
.ax-float__input::placeholder{color:transparent}

.ax-float__label{
  position:absolute;
  inset-inline-start:var(--ax-space-3);
  top:50%;
  transform:translateY(-50%);
  margin:0;
  padding-inline:4px;
  font-size:var(--ax-text-sm);
  color:var(--ax-text-subtle);
  background:var(--ax-surface-solid);
  border-radius:var(--ax-radius-xs);
  pointer-events:none;
  transition:
    top var(--ax-motion-fast) var(--ax-ease-standard),
    font-size var(--ax-motion-fast) var(--ax-ease-standard),
    color var(--ax-motion-fast) var(--ax-ease-standard)
}

.ax-float--area .ax-float__label{
  top:calc(var(--ax-space-3) + 9px);
  transform:none
}

.ax-float__input:focus+.ax-float__label,
.ax-float__input:not(:placeholder-shown)+.ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--area .ax-float__input:focus+.ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown)+.ax-float__label{
  top:0;
  font-size:var(--ax-text-2xs);
  color:var(--ax-text-muted)
}

.ax-float__input:focus+.ax-float__label{
  color:var(--ax-accent)
}

.ax-float__input.is-invalid+.ax-float__label{
  color:var(--ax-danger-500)
}

.ax-ms{
  position:relative
}

.ax-ms__panel{
  position:absolute;
  inset-inline:0;
  top:calc(100% + 4px);
  z-index:20;
  max-height:240px;
  overflow:auto;
  background:var(--ax-surface-solid);
  border:1px solid var(--ax-border);
  border-radius:var(--ax-radius-md);
  padding:var(--ax-space-2)
}

.ax-ms__item{
  display:flex;
  gap:var(--ax-space-2);
  align-items:center;
  padding:6px var(--ax-space-2);
  font-size:var(--ax-text-sm);
  cursor:pointer
}

@media (prefers-reduced-motion:reduce){
  .ax-float__label{
    transition:none
  }
}

.bh-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:var(--ax-space-6)
}
.bh-span2{grid-column:span 2}
.bh-footer{
  display:flex;
  justify-content:space-between;
  gap:var(--ax-space-3)
}

@media (max-width:640px){
  .bh-grid{
    grid-template-columns:minmax(0,1fr);
    gap:var(--ax-space-4)
  }
  .bh-span2{grid-column:auto}
  .bh-grid .ax-select,
  .bh-grid .ax-select option,
  .bh-grid .ax-textarea,
  .ax-ms__item{
    font-size:12px;
      padding:2px 10px !important;
  }
  .bh-empty{display:none}
  .bh-footer{flex-direction:column}
  .bh-footer .ax-btn{width:100%}
  .ax-float__label{
    max-width:calc(100% - var(--ax-space-6));
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap
  }
  .ax-ms__panel{max-height:50vh}
}
`;

export function BiharAMCSSLAssignLight() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<Option[]>([]);
  const [volumes, setVolumes] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [panchayats, setPanchayats] = useState<Option[]>([]);

  const [f, setF] = useState({
    user_id: '',
    volume: '',
    district_id: '',
    block_id: '',
    remarks: '',
  });

  const [selPan, setSelPan] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState(false);

  const [alert, setAlert] = useState<{
    type: 'success' | 'danger';
    msg: string;
  } | null>(null);

  const msRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof f, v: string) => {
    setF((s) => ({
      ...s,
      [k]: v,
    }));
  };

  const fail = (e: any) => {
    if (e?.name !== 'AbortError') {
      setAlert({
        type: 'danger',
        msg: e?.message || 'Something went wrong.',
      });
    }
  };

  /* ─────────────────────────────────────────────
     Load ONLY Bihar DLE Users
     ───────────────────────────────────────────── */

  useEffect(() => {
    const ac = new AbortController();

    dleService
      .getAdminUsers(ac.signal)
      .then((j: any) => {
        // 1) Company match (ya company null)
        const companyUsers = filterByCompany(extractList(j));

        // 2) Sirf approved
        const approvedUsers = filterApproved(companyUsers);

        // 3) Bihar state
        const biharUsers = approvedUsers.filter(
          (u: any) =>
            String(u?.state ?? '').trim().toLowerCase() === 'bihar'
        );

        setUsers(toOptions(biharUsers));

        if (!biharUsers.length) {
          setAlert({
            type: 'danger',
            msg: 'No approved DLE users found for your company.',
          });
        }
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load Bihar DLE users:', err);
          setAlert({
            type: 'danger',
            msg: err?.message || 'Unable to load Bihar DLE users.',
          });
        }
      });

    /* Load Bihar volumes */

    biharSslAmc
      .getVolumes(ac.signal)
      .then((j) => setVolumes(toOptions(j)))
      .catch(fail);

    return () => ac.abort();
  }, []);

  /* ─────────────────────────────────────────────
     Close Panchayat Dropdown On Outside Click
     ───────────────────────────────────────────── */

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (msRef.current && !msRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', h);

    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ─────────────────────────────────────────────
     Volume
     ───────────────────────────────────────────── */

  const onVolume = (v: string) => {
    setF((s) => ({
      ...s,
      volume: v,
      district_id: '',
      block_id: '',
    }));

    setDistricts([]);
    setBlocks([]);
    setPanchayats([]);
    setSelPan([]);

    if (!v) return;

    biharSslAmc
      .getDistricts(v)
      .then((j) => setDistricts(toOptions(j)))
      .catch(fail);
  };

  /* ─────────────────────────────────────────────
     District
     ───────────────────────────────────────────── */

  const onDistrict = (v: string) => {
    setF((s) => ({
      ...s,
      district_id: v,
      block_id: '',
    }));

    setBlocks([]);
    setPanchayats([]);
    setSelPan([]);

    if (!v) return;

    biharSslAmc
      .getBlocks(v, f.volume)
      .then((j) => setBlocks(toOptions(j)))
      .catch(fail);
  };

  /* ─────────────────────────────────────────────
     Block
     ───────────────────────────────────────────── */

  const onBlock = (v: string) => {
    setF((s) => ({
      ...s,
      block_id: v,
    }));

    setPanchayats([]);
    setSelPan([]);

    if (!v) return;

    biharSslAmc
      .getPanchayats(v, f.district_id, f.volume)
      .then((j) => setPanchayats(toOptions(j)))
      .catch(fail);
  };

  /* ─────────────────────────────────────────────
     Panchayat
     ───────────────────────────────────────────── */

  const toggle = (v: string) => {
    setSelPan((s) =>
      s.includes(v) ? s.filter((x) => x !== v) : [...s, v]
    );
  };

  const allSelected =
    panchayats.length > 0 && selPan.length === panchayats.length;

  /* ─────────────────────────────────────────────
     Submit
     ───────────────────────────────────────────── */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const er: Record<string, string> = {};

    if (!f.user_id) {
      er.user_id = 'Select a user.';
    }

    if (!f.volume) {
      er.volume = 'Select a volume.';
    }

    if (!f.district_id) {
      er.district_id = 'Select a district.';
    }

    if (!f.block_id) {
      er.block_id = 'Select a block.';
    }

    if (!selPan.length) {
      er.panchayat = 'Select at least one panchayat.';
    }

    setErrors(er);

    if (Object.keys(er).length) {
      return;
    }

    setBusy(true);
    setAlert(null);

    try {
      const res = await biharSslAmc.storeAssignLight({
        ...f,
        users:f.user_id,
        district: f.district_id,
        block: f.block_id,
        panchayat_id: selPan,
        panchayat: selPan,
      });

      console.log(res)

      setAlert({
        type: 'success',
        msg: res?.message || 'Assigned successfully.',
      });

      setF({
        user_id: '',
        volume: '',
        district_id: '',
        block_id: '',
        remarks: '',
      });

      setDistricts([]);
      setBlocks([]);
      setPanchayats([]);
      setSelPan([]);
      setErrors({});
      setOpen(false);
    } catch (err: any) {
      setAlert({
        type: 'danger',
        msg: err?.message || 'Something went wrong.',
      });
    } finally {
      setBusy(false);
    }
  };

  const scls = (k: string) =>
    `ax-select ax-float__input${errors[k] ? ' is-invalid' : ''}`;

  const err = (k: string) =>
    errors[k] && (
      <span
        className="ax-field__message ax-field__message--error"
        role="alert"
        style={{
          display: 'block',
          marginTop: 'var(--ax-space-2)',
        }}
      >
        {errors[k]}
      </span>
    );

  const panLabel = (v: string) =>
    panchayats.find((p) => p.value === v)?.label ?? v;

  return (
    <>
      <style>{FLOAT_CSS}</style>

      <PageHead
        title="Assign Bihar SSL AMC Sites"
        subtitle="Assign SSL lights to a DLE user by volume, district, block and panchayats."
      />

      <div className="ax-dash-grid" style={{ marginTop: '-26px' }}>
        {alert && (
          <div className="ax-col--12">
            <div
              className={`ax-alert ax-alert--${alert.type}`}
              role="status"
            >
              <div className="ax-alert__content">
                <p className="ax-alert__message">{alert.msg}</p>
              </div>
            </div>
          </div>
        )}

        <section
          className="ax-card ax-col--12 ax-card--accent-edge"
          role="region"
          aria-label="Assign Bihar SSL lights"
        >
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Bihar</span>

              <p className="ax-card__subtitle">
                All fields except remarks are required.
              </p>
            </div>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="ax-card__body">
              <div className="bh-grid">
                {/* DLE USER */}

                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="bh-user"
                      className={scls('user_id')}
                      value={f.user_id}
                      onChange={(e) => set('user_id', e.target.value)}
                    >
                      <option value="">Select DLE User</option>

                      {users.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="bh-user">
                      DLE users *
                    </label>
                  </div>

                  {err('user_id')}
                </div>

                {/* VOLUME */}

                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="bh-vol"
                      className={scls('volume')}
                      value={f.volume}
                      onChange={(e) => onVolume(e.target.value)}
                    >
                      <option value="">Select Volume</option>
                      <option value="0">ALL</option>

                      {volumes.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="bh-vol">
                      Volume *
                    </label>
                  </div>

                  {err('volume')}
                </div>

                {/* DISTRICT */}

                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="bh-dist"
                      className={scls('district_id')}
                      value={f.district_id}
                      onChange={(e) => onDistrict(e.target.value)}
                      disabled={!f.volume}
                    >
                      <option value="">Select District</option>

                      {districts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="bh-dist">
                      District *
                    </label>
                  </div>

                  {err('district_id')}
                </div>

                {/* BLOCK */}

                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="bh-block"
                      className={scls('block_id')}
                      value={f.block_id}
                      onChange={(e) => onBlock(e.target.value)}
                      disabled={!f.district_id}
                    >
                      <option value="">Select Block</option>

                      {blocks.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="bh-block">
                      Block *
                    </label>
                  </div>

                  {err('block_id')}
                </div>

                {/* PANCHAYAT */}

                <div className="ax-ms" ref={msRef}>
                  <div className="ax-float ax-float--select">
                    <select
                      id="bh-pan"
                      className={scls('panchayat')}
                      value=""
                      onChange={() => {}}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (f.block_id) setOpen((o) => !o);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' ||
                          e.key === ' ' ||
                          e.key === 'ArrowDown'
                        ) {
                          e.preventDefault();
                          if (f.block_id) setOpen(true);
                        } else if (e.key === 'Escape') {
                          setOpen(false);
                        }
                      }}
                      disabled={!f.block_id}
                      aria-haspopup="listbox"
                      aria-expanded={open}
                    >
                      <option value="">
                        {selPan.length
                          ? `${selPan.length} selected`
                          : 'Select Panchayat'}
                      </option>
                    </select>

                    <label className="ax-float__label" htmlFor="bh-pan">
                      Panchayat *
                    </label>
                  </div>

                  {open && (
                    <div
                      className="ax-ms__panel"
                      role="listbox"
                      aria-multiselectable="true"
                    >
                      {panchayats.length === 0 && (
                        <div
                          className="ax-ms__item"
                          style={{ color: 'var(--ax-text-subtle)' }}
                        >
                          No panchayat found
                        </div>
                      )}

                      {panchayats.length > 0 && (
                        <label
                          className="ax-ms__item"
                          style={{ fontWeight: 'var(--ax-weight-semibold)' }}
                        >
                          <input
                            type="checkbox"
                            className="ax-checkbox"
                            checked={allSelected}
                            onChange={() =>
                              setSelPan(
                                allSelected ? [] : panchayats.map((p) => p.value)
                              )
                            }
                          />
                          Select all
                        </label>
                      )}

                      {panchayats.map((p) => (
                        <label key={p.value} className="ax-ms__item">
                          <input
                            type="checkbox"
                            className="ax-checkbox"
                            checked={selPan.includes(p.value)}
                            onChange={() => toggle(p.value)}
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {err('panchayat')}

                  {!!selPan.length && (
                    <div
                      className="ax-cluster"
                      style={{
                        marginTop: 'var(--ax-space-2)',
                        gap: 'var(--ax-space-2)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {selPan.map((v) => (
                        <span
                          key={v}
                          className="ax-badge ax-badge--soft ax-badge--neutral"
                        >
                          {panLabel(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bh-empty" />

                {/* REMARKS */}

                <div className="bh-span2">
                  <div className="ax-float ax-float--area">
                    <textarea
                      id="bh-remarks"
                      className="ax-textarea ax-float__input"
                      rows={3}
                      placeholder=" "
                      value={f.remarks}
                      onChange={(e) => set('remarks', e.target.value)}
                    />

                    <label className="ax-float__label" htmlFor="bh-remarks">
                      Remarks
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-card__footer bh-footer">
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--pill"
                disabled={busy}
              >
                <span className="ax-btn__label">
                  {busy ? 'Submitting…' : 'Submit'}
                </span>
              </button>

              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--pill"
                onClick={() => navigate(-1)}
              >
                <span className="ax-btn__label">Cancel</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

export default BiharAMCSSLAssignLight;