import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  dleService,
  extractList,
  filterByCompany,
  filterApproved,
  type Option,
} from '../../../../../services/dleServices';
import { upSslAmc } from '../../../../../services/Sslamcservice';

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

@media (prefers-reduced-motion:reduce){
  .ax-float__label{
    transition:none
  }
}

.up-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:var(--ax-space-6)
}
.up-span2{grid-column:span 2}
.up-footer{
  display:flex;
  justify-content:space-between;
  gap:var(--ax-space-3)
}

@media (max-width:640px){
  .up-grid{
    grid-template-columns:minmax(0,1fr);
    gap:var(--ax-space-4)
  }
  .up-span2{grid-column:auto}
  .up-grid .ax-select,
  .up-grid .ax-select option,
  .up-grid .ax-input,
  .up-grid .ax-textarea{
    font-size:12px;
    padding:2px 10px !important;
  }

  .up-footer{flex-direction:column}
  .up-footer .ax-btn{width:100%}
  .ax-float__label{
    max-width:calc(100% - var(--ax-space-6));
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap
  }
}
`;

/** Deep array extractor supporting any response shape */
const extractArray = (json: any): any[] => {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return [];

  const KEYS = [
    'districts', 'f_districts', 'district', 'f_district',
    'blocks', 'f_blocks', 'block', 'f_block',
    'panchayats', 'f_panchayats', 'panchayat', 'f_panchayat',
    'users', 'assign', 'assigns', 'volumes', 'list', 'rows',
    'records', 'items', 'data', 'result', 'results'
  ];

  const walk = (d: any, depth: number): any[] => {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== 'object' || depth > 4) return [];

    for (const k of KEYS) {
      if (d[k] !== undefined) {
        const r = walk(d[k], depth + 1);
        if (r.length || Array.isArray(d[k])) return r;
      }
    }

    for (const k of Object.keys(d)) {
      if (Array.isArray(d[k])) return d[k];
    }

    // Associative object (e.g. PHP key-value map)
    const vals = Object.values(d);
    if (vals.length && depth > 0 && vals.every((v) => typeof v === 'string' || (typeof v === 'object' && v !== null))) {
      return vals;
    }

    return [];
  };

  const res = walk(json, 0);
  if (res.length) return res;

  const topVals = Object.values(json);
  if (topVals.length && topVals.every((v) => typeof v === 'string' || (typeof v === 'object' && v !== null && !Array.isArray(v)))) {
    return topVals;
  }

  return [];
};

/** Convert user records to options */
const toUserOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  extractArray(json).forEach((u: any) => {
    if (!u) return;
    const value = String(u.id ?? u.user_id ?? u.value ?? '').trim();
    const label = String(u.name ?? u.label ?? u.user_name ?? u.full_name ?? u.email ?? value).trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push({ value, label });
  });
  return out;
};

/**
 * Convert district records to options.
 * Handles:
 * - {"f_district": "Velit non architecto"} (KUSUM-C API)
 * - {"district": "Gorakhpur"} (SSL AMC API)
 * - {"id": 1, "district": "..."}
 * - "District Name"
 */
const toDistrictOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  extractArray(json).forEach((o: any) => {
    if (o === null || o === undefined) return;
    let name = '';
    if (typeof o === 'string' || typeof o === 'number') {
      name = String(o).trim();
    } else {
      name = String(
        o.f_district ??
        o.district ??
        o.district_name ??
        o.name ??
        o.label ??
        o.value ??
        o.id ??
        ''
      ).trim();
    }
    if (!name || seen.has(name)) return;
    seen.add(name);
    out.push({ value: name, label: name });
  });
  return out;
};

/**
 * Convert block records to options.
 * Handles:
 * - {"f_block": "Rem dolore et ea vol"}
 * - {"block": "Rem dolore et ea vol"}
 * - {"id": 2, "block": "..."}
 * - "Block Name"
 */
const toBlockOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  extractArray(json).forEach((o: any) => {
    if (o === null || o === undefined) return;
    let name = '';
    if (typeof o === 'string' || typeof o === 'number') {
      name = String(o).trim();
    } else {
      name = String(
        o.f_block ??
        o.block ??
        o.block_name ??
        o.name ??
        o.label ??
        o.value ??
        o.id ??
        ''
      ).trim();
    }
    if (!name || seen.has(name)) return;
    seen.add(name);
    out.push({ value: name, label: name });
  });
  return out;
};

/**
 * Convert panchayat records to options.
 * Handles:
 * - {"f_panchayat": "Panchayat Name"}
 * - {"panchayat": "Panchayat Name"}
 * - {"id": 3, "panchayat": "..."}
 * - "Panchayat Name"
 */
const toPanchayatOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  extractArray(json).forEach((o: any) => {
    if (o === null || o === undefined) return;
    let name = '';
    if (typeof o === 'string' || typeof o === 'number') {
      name = String(o).trim();
    } else {
      name = String(
        o.f_panchayat ??
        o.panchayat ??
        o.panchayat_name ??
        o.name ??
        o.label ??
        o.value ??
        o.id ??
        ''
      ).trim();
    }
    if (!name || seen.has(name)) return;
    seen.add(name);
    out.push({ value: name, label: name });
  });
  return out;
};

/** Sirf Uttar Pradesh ke districts rakhta hai (agar API me state info ho). */
const isUpState = (v: any): boolean => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'uttar pradesh' || s === 'up' || s === 'u.p.';
};

const filterUpDistricts = (list: any[]): any[] => {
  if (!Array.isArray(list) || !list.length) return [];
  const hasStateInfo = list.some(
    (d: any) => d?.state ?? d?.state_name ?? d?.f_state
  );

  if (!hasStateInfo) return list;

  return list.filter((d: any) =>
    isUpState(d?.state ?? d?.state_name ?? d?.f_state)
  );
};

/**
 * Backend (Laravel) validation errors ko readable message me badalta hai.
 */
const buildErrorMessage = (err: any): string => {
  const bag =
    err?.errors ??
    err?.data?.errors ??
    err?.response?.data?.errors ??
    null;

  if (bag && typeof bag === 'object') {
    const lines = Object.entries(bag).map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
      return `${field}: ${text}`;
    });

    if (lines.length) return lines.join(' | ');
  }

  return err?.message || 'Something went wrong.';
};

export function UPAMCKusumCAssignPumps() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [panchayats, setPanchayats] = useState<Option[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingPanchayats, setLoadingPanchayats] = useState(false);

  const [f, setF] = useState({
    user_id: '',
    district_id: '',
    block_id: '',
    panchayat_id: '',
    pump_count: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'danger';
    msg: string;
  } | null>(null);

  const set = (k: keyof typeof f, v: string) => {
    setF((s) => ({
      ...s,
      [k]: v,
    }));
  };

  /* ─────────────────────────────────────────────
     1. Load Uttar Pradesh DLE Users
     ───────────────────────────────────────────── */
  useEffect(() => {
    const ac = new AbortController();

    dleService
      .getAdminUsers(ac.signal)
      .then((j: any) => {
        const approvedUsers = filterApproved(
          filterByCompany(extractList(j))
        );

        const upUsers = approvedUsers.filter((u: any) =>
          isUpState(u?.state)
        );

        setUsers(toUserOptions(upUsers));

        if (!upUsers.length) {
          setAlert({
            type: 'danger',
            msg: 'No approved DLE users found for your company.',
          });
        }
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load UP DLE users:', err);
          setAlert({
            type: 'danger',
            msg: err?.message || 'Unable to load DLE users.',
          });
        }
      });

    return () => ac.abort();
  }, []);

  /* ─────────────────────────────────────────────
     2. Load Districts (GET /dle/up/kusumc/amc/district)
        Handles both:
        {"data":{"districts":[{"f_district":"Velit non architecto"},{"f_district":"Gorakhpur"}]}}
        and fallback to SSL AMC district endpoint
     ───────────────────────────────────────────── */
  useEffect(() => {
    const ac = new AbortController();
    setLoadingDistricts(true);

    dleService
      .getUpKusumCAmcDistricts(ac.signal)
      .then((j: any) => {
        const list = filterUpDistricts(extractArray(j));
        const opts = toDistrictOptions(list);

        if (opts.length > 0) {
          setDistricts(opts);
        } else {
          // Fallback to UP SSL AMC districts if KUSUM-C returns empty
          upSslAmc
            .getDistricts(ac.signal)
            .then((sslJ: any) => {
              const sslList = filterUpDistricts(extractArray(sslJ));
              const sslOpts = toDistrictOptions(sslList);
              setDistricts(sslOpts);
              if (!sslOpts.length) {
                setAlert({
                  type: 'danger',
                  msg: 'No districts found.',
                });
              }
            })
            .catch(() => {
              setAlert({
                type: 'danger',
                msg: 'No districts found for KUSUM-C.',
              });
            });
        }
      })
      .catch((e: any) => {
        if (e?.name === 'AbortError') return;

        // Try fallback to SSL AMC districts
        upSslAmc
          .getDistricts(ac.signal)
          .then((sslJ: any) => {
            const sslList = filterUpDistricts(extractArray(sslJ));
            setDistricts(toDistrictOptions(sslList));
          })
          .catch(() => {
            console.error('Failed to load districts:', e);
            setAlert({
              type: 'danger',
              msg: e?.message || 'Unable to load districts.',
            });
          });
      })
      .finally(() => {
        setLoadingDistricts(false);
      });

    return () => ac.abort();
  }, []);

  /* ─────────────────────────────────────────────
     3. District Change -> Load Blocks
        Calls: /dle/up/kusumc/amc/block?district=...&district_id=...&f_district=...
        With fallback to: /user/dle/up/ssl/amc/fetch-block
     ───────────────────────────────────────────── */
  const onDistrict = (selectedDistrict: string) => {
    setF((s) => ({
      ...s,
      district_id: selectedDistrict,
      block_id: '',
      panchayat_id: '',
    }));

    setBlocks([]);
    setPanchayats([]);

    if (!selectedDistrict) return;

    setLoadingBlocks(true);

    // Call KUSUM-C block API with full query parameters
    dleService
      .getUpKusumCAmcBlocks({
        district: selectedDistrict,
        district_id: selectedDistrict,
        f_district: selectedDistrict,
      })
      .then((j) => {
        const list = extractArray(j);
        const opts = toBlockOptions(list);

        if (opts.length > 0) {
          setBlocks(opts);
        } else {
          // Fallback to SSL AMC fetch-block
          upSslAmc
            .getBlocks(selectedDistrict)
            .then((sslJ) => {
              setBlocks(toBlockOptions(sslJ));
            })
            .catch((e: any) => {
              if (e?.name !== 'AbortError') {
                console.error('Failed to load blocks:', e);
              }
            });
        }
      })
      .catch(() => {
        // Fallback to SSL AMC fetch-block
        upSslAmc
          .getBlocks(selectedDistrict)
          .then((sslJ) => {
            setBlocks(toBlockOptions(sslJ));
          })
          .catch((e: any) => {
            if (e?.name !== 'AbortError') {
              setAlert({
                type: 'danger',
                msg: e.message || 'Unable to load blocks.',
              });
            }
          });
      })
      .finally(() => {
        setLoadingBlocks(false);
      });
  };

  /* ─────────────────────────────────────────────
     4. Block Change -> Load Panchayats
        Calls: /dle/up/kusumc/amc/panchayat?block=...&block_id=...&district=...
        With fallback to: /user/dle/up/ssl/amc/fetch-panchayat
     ───────────────────────────────────────────── */
  const onBlock = (selectedBlock: string) => {
    setF((s) => ({
      ...s,
      block_id: selectedBlock,
      panchayat_id: '',
    }));

    setPanchayats([]);

    if (!selectedBlock) return;

    setLoadingPanchayats(true);

    const currentDistrict = f.district_id;

    // Call KUSUM-C panchayat API with full query parameters
    dleService
      .getUpKusumCAmcPanchayats({
        block: selectedBlock,
        block_id: selectedBlock,
        f_block: selectedBlock,
        district: currentDistrict,
        district_id: currentDistrict,
        f_district: currentDistrict,
      })
      .then((j) => {
        const list = extractArray(j);
        const opts = toPanchayatOptions(list);

        if (opts.length > 0) {
          setPanchayats(opts);
        } else {
          // Fallback to SSL AMC fetch-panchayat
          upSslAmc
            .getPanchayats(selectedBlock, currentDistrict)
            .then((sslJ) => {
              setPanchayats(toPanchayatOptions(sslJ));
            })
            .catch((e: any) => {
              if (e?.name !== 'AbortError') {
                console.error('Failed to load panchayats:', e);
              }
            });
        }
      })
      .catch(() => {
        // Fallback to SSL AMC fetch-panchayat
        upSslAmc
          .getPanchayats(selectedBlock, currentDistrict)
          .then((sslJ) => {
            setPanchayats(toPanchayatOptions(sslJ));
          })
          .catch((e: any) => {
            if (e?.name !== 'AbortError') {
              setAlert({
                type: 'danger',
                msg: e.message || 'Unable to load panchayats.',
              });
            }
          });
      })
      .finally(() => {
        setLoadingPanchayats(false);
      });
  };

  /* ─────────────────────────────────────────────
     5. Submit Form (POST /dle/up/kusumc/amc/store)
     ───────────────────────────────────────────── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const er: Record<string, string> = {};

    if (!f.user_id) {
      er.user_id = 'Select a user.';
    }

    if (!f.district_id) {
      er.district_id = 'Select a district.';
    }

    if (!f.block_id) {
      er.block_id = 'Select a block.';
    }

    if (!f.panchayat_id) {
      er.panchayat_id = 'Select a panchayat.';
    }

    if (!f.pump_count || Number(f.pump_count) < 1) {
      er.pump_count = 'Enter pump count.';
    }

    setErrors(er);

    if (Object.keys(er).length) {
      return;
    }

    setBusy(true);
    setAlert(null);

    try {
      const pumpCount = Number(f.pump_count);

      const payload = {
        users: Number(f.user_id),
        user_id: Number(f.user_id),
        assign_user_id: Number(f.user_id),

        district_id: f.district_id,
        district: f.district_id,
        f_district: f.district_id,

        block_id: f.block_id,
        block: f.block_id,
        f_block: f.block_id,

        panchayat_id: f.panchayat_id,
        panchayat: f.panchayat_id,
        f_panchayat: f.panchayat_id,
        panchayats: [f.panchayat_id],
        selected_panchayats: [f.panchayat_id],

        // Support both pump and site count field names
        sitecount: pumpCount,
        site_count: pumpCount,
        pump_count: pumpCount,
        pumps: pumpCount,
        light_count: pumpCount,
        lights: pumpCount,
        count: pumpCount,
        total_pumps: pumpCount,
        quantity: pumpCount,

        remarks: f.remarks,
        remark: f.remarks,
      };

      const res = await dleService.storeUpKusumCAmc(payload);

      setAlert({
        type: 'success',
        msg: res?.message || 'Assigned successfully.',
      });

      setF({
        user_id: '',
        district_id: '',
        block_id: '',
        panchayat_id: '',
        pump_count: '',
        remarks: '',
      });

      setBlocks([]);
      setPanchayats([]);
      setErrors({});
    } catch (err: any) {
      console.error('Assign KUSUM-C pump failed:', err);

      setAlert({
        type: 'danger',
        msg: buildErrorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const cls = (k: string) =>
    `ax-input ax-float__input${errors[k] ? ' is-invalid' : ''}`;

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

  return (
    <>
      <style>{FLOAT_CSS}</style>

      <PageHead
        title="Assign UP KUSUM-C AMC Pumps"
        subtitle="Assign KUSUM-C solar pumps/sites to a DLE user by district, block and panchayat."
      />

      <div className="ax-dash-grid">
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
          aria-label="Assign UP KUSUM-C AMC pumps"
        >
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Uttar Pradesh · KUSUM-C</span>

              <p className="ax-card__subtitle">
                All fields except remarks are required.
              </p>
            </div>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="ax-card__body">
              <div className="up-grid">
                {/* DLE USER */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="up-kc-user"
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

                    <label className="ax-float__label" htmlFor="up-kc-user">
                      DLE user *
                    </label>
                  </div>

                  {err('user_id')}
                </div>

                {/* DISTRICT */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="up-kc-district"
                      className={scls('district_id')}
                      value={f.district_id}
                      onChange={(e) => onDistrict(e.target.value)}
                      disabled={loadingDistricts}
                    >
                      <option value="">
                        {loadingDistricts ? 'Loading districts…' : 'Select District'}
                      </option>
                      {districts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="up-kc-district">
                      District *
                    </label>
                  </div>

                  {err('district_id')}
                </div>

                {/* BLOCK */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="up-kc-block"
                      className={scls('block_id')}
                      value={f.block_id}
                      onChange={(e) => onBlock(e.target.value)}
                      disabled={!f.district_id || loadingBlocks}
                    >
                      <option value="">
                        {loadingBlocks ? 'Loading blocks…' : 'Select Block'}
                      </option>
                      {blocks.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="up-kc-block">
                      Block *
                    </label>
                  </div>

                  {err('block_id')}
                </div>

                {/* PANCHAYAT */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="up-kc-pan"
                      className={scls('panchayat_id')}
                      value={f.panchayat_id}
                      onChange={(e) => set('panchayat_id', e.target.value)}
                      disabled={!f.block_id || loadingPanchayats}
                    >
                      <option value="">
                        {loadingPanchayats ? 'Loading panchayats…' : 'Select Panchayat'}
                      </option>
                      {panchayats.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label className="ax-float__label" htmlFor="up-kc-pan">
                      Panchayat *
                    </label>
                  </div>

                  {err('panchayat_id')}
                </div>

                {/* PUMP / SITE COUNT */}
                <div>
                  <div className="ax-float">
                    <input
                      id="up-kc-count"
                      type="number"
                      min="1"
                      className={cls('pump_count')}
                      placeholder=" "
                      value={f.pump_count}
                      onChange={(e) => set('pump_count', e.target.value)}
                    />

                    <label className="ax-float__label" htmlFor="up-kc-count">
                      Pump count *
                    </label>
                  </div>

                  {err('pump_count')}
                </div>

                {/* REMARKS */}
                <div className="up-span2">
                  <div className="ax-float ax-float--area">
                    <textarea
                      id="up-kc-remarks"
                      className="ax-textarea ax-float__input"
                      rows={3}
                      placeholder=" "
                      value={f.remarks}
                      onChange={(e) => set('remarks', e.target.value)}
                    />

                    <label className="ax-float__label" htmlFor="up-kc-remarks">
                      Remarks
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-card__footer up-footer">
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

export default UPAMCKusumCAssignPumps;
