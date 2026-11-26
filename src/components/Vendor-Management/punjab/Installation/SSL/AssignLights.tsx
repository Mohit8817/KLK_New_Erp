import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabAdminService,
  type VendorItem,
  type VolumeItem,
  type DistrictItem,
  type BlockItem,
  type PanchayatItem,
} from '../../punjab-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Goa implementation)
const SINGLE_CARD_FORM_CSS = `
.ssl-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
  overflow: hidden;
}
.ssl-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.ssl-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.ssl-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.ssl-section-pill-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.ssl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
}
.ssl-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.ssl-section-block { padding-top: var(--ax-space-2, 8px); }
.ssl-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.ssl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ssl-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Site / Panchayat Selection List & Cards */
.ssl-site-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
}
.ssl-site-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.ssl-site-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
.ssl-site-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #3b82f6;
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) ease,
              box-shadow var(--ax-motion-fast, 0.15s) ease;
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top var(--ax-motion-fast, 0.15s) ease,
              font-size var(--ax-motion-fast, 0.15s) ease,
              color var(--ax-motion-fast, 0.15s) ease;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Defensive Helpers: Zero [object Object] Guarantees ───────── */
function cleanStr(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t || t === '[object Object]' || t.includes('[object Object]')) return '';
    return t;
  }
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    for (const item of val) {
      const s = cleanStr(item);
      if (s) return s;
    }
    return '';
  }
  if (typeof val === 'object') {
    return (
      cleanStr(val.district) ||
      cleanStr(val.district_name) ||
      cleanStr(val.block) ||
      cleanStr(val.block_name) ||
      cleanStr(val.panchayat) ||
      cleanStr(val.panchayat_name) ||
      cleanStr(val.name) ||
      cleanStr(val.label) ||
      cleanStr(val.title) ||
      cleanStr(val.value) ||
      ''
    );
  }
  return '';
}

function extractVendorId(raw: any, vendors: VendorItem[]): string {
  if (!raw) return '';
  if (typeof raw === 'string' || typeof raw === 'number') {
    const str = String(raw).trim();
    if (str && str !== '[object Object]') return str;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const vid = raw.id ?? raw.vendor_id ?? raw.inst_vendor ?? raw.vendor ?? raw.value;
    if (vid !== undefined && vid !== null) {
      const str = String(vid).trim();
      if (str && str !== '[object Object]') return str;
    }
    if (raw.name) {
      const matched = vendors.find((v) => v.name.toLowerCase() === String(raw.name).trim().toLowerCase());
      if (matched) return String(matched.id);
    }
  }
  return '';
}

function parsePanchayatValues(raw: any): string[] {
  if (!raw) return [];
  const result: string[] = [];
  const seen = new Set<string>();

  const addItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      const t = item.trim();
      if (!t || t === '[object Object]') return;
      if (t.startsWith('[') && t.endsWith(']')) {
        try {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) {
            parsed.forEach(addItem);
            return;
          }
        } catch {
          // split fallback below
        }
      }
      if (t.includes(',')) {
        t.split(',').forEach((p) => {
          const clean = p.trim().replace(/^[\["'\s]+|[\]"'\s]+$/g, '');
          if (clean && clean !== '[object Object]' && !clean.includes('[object Object]') && !seen.has(clean.toLowerCase())) {
            seen.add(clean.toLowerCase());
            result.push(clean);
          }
        });
        return;
      }
      const clean = t.replace(/^[\["'\s]+|[\]"'\s]+$/g, '');
      if (clean && clean !== '[object Object]' && !clean.includes('[object Object]') && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        result.push(clean);
      }
      return;
    }
    if (typeof item === 'number') {
      const s = String(item);
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        result.push(s);
      }
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(addItem);
      return;
    }
    if (typeof item === 'object') {
      const name = cleanStr(item.panchayat || item.panchayat_name || item.name || item.label || item.title);
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        result.push(name);
      }
    }
  };

  addItem(raw);
  return result;
}

export function AssignLights() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Master datasets
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [volumes, setVolumes] = useState<VolumeItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [panchayats, setPanchayats] = useState<PanchayatItem[]>([]);

  // Form values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [isCustomBlock, setIsCustomBlock] = useState<boolean>(false);
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>([]);
  const [selectedPanchayatDropdown, setSelectedPanchayatDropdown] = useState<string>('');
  const [customPanchayatInput, setCustomPanchayatInput] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Status & Ref
  const [recordStatus, setRecordStatus] = useState<number | null>(null);
  const isAcceptedLocked = isEditMode && recordStatus === 2;
  const initialLoadedRef = useRef<{ volume?: string; district?: string; block?: string }>({});
  const isInitialEditLoadRef = useRef<boolean>(false);

  // Loading Status
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [districtsLoading, setDistrictsLoading] = useState<boolean>(false);
  const [blocksLoading, setBlocksLoading] = useState<boolean>(false);
  const [panchayatsLoading, setPanchayatsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [panchayatFilterQuery, setPanchayatFilterQuery] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Vendors & Volumes or Existing Assignment (Matching Goa edit assign architecture)
  useEffect(() => {
    let active = true;
    const loadInit = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const formDataPromise = punjabAdminService.getAssignFormData().catch(() => ({ vendors: [], volumes: [] }));

        if (isEditMode && editId) {
          const [editRes, formDataRes, viewAssignRes] = await Promise.allSettled([
            punjabAdminService.getEditAssign(editId),
            formDataPromise,
            punjabAdminService.getViewAssign().catch(() => null),
          ]);
          if (!active) return;

          const editData = editRes.status === 'fulfilled' ? editRes.value || {} : {};
          const formData = formDataRes.status === 'fulfilled' ? formDataRes.value || { vendors: [], volumes: [] } : { vendors: [], volumes: [] };
          const viewAssignList =
            viewAssignRes.status === 'fulfilled' && viewAssignRes.value?.assignedlight
              ? viewAssignRes.value.assignedlight
              : [];

          // Find the record from view-assign list as a guaranteed baseline
          const recordFromView = viewAssignList.find(
            (r: any) => String(r.id) === String(editId)
          );

          // Find record from editData if it has an assigned record property (do NOT treat editData root as assignObj)
          const recordFromEdit =
            editData.assignSsl ||
            editData.assign_ssl ||
            editData.assignShl ||
            editData.assign_shl ||
            editData.assignLight ||
            editData.assign_light ||
            editData.assignedlight ||
            editData.assigned_light ||
            editData.assignedLight ||
            editData.assign ||
            editData.assigned ||
            editData.punjabssl ||
            editData.punjab_ssl ||
            editData.ssl ||
            editData.row ||
            editData.record ||
            editData.details ||
            editData.data?.assignSsl ||
            editData.data?.assign_ssl ||
            editData.data?.assignedlight ||
            editData.data?.assign ||
            (editData.data && typeof editData.data === 'object' && !Array.isArray(editData.data) && (editData.data.id || (typeof editData.data.district === 'string' && editData.data.district !== '[object Object]')) ? editData.data : null);

          // Combine record: prefer recordFromEdit, fall back to recordFromView
          const assignObj = { ...(recordFromView || {}), ...(recordFromEdit || {}) };

          const rawVendors = editData.vendor || editData.vendors || (formData as any).vendors || [];
          const rawVolumes = editData.volumes || editData.volume || (formData as any).volumes || [];
          const rawDistricts = editData.districts || editData.district || [];
          const rawBlocks = editData.blocks || editData.block || [];
          const rawPanchayats = editData.panchayats || editData.panchayat || [];

          // Merge Master Vendors with any record-specific vendors
          const combinedVendors: VendorItem[] = [...(formData.vendors || [])];
          const vendorIds = new Set(combinedVendors.map((v) => String(v.id)));
          if (Array.isArray(rawVendors)) {
            rawVendors.forEach((v: any) => {
              const vid = String(v?.id ?? v?.vendor ?? v?.inst_vendor ?? '');
              const vname = cleanStr(v?.name || v?.vendor_name || v);
              if (vid && vid !== '[object Object]' && !vendorIds.has(vid)) {
                vendorIds.add(vid);
                combinedVendors.push({ id: Number(vid) || (vid as any), name: vname || `Vendor #${vid}` });
              }
            });
          }

          // Merge Master Volumes with any record-specific volumes
          const combinedVolumes: VolumeItem[] = [...(formData.volumes || [])];
          const volSet = new Set(combinedVolumes.map((v) => String(v.volume).trim()));
          if (Array.isArray(rawVolumes)) {
            rawVolumes.forEach((v: any) => {
              const volVal = cleanStr(typeof v === 'object' ? (v?.volume || v?.name || '') : v);
              if (volVal && !volSet.has(volVal)) {
                volSet.add(volVal);
                combinedVolumes.push({ volume: volVal });
              }
            });
          }

          const vol = cleanStr(assignObj.volume) || cleanStr(recordFromView?.volume) || '2';
          const rawDist = assignObj.district ?? recordFromView?.district;
          const rawBlk = assignObj.block ?? recordFromView?.block;
          const dist = typeof rawDist === 'string'
            ? cleanStr(rawDist)
            : (!Array.isArray(rawDist) && rawDist && typeof rawDist === 'object'
                ? cleanStr(rawDist.district || rawDist.district_name || rawDist.name)
                : cleanStr(recordFromView?.district));
          const blk = typeof rawBlk === 'string'
            ? cleanStr(rawBlk)
            : (!Array.isArray(rawBlk) && rawBlk && typeof rawBlk === 'object'
                ? cleanStr(rawBlk.block || rawBlk.block_name || rawBlk.name)
                : cleanStr(recordFromView?.block));

          if (vol && !volSet.has(vol)) {
            combinedVolumes.push({ volume: vol });
          }

          const vendorVal = extractVendorId(
            assignObj.vendor ?? assignObj.vendor_id ?? assignObj.inst_vendor ?? assignObj.vendors,
            combinedVendors
          );
          if (vendorVal && !vendorIds.has(vendorVal)) {
            const vname = cleanStr(assignObj.vendor_name || assignObj.vendors?.name);
            combinedVendors.push({
              id: Number(vendorVal) || (vendorVal as any),
              name: vname || `Vendor #${vendorVal}`,
            });
          }

          initialLoadedRef.current = { volume: vol, district: dist, block: blk };
          isInitialEditLoadRef.current = true;

          setSelectedVendor(vendorVal);
          setSelectedVolume(vol);
          setSelectedDistrict(dist);
          setSelectedBlock(blk);
          setDeadlineDate(
            cleanStr(assignObj.ldate || assignObj.deadline_date || assignObj.date).split(' ')[0] || ''
          );
          setRemarks(cleanStr(assignObj.remark || assignObj.remarks));



          const parsedPanchayats = parsePanchayatValues(assignObj.panchayat || assignObj.panchayats || assignObj.panchayat_list);
          setSelectedPanchayats(parsedPanchayats);

          // Districts: start with rawDistricts or fetch live districts for the volume
          let dArr: DistrictItem[] = [];
          const seenDistricts = new Set<string>();
          const addDist = (d: any) => {
            const name = cleanStr(typeof d === 'string' ? d : (d?.district || d?.district_name || d?.name || ''));
            if (name && !seenDistricts.has(name.toLowerCase())) {
              seenDistricts.add(name.toLowerCase());
              dArr.push({ district: name });
            }
          };

          (Array.isArray(rawDistricts) ? rawDistricts : []).forEach(addDist);
          if (vol) {
            try {
              const fetchedDistricts = await punjabAdminService.fetchDistricts(vol);
              if (fetchedDistricts && fetchedDistricts.length > 0) {
                fetchedDistricts.forEach(addDist);
              }
            } catch (e) {
              console.warn('[PunjabAssignLights] Could not fetch districts in edit init:', e);
            }
          }
          if (dist && !seenDistricts.has(dist.toLowerCase())) {
            seenDistricts.add(dist.toLowerCase());
            dArr.unshift({ district: dist });
          }

          // Blocks: start with rawBlocks or fetch live blocks for district
          let bArr: BlockItem[] = [];
          const seenBlocks = new Set<string>();
          const addBlk = (b: any) => {
            const name = cleanStr(typeof b === 'string' ? b : (b?.block || b?.block_name || b?.name || ''));
            if (name && !seenBlocks.has(name.toLowerCase())) {
              seenBlocks.add(name.toLowerCase());
              bArr.push({ block: name });
            }
          };

          (Array.isArray(rawBlocks) ? rawBlocks : []).forEach(addBlk);
          if (vol && dist) {
            try {
              const fetchedBlocks = await punjabAdminService.fetchBlocks(vol, dist);
              if (fetchedBlocks && fetchedBlocks.length > 0) {
                fetchedBlocks.forEach(addBlk);
              }
            } catch (e) {
              console.warn('[PunjabAssignLights] Could not fetch blocks in edit init:', e);
            }
          }
          if (blk && !seenBlocks.has(blk.toLowerCase())) {
            seenBlocks.add(blk.toLowerCase());
            bArr.unshift({ block: blk });
          }

          // Panchayats: start with rawPanchayats or fetch live panchayats for block
          let pArr: PanchayatItem[] = [];
          const seenPanchayats = new Set<string>();
          const addPch = (p: any) => {
            const name = cleanStr(typeof p === 'string' ? p : (p?.panchayat || p?.panchayat_name || p?.name || ''));
            const count = typeof p === 'object' && p !== null ? (Number(p.light_count ?? p.count) || 1) : 1;
            if (name && !seenPanchayats.has(name.toLowerCase())) {
              seenPanchayats.add(name.toLowerCase());
              pArr.push({ panchayat: name, light_count: count });
            }
          };

          (Array.isArray(rawPanchayats) ? rawPanchayats : []).forEach(addPch);
          if (vol && dist && blk) {
            try {
              const fetchedPanchayats = await punjabAdminService.fetchPanchayats(vol, dist, blk);
              if (fetchedPanchayats && fetchedPanchayats.length > 0) {
                fetchedPanchayats.forEach(addPch);
              }
            } catch (e) {
              console.warn('[PunjabAssignLights] Could not fetch panchayats in edit init:', e);
            }
          }
          // Reconcile and ensure all assigned panchayats exist in list
          parsedPanchayats.forEach((name) => {
            if (!seenPanchayats.has(name.toLowerCase())) {
              seenPanchayats.add(name.toLowerCase());
              pArr.push({ panchayat: name, light_count: 1 });
            }
          });

          setVendors(combinedVendors);
          setVolumes(combinedVolumes);
          setDistricts(dArr);
          setBlocks(bArr);
          setPanchayats(pArr);

          const st = Number((assignObj as any).status);
          setRecordStatus(isNaN(st) ? null : st);
        } else {
          const formData = await formDataPromise;
          if (!active) return;
          setVendors(formData.vendors || []);
          setVolumes(formData.volumes || []);
          const firstVol = formData.volumes?.[0]?.volume || '';
          if (firstVol) {
            setSelectedVolume(firstVol);
            const dList = await punjabAdminService.fetchDistricts(firstVol);
            if (active && dList) {
              setDistricts(dList.map((d: any) => ({ district: cleanStr(typeof d === 'string' ? d : d.district) })).filter((d) => Boolean(d.district)));
            }
          }
        }
      } catch (err: any) {
        if (!active) return;
        console.error('[PunjabAssignLights] Initial load error:', err);
        setErrorMsg(err?.message || (isEditMode ? 'Failed to fetch assignment details.' : 'Failed to fetch vendors and volumes.'));
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadInit();
    return () => {
      active = false;
    };
  }, [editId, isEditMode]);

  // 2. Volume Change -> Fetch Districts
  useEffect(() => {
    if (!selectedVolume) {
      setDistricts([]);
      setSelectedDistrict('');
      setBlocks([]);
      setSelectedBlock('');
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    // In edit mode on initial load, do not wipe what loadInit populated
    if (isEditMode && isInitialEditLoadRef.current && selectedVolume === initialLoadedRef.current.volume) {
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setErrorMsg('');
      try {
        const dList = await punjabAdminService.fetchDistricts(selectedVolume);
        if (!active) return;
        const sanitized = dList
          .map((d: any) => ({ district: cleanStr(typeof d === 'string' ? d : d.district) }))
          .filter((d) => Boolean(d.district));
        setDistricts(sanitized);
        setSelectedDistrict('');
        setBlocks([]);
        setSelectedBlock('');
        setPanchayats([]);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[PunjabAssignLights] Districts fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch districts.');
      } finally {
        if (active) setDistrictsLoading(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [selectedVolume, isEditMode]);

  // 3. District Change -> Fetch Blocks
  useEffect(() => {
    if (!selectedDistrict || !selectedVolume) {
      setBlocks([]);
      setSelectedBlock('');
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    // In edit mode on initial load, do not wipe what loadInit populated
    if (
      isEditMode &&
      isInitialEditLoadRef.current &&
      selectedDistrict === initialLoadedRef.current.district &&
      selectedVolume === initialLoadedRef.current.volume
    ) {
      return;
    }

    let active = true;
    const loadBlocks = async () => {
      setBlocksLoading(true);
      setErrorMsg('');
      try {
        const bList = await punjabAdminService.fetchBlocks(selectedVolume, selectedDistrict);
        if (!active) return;
        const sanitized = bList
          .map((b: any) => ({ block: cleanStr(typeof b === 'string' ? b : b.block) }))
          .filter((b) => Boolean(b.block));
        setBlocks(sanitized);
        setSelectedBlock('');
        setPanchayats([]);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[PunjabAssignLights] Blocks fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch blocks.');
      } finally {
        if (active) setBlocksLoading(false);
      }
    };
    loadBlocks();
    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedVolume, isEditMode]);

  // 4. Block Change -> Fetch Panchayats
  useEffect(() => {
    if (!selectedBlock || !selectedDistrict || !selectedVolume) {
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    // In edit mode on initial load, do not wipe what loadInit populated
    if (
      isEditMode &&
      isInitialEditLoadRef.current &&
      selectedBlock === initialLoadedRef.current.block &&
      selectedDistrict === initialLoadedRef.current.district &&
      selectedVolume === initialLoadedRef.current.volume
    ) {
      return;
    }

    let active = true;
    const loadPanchayats = async () => {
      setPanchayatsLoading(true);
      setErrorMsg('');
      try {
        const pList = await punjabAdminService.fetchPanchayats(selectedVolume, selectedDistrict, selectedBlock);
        if (!active) return;
        const sanitized = pList
          .map((p: any) => ({
            panchayat: cleanStr(typeof p === 'string' ? p : p.panchayat),
            light_count: typeof p === 'object' && p !== null ? (Number(p.light_count ?? p.count) || 1) : 1,
          }))
          .filter((p) => Boolean(p.panchayat));
        setPanchayats(sanitized);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[PunjabAssignLights] Panchayats fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch panchayats.');
      } finally {
        if (active) setPanchayatsLoading(false);
      }
    };
    loadPanchayats();
    return () => {
      active = false;
    };
  }, [selectedBlock, selectedDistrict, selectedVolume, isEditMode]);

  const handleTogglePanchayat = (name: string) => {
    if (submitting || isAcceptedLocked) return;
    const clean = cleanStr(name);
    if (!clean) return;
    setSelectedPanchayats((prev) =>
      prev.includes(clean) ? prev.filter((p) => p !== clean) : [...prev, clean]
    );
  };

  const handleSelectAll = () => {
    if (submitting || isAcceptedLocked) return;
    if (selectedPanchayats.length === filteredPanchayats.length && filteredPanchayats.length > 0) {
      setSelectedPanchayats([]);
    } else {
      setSelectedPanchayats(filteredPanchayats.map((p) => cleanStr(p.panchayat)).filter(Boolean));
    }
  };

  const filteredPanchayats = useMemo(() => {
    const q = panchayatFilterQuery.trim().toLowerCase();
    const valid = panchayats.filter((p) => {
      const name = cleanStr(p.panchayat);
      return Boolean(name && name !== '[object Object]');
    });
    if (!q) return valid;
    return valid.filter((p) => cleanStr(p.panchayat).toLowerCase().includes(q));
  }, [panchayats, panchayatFilterQuery]);

  const selectedLightsTally = useMemo(() => {
    return panchayats
      .filter((p) => selectedPanchayats.includes(cleanStr(p.panchayat)))
      .reduce((sum, p) => sum + (Number(p.light_count ?? (p as any).count) || 1), 0);
  }, [panchayats, selectedPanchayats]);

  const handleAddCustomPanchayat = (name: string) => {
    if (submitting || isAcceptedLocked) return;
    const trimmed = cleanStr(name);
    if (!trimmed) return;
    if (!panchayats.some((p) => cleanStr(p.panchayat).toLowerCase() === trimmed.toLowerCase())) {
      setPanchayats((prev) => [...prev, { panchayat: trimmed, light_count: 1 }]);
    }
    if (!selectedPanchayats.includes(trimmed)) {
      setSelectedPanchayats((prev) => [...prev, trimmed]);
    }
    setCustomPanchayatInput('');
  };

  // Submit Handler: Supports both storeAssign and updateAssign (matching Goa)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedVendor) return setErrorMsg('Vendor Name is required.');
    if (!selectedVolume) return setErrorMsg('Volume is required.');
    if (!selectedDistrict) return setErrorMsg('District is required.');
    if (!selectedBlock) return setErrorMsg('Block is required.');
    if (selectedPanchayats.length === 0) return setErrorMsg('Please select at least one panchayat to assign.');
    if (!deadlineDate) return setErrorMsg('Deadline Date is required.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (isEditMode && editId) {
        formData.append('id', String(editId));
        formData.append('assign_id', String(editId));
        formData.append('update_id', String(editId));
      }

      formData.append('vendor', selectedVendor);
      formData.append('vendor_id', selectedVendor);
      formData.append('inst_vendor', selectedVendor);
      const matchedVendor = vendors.find((v) => String(v.id) === String(selectedVendor));
      if (matchedVendor?.name) {
        formData.append('vendor_name', matchedVendor.name);
      }

      formData.append('state', 'punjab');
      formData.append('state_name', 'Punjab');
      formData.append('volume', selectedVolume);
      formData.append('volume_id', selectedVolume);
      formData.append('district', cleanStr(selectedDistrict));
      formData.append('district_name', cleanStr(selectedDistrict));
      formData.append('block', cleanStr(selectedBlock));
      formData.append('block_name', cleanStr(selectedBlock));

      // Support array format for PHP/Laravel: 'panchayat[]' creates a native array $_POST['panchayat']
      const cleanPanchayats = selectedPanchayats.map(cleanStr).filter(Boolean);
      cleanPanchayats.forEach((panchayatName) => {
        formData.append('panchayat[]', panchayatName);
      });
      formData.append('panchayat_list', cleanPanchayats.join(','));
      formData.append('sitecount', String(selectedLightsTally));
      formData.append('light_count', String(selectedLightsTally));

      formData.append('ldate', deadlineDate);
      formData.append('deadline_date', deadlineDate);
      formData.append('date', deadlineDate);

      if (remarks.trim()) {
        formData.append('remark', remarks.trim());
        formData.append('remarks', remarks.trim());
      }

      let res: any;
      if (isEditMode && editId) {
        res = await punjabAdminService.updateAssign(editId, formData);
        setSuccessMsg(res?.message || `${cleanPanchayats.length} Punjab SSL Lights assignment successfully updated!`);
      } else {
        res = await punjabAdminService.storeAssign(formData);
        setSuccessMsg(res?.message || `${cleanPanchayats.length} Punjab SSL Lights assigned successfully!`);
      }

      setTimeout(() => {
        navigate('/vendor-management/punjab/ssl/view-assign');
      }, 1500);
    } catch (err: any) {
      console.error('[PunjabAssignLights] Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign lights.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page ssl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? `Edit Punjab SSL Assigned Lights #${editId}` : 'Assign Punjab SSL Installation Data'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : 'Allocate street light installations across districts, blocks, and gram panchayats'
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Punjab SSL', href: '/vendor-management/punjab/ssl/dashboard' },
          { label: isEditMode ? 'Edit Assignment' : 'Assign Lights' },
        ]}
        actions={
          <Link
            to="/vendor-management/punjab/ssl/view-assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 6 }}
            >
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            View Assigned Lights
          </Link>
        }
      />

      {/* Accepted Locked Warning Banner */}
      {isAcceptedLocked && (
        <div
          style={{
            padding: '14px 18px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#1e40af',
            fontSize: 13,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, color: '#2563eb' }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', marginBottom: 2 }}>
              Assignment Locked (Status: Accepted)
            </div>
            <div>
              This work order has already been accepted by the vendor (Status 2: Accepted). All fields are permanently locked for editing.
            </div>
          </div>
        </div>
      )}

      {/* Status Banners */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Lights #${editId}` : 'Punjab SSL Installation Assignment Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: isAcceptedLocked ? '#2563eb' : '#ef4444', margin: '4px 0 0' }}>
                {isAcceptedLocked
                  ? 'Locked: Vendor has accepted this assignment.'
                  : 'The field labels marked with * are required input fields.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isEditMode && recordStatus !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: recordStatus === 2 ? '#eff6ff' : recordStatus === 1 ? '#ecfdf5' : '#fffbeb',
                    color: recordStatus === 2 ? '#1d4ed8' : recordStatus === 1 ? '#047857' : '#b45309',
                    border: `1px solid ${recordStatus === 2 ? '#bfdbfe' : recordStatus === 1 ? '#a7f3d0' : '#fde68a'}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: recordStatus === 2 ? '#2563eb' : recordStatus === 1 ? '#10b981' : '#f59e0b',
                    }}
                  />
                  Status: {recordStatus === 2 ? 'Accepted' : recordStatus === 1 ? 'Approved' : 'Pending'}
                </span>
              )}
              {selectedPanchayats.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedPanchayats.length} Panchayat(s) &bull; {selectedLightsTally} Lights Selected
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="ssl-section-pills">
            <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Volume
            </button>
            <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Panchayat Allocation {selectedPanchayats.length > 0 ? `(${selectedPanchayats.length})` : ''}
            </button>
            <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name & Volume */}
          <div ref={sec1} className="ssl-section-block">
            <div className="ssl-section-header">
              <div className="ssl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    1. Vendor & Volume Allocation <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      Editable
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select or update authorized partner vendor and project volume
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {cleanStr(v.name)}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* State (Read only Punjab) */}
              <div className="ax-float">
                <input
                  type="text"
                  id="state_input"
                  className="ax-float__input"
                  value="Punjab"
                  readOnly
                  disabled
                />
                <label htmlFor="state_input" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={selectedVolume}
                  onChange={(e) => {
                    isInitialEditLoadRef.current = false;
                    setSelectedVolume(e.target.value);
                  }}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumes.map((vol, idx) => (
                    <option key={idx} value={vol.volume}>
                      {cleanStr(vol.volume)}
                    </option>
                  ))}
                </select>
                <label htmlFor="volume_select" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="ssl-section-divider" />

          {/* Section 2: District & Block */}
          <div ref={sec2} className="ssl-section-block">
            <div className="ssl-section-header">
              <div className="ssl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    2. District & Block <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      Editable
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select or update target district and block within Punjab
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={selectedDistrict}
                  onChange={(e) => {
                    isInitialEditLoadRef.current = false;
                    setSelectedDistrict(e.target.value);
                  }}
                  disabled={!selectedVolume || districtsLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {districtsLoading
                      ? 'Loading Districts...'
                      : !selectedVolume
                      ? '-- Select Volume First --'
                      : '-- Select District --'}
                  </option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={cleanStr(d.district)}>
                      {cleanStr(d.district)}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Block * */}
              <div className="ax-float">
                {isCustomBlock ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        id="block_select"
                        className="ax-float__input"
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        placeholder="Type Block Name"
                        disabled={!selectedDistrict || submitting || isAcceptedLocked}
                        required
                      />
                      <label htmlFor="block_select" className="ax-float__label floating">
                        Block Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                    </div>
                    {blocks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomBlock(false);
                          setSelectedBlock('');
                        }}
                        disabled={isAcceptedLocked}
                        className="ax-btn ax-btn--secondary ax-btn--sm"
                        style={{ fontSize: 11, whiteSpace: 'nowrap', height: 40 }}
                      >
                        List
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select
                      id="block_select"
                      className="ax-float__input"
                      value={selectedBlock}
                      onChange={(e) => {
                        isInitialEditLoadRef.current = false;
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomBlock(true);
                          setSelectedBlock('');
                        } else {
                          setSelectedBlock(e.target.value);
                        }
                      }}
                      disabled={!selectedDistrict || blocksLoading || submitting || isAcceptedLocked}
                      required
                    >
                      <option value="">
                        {blocksLoading
                          ? 'Loading Blocks...'
                          : !selectedDistrict
                          ? '-- Select District First --'
                          : blocks.length === 0
                          ? 'No Blocks Found for Selected District'
                          : '-- Select Block --'}
                      </option>
                      {blocks.map((b, idx) => (
                        <option key={idx} value={cleanStr(b.block)}>
                          {cleanStr(b.block)}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Enter Block Manually</option>
                    </select>
                    <label htmlFor="block_select" className="ax-float__label floating">
                      Block <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="ssl-section-divider" />

          {/* Section 3: Panchayat Allocation * */}
          <div ref={sec3} className="ssl-section-block">
            <div className="ssl-section-header">
              <div className="ssl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                    3. Panchayat Allocation <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      Editable
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {selectedBlock
                    ? `Select one or more eligible panchayats in ${cleanStr(selectedBlock)} for solar street light installation.`
                    : 'Please select district and block above first to load available panchayats.'}
                </span>
              </div>
              {selectedBlock && panchayats.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 600 }}>
                    {selectedPanchayats.length} of {panchayats.length} selected
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={handleSelectAll}
                    disabled={submitting || isAcceptedLocked}
                  >
                    {selectedPanchayats.length === filteredPanchayats.length && filteredPanchayats.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Selected Panchayats Active Badges / Tags (Easy visual inspection and one-click removal) */}
            {selectedPanchayats.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--ax-border, #e2e8f0)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)' }}>
                    Selected Panchayats ({selectedPanchayats.length} Allocated &bull; {selectedLightsTally} Lights)
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPanchayats([])}
                    disabled={submitting || isAcceptedLocked}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isAcceptedLocked ? '#94a3b8' : '#ef4444',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: isAcceptedLocked ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear All Selected
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPanchayats.map((name) => (
                    <span
                      key={name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 9999,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span>{cleanStr(name)}</span>
                      {!isAcceptedLocked && (
                        <button
                          type="button"
                          onClick={() => handleTogglePanchayat(name)}
                          disabled={submitting || isAcceptedLocked}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14,
                            lineHeight: 1,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title={`Remove ${cleanStr(name)}`}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* State A: No block selected */}
            {!selectedBlock ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                -- Select District & Block to Load Panchayats --
              </div>
            ) : panchayatsLoading ? (
              /* State B: Loading */
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  color: '#2563eb',
                  fontSize: 13,
                }}
              >
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching panchayats for block &ldquo;<b>{cleanStr(selectedBlock)}</b>&rdquo;...
              </div>
            ) : panchayats.length === 0 ? (
              /* State C: Empty list with custom adder */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  No pre-registered panchayats returned from server for block &ldquo;<b>{cleanStr(selectedBlock)}</b>&rdquo;. You can add panchayat names directly below.
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customPanchayatInput}
                    onChange={(e) => setCustomPanchayatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomPanchayat(customPanchayatInput);
                      }
                    }}
                    placeholder="Type custom / extra panchayat name..."
                    className="ax-input ax-input--sm"
                    style={{ flex: 1, height: 38, borderRadius: 6, fontSize: 13 }}
                    disabled={submitting || isAcceptedLocked}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomPanchayat(customPanchayatInput)}
                    disabled={!customPanchayatInput.trim() || submitting || isAcceptedLocked}
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{ height: 38, padding: '0 14px', whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    + Add Panchayat
                  </button>
                </div>
              </div>
            ) : (
              /* State D: Panchayats loaded with Search, Dropdown, Add, and Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Quick Select & Search Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {/* Quick Dropdown */}
                  <div>
                    <select
                      id="quick_panchayat_dropdown"
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                      value={selectedPanchayatDropdown}
                      onChange={(e) => {
                        const val = cleanStr(e.target.value);
                        setSelectedPanchayatDropdown(val);
                        if (val && !selectedPanchayats.includes(val)) {
                          setSelectedPanchayats((prev) => [...prev, val]);
                        }
                      }}
                      disabled={submitting || isAcceptedLocked}
                    >
                      <option value="">-- Quick Select Panchayat from List ({filteredPanchayats.length}) --</option>
                      {filteredPanchayats.map((p, idx) => {
                        const pName = cleanStr(p.panchayat);
                        const isChecked = selectedPanchayats.includes(pName);
                        return (
                          <option key={idx} value={pName}>
                            {isChecked ? '✓ ' : ''}{pName}{p.light_count !== undefined ? ` (${p.light_count} lights available)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div>
                    <input
                      type="text"
                      value={panchayatFilterQuery}
                      onChange={(e) => setPanchayatFilterQuery(e.target.value)}
                      placeholder="Search panchayat by name..."
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                      disabled={submitting || isAcceptedLocked}
                    />
                  </div>
                </div>

                {/* Custom Extra Panchayat Adder */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customPanchayatInput}
                    onChange={(e) => setCustomPanchayatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomPanchayat(customPanchayatInput);
                      }
                    }}
                    placeholder="Type custom / extra panchayat name..."
                    className="ax-input ax-input--sm"
                    style={{ flex: 1, height: 38, borderRadius: 6, fontSize: 13 }}
                    disabled={submitting || isAcceptedLocked}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomPanchayat(customPanchayatInput)}
                    disabled={!customPanchayatInput.trim() || submitting || isAcceptedLocked}
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{ height: 38, padding: '0 14px', whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    + Add Custom
                  </button>
                </div>

                {/* Checkbox Grid / Cards (Goa-style .ssl-site-list) */}
                <div className="ssl-site-list">
                  {filteredPanchayats.map((p, idx) => {
                    const isChecked = selectedPanchayats.includes(cleanStr(p.panchayat));
                    return (
                      <div
                        key={idx}
                        className={`ssl-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleTogglePanchayat(p.panchayat)}
                        style={{ cursor: isAcceptedLocked ? 'not-allowed' : 'pointer', opacity: isAcceptedLocked ? 0.75 : 1 }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePanchayat(p.panchayat)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: isAcceptedLocked ? 'not-allowed' : 'pointer', accentColor: '#2563eb' }}
                          disabled={submitting || isAcceptedLocked}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--ax-text-strong, #1e293b)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={cleanStr(p.panchayat)}
                          >
                            {cleanStr(p.panchayat)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--ax-text-muted, #64748b)',
                              display: 'flex',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginTop: 2,
                            }}
                          >
                            <span>{p.light_count !== undefined ? `${p.light_count} lights available` : 'Available for allocation'}</span>
                          </div>
                        </div>
                        {p.light_count !== undefined && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: isChecked ? '#dbeafe' : '#f1f5f9',
                              color: isChecked ? '#1e40af' : '#475569',
                            }}
                          >
                            {p.light_count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredPanchayats.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    No panchayats matching &ldquo;{panchayatFilterQuery}&rdquo;
                  </div>
                )}

                {selectedPanchayats.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✓ {selectedPanchayats.length} panchayat(s) selected for assignment ({selectedLightsTally} lights)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="ssl-section-divider" />

          {/* Section 4: Timeline & Remarks */}
          <div ref={sec4} className="ssl-section-block">
            <div className="ssl-section-header">
              <div className="ssl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    4. Timeline & Remarks
                  </h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      Editable
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set completion deadline and enter optional installation remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Deadline Date * */}
              <div>
                <FloatingInput
                  label="Deadline Date"
                  name="deadline_date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  required
                />
              </div>

              {/* Remarks */}
              <div>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  placeholder="Optional assignment remarks or instructions"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/punjab/ssl/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={
                submitting ||
                isAcceptedLocked ||
                !selectedVendor ||
                !selectedVolume ||
                !selectedDistrict ||
                !selectedBlock ||
                selectedPanchayats.length === 0 ||
                !deadlineDate
              }
              style={{
                minWidth: 200,
                fontWeight: 700,
                ...(isAcceptedLocked ? { background: '#94a3b8', borderColor: '#94a3b8', cursor: 'not-allowed' } : {}),
              }}
            >
              {isAcceptedLocked ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Assignment Locked
                </span>
              ) : submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditMode ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditMode ? (
                `Update Assignment (${selectedPanchayats.length} Panchayats)`
              ) : (
                `Assign (${selectedPanchayats.length}) Punjab SSL Lights →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignLights;
