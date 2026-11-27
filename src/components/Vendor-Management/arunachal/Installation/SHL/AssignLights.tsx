import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  arunachalAdminService,
  type VendorItem,
  type VolumeItem,
  type DistrictItem,
  type BlockItem,
  type PanchayatItem,
} from '../../arunachal-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.shl-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
  overflow: hidden;
}
.shl-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.shl-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.shl-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.shl-section-pill-btn {
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
.shl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
}
.shl-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.shl-section-block { padding-top: var(--ax-space-2, 8px); }
.shl-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.shl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.shl-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Site / Panchayat Selection List & Cards */
.shl-site-list {
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
.shl-site-item {
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
.shl-site-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
.shl-site-item.selected {
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

  // 1. Initial Load: Vendors & Volumes or Existing Assignment
  useEffect(() => {
    let active = true;
    const loadInit = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const formDataPromise = arunachalAdminService.getAssignFormData().catch(() => ({ vendors: [], volumes: [] }));

        if (isEditMode && editId) {
          const [editRes, formDataRes, viewAssignRes] = await Promise.allSettled([
            arunachalAdminService.getEditAssign(editId),
            formDataPromise,
            arunachalAdminService.getViewAssign().catch(() => null),
          ]);
          if (!active) return;

          const editData = editRes.status === 'fulfilled' ? editRes.value || {} : {};
          const formData = formDataRes.status === 'fulfilled' ? formDataRes.value || { vendors: [], volumes: [] } : { vendors: [], volumes: [] };
          const viewAssignList =
            viewAssignRes.status === 'fulfilled' && (viewAssignRes.value as any)?.assignedlight
              ? (viewAssignRes.value as any).assignedlight
              : [];

          // Find the record from view-assign list as a guaranteed baseline
          const recordFromView = viewAssignList.find(
            (r: any) => String(r.id) === String(editId)
          );

          // Find record from editData if it has an assigned record property
          const recordFromEdit =
            (editData as any).assignShl ||
            (editData as any).assign_shl ||
            (editData as any).assignSsl ||
            (editData as any).assign_ssl ||
            (editData as any).assignLight ||
            (editData as any).assign_light ||
            (editData as any).assignedlight ||
            (editData as any).assigned_light ||
            (editData as any).assignedLight ||
            (editData as any).assign ||
            (editData as any).assigned ||
            (editData as any).arunachalshl ||
            (editData as any).arunachal_shl ||
            (editData as any).shl ||
            (editData as any).row ||
            (editData as any).record ||
            (editData as any).details ||
            (editData as any).data?.assignShl ||
            (editData as any).data?.assign_shl ||
            (editData as any).data?.assignedlight ||
            (editData as any).data?.assign ||
            ((editData as any).data && typeof (editData as any).data === 'object' && !Array.isArray((editData as any).data) && ((editData as any).data.id || (typeof (editData as any).data.district === 'string' && (editData as any).data.district !== '[object Object]')) ? (editData as any).data : null);

          // Combine record: prefer recordFromEdit, fall back to recordFromView
          const assignObj = { ...(recordFromView || {}), ...(recordFromEdit || {}) };

          const rawVendors = (editData as any).vendor || (editData as any).vendors || (formData as any).vendors || [];
          const rawVolumes = (editData as any).volumes || (editData as any).volume || (formData as any).volumes || [];
          const rawDistricts = (editData as any).districts || (editData as any).district || [];
          const rawBlocks = (editData as any).blocks || (editData as any).block || [];
          const rawPanchayats = (editData as any).panchayats || (editData as any).panchayat || [];

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

          const vol = cleanStr(assignObj.volume) || (combinedVolumes[0]?.volume ?? '1');
          const dist = cleanStr(assignObj.district);
          const blk = cleanStr(assignObj.block);

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
              const fetchedDistricts = await arunachalAdminService.fetchDistricts(vol);
              if (fetchedDistricts && fetchedDistricts.length > 0) {
                fetchedDistricts.forEach(addDist);
              }
            } catch (e) {
              console.warn('[ArunachalAssignLights] Could not fetch districts in edit init:', e);
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
              const fetchedBlocks = await arunachalAdminService.fetchBlocks(vol, dist);
              if (fetchedBlocks && fetchedBlocks.length > 0) {
                fetchedBlocks.forEach(addBlk);
              }
            } catch (e) {
              console.warn('[ArunachalAssignLights] Could not fetch blocks in edit init:', e);
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
            const count = typeof p === 'object' && p !== null ? (Number((p as any).light_count ?? p.count) || 1) : 1;
            if (name && !seenPanchayats.has(name.toLowerCase())) {
              seenPanchayats.add(name.toLowerCase());
              pArr.push({ panchayat: name, count });
            }
          };

          (Array.isArray(rawPanchayats) ? rawPanchayats : []).forEach(addPch);
          if (vol && dist && blk) {
            try {
              const fetchedPanchayats = await arunachalAdminService.fetchPanchayats(vol, dist, blk);
              if (fetchedPanchayats && fetchedPanchayats.length > 0) {
                fetchedPanchayats.forEach(addPch);
              }
            } catch (e) {
              console.warn('[ArunachalAssignLights] Could not fetch panchayats in edit init:', e);
            }
          }
          // Reconcile and ensure all assigned panchayats exist in list
          parsedPanchayats.forEach((name) => {
            if (!seenPanchayats.has(name.toLowerCase())) {
              seenPanchayats.add(name.toLowerCase());
              pArr.push({ panchayat: name, count: 1 });
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
            const dList = await arunachalAdminService.fetchDistricts(firstVol);
            if (active && dList) {
              setDistricts(dList.map((d: any) => ({ district: cleanStr(typeof d === 'string' ? d : d.district) })).filter((d) => Boolean(d.district)));
            }
          }
        }
      } catch (err: any) {
        if (!active) return;
        console.error('[ArunachalAssignLights] Initial load error:', err);
        setErrorMsg(err?.message || 'Failed to initialize form.');
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadInit();
    return () => {
      active = false;
    };
  }, [editId, isEditMode]);

  // 2. Cascade: Volume -> Districts
  useEffect(() => {
    if (!selectedVolume) {
      setDistricts([]);
      return;
    }
    if (isInitialEditLoadRef.current && initialLoadedRef.current.volume === selectedVolume) {
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setErrorMsg('');
      try {
        const dList = await arunachalAdminService.fetchDistricts(selectedVolume);
        if (!active) return;
        const sanitized = dList
          .map((d: any) => ({ district: cleanStr(typeof d === 'string' ? d : d.district) }))
          .filter((d) => Boolean(d.district));
        setDistricts(sanitized);
        setSelectedDistrict('');
        setSelectedBlock('');
        setBlocks([]);
        setSelectedPanchayats([]);
        setPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[ArunachalAssignLights] Districts fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch districts.');
      } finally {
        if (active) setDistrictsLoading(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [selectedVolume]);

  // 3. Cascade: District -> Blocks
  useEffect(() => {
    if (!selectedDistrict || !selectedVolume) {
      setBlocks([]);
      return;
    }
    if (
      isInitialEditLoadRef.current &&
      initialLoadedRef.current.volume === selectedVolume &&
      initialLoadedRef.current.district === selectedDistrict
    ) {
      return;
    }

    let active = true;
    const loadBlocks = async () => {
      setBlocksLoading(true);
      setErrorMsg('');
      try {
        const bList = await arunachalAdminService.fetchBlocks(selectedVolume, selectedDistrict);
        if (!active) return;
        const sanitized = bList
          .map((b: any) => ({ block: cleanStr(typeof b === 'string' ? b : b.block) }))
          .filter((b) => Boolean(b.block));
        setBlocks(sanitized);
        setSelectedBlock('');
        setSelectedPanchayats([]);
        setPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[ArunachalAssignLights] Blocks fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch blocks.');
      } finally {
        if (active) setBlocksLoading(false);
      }
    };
    loadBlocks();
    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedVolume]);

  // 4. Cascade: Block -> Panchayats
  useEffect(() => {
    if (!selectedBlock || !selectedDistrict || !selectedVolume) {
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }
    if (
      isInitialEditLoadRef.current &&
      initialLoadedRef.current.volume === selectedVolume &&
      initialLoadedRef.current.district === selectedDistrict &&
      initialLoadedRef.current.block === selectedBlock
    ) {
      isInitialEditLoadRef.current = false;
      return;
    }

    let active = true;
    const loadPanchayats = async () => {
      setPanchayatsLoading(true);
      setErrorMsg('');
      try {
        const pList = await arunachalAdminService.fetchPanchayats(selectedVolume, selectedDistrict, selectedBlock);
        if (!active) return;
        const sanitized = pList
          .map((p: any) => ({
            panchayat: cleanStr(typeof p === 'string' ? p : p.panchayat),
            count: typeof p === 'object' && p !== null ? (Number((p as any).light_count ?? p.count) || 1) : 1,
          }))
          .filter((p) => Boolean(p.panchayat));
        setPanchayats(sanitized);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('[ArunachalAssignLights] Panchayats fetch error:', err);
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
    if (!q) return panchayats;
    return panchayats.filter((p) => cleanStr(p.panchayat).toLowerCase().includes(q));
  }, [panchayats, panchayatFilterQuery]);

  const selectedLightsTally = useMemo(() => {
    return panchayats
      .filter((p) => selectedPanchayats.includes(cleanStr(p.panchayat)))
      .reduce((sum, p) => sum + (Number((p as any).light_count ?? p.count) || 1), 0);
  }, [panchayats, selectedPanchayats]);

  const handleAddCustomPanchayat = (name: string) => {
    if (submitting || isAcceptedLocked) return;
    const trimmed = cleanStr(name);
    if (!trimmed) return;
    if (!panchayats.some((p) => cleanStr(p.panchayat).toLowerCase() === trimmed.toLowerCase())) {
      setPanchayats((prev) => [...prev, { panchayat: trimmed, count: 1 }]);
    }
    if (!selectedPanchayats.includes(trimmed)) {
      setSelectedPanchayats((prev) => [...prev, trimmed]);
    }
    setCustomPanchayatInput('');
  };

  // Submit Handler: Supports both storeAssign and updateAssign with full payload parity
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isAcceptedLocked) {
      return setErrorMsg('This assignment has been accepted by the vendor (Status: Accepted) and is locked for editing.');
    }

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

      formData.append('state', 'arunachal');
      formData.append('state_name', 'Arunachal Pradesh');
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
        res = await arunachalAdminService.updateAssign(editId, formData);
        setSuccessMsg(res?.message || `${cleanPanchayats.length} Arunachal SHL Lights assignment successfully updated!`);
      } else {
        res = await arunachalAdminService.storeAssign(formData);
        setSuccessMsg(res?.message || `${cleanPanchayats.length} Arunachal SHL Lights assigned successfully!`);
      }

      setTimeout(() => {
        navigate('/vendor-management/arunachal/shl/view-assign');
      }, 1500);
    } catch (err: any) {
      console.error('[ArunachalAssignLights] Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign lights.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page shl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? `Edit Arunachal SHL Assigned Lights #${editId}` : 'Assign Arunachal SHL Installation Data'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : 'Allocate street light installations across districts, blocks, and gram panchayats'
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Arunachal SHL', href: '/vendor-management/arunachal/shl/dashboard' },
          { label: isEditMode ? 'Edit Assignment' : 'Assign Lights' },
        ]}
        actions={
          <Link
            to="/vendor-management/arunachal/shl/view-assign"
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
                {isEditMode ? `Edit Assigned Lights #${editId}` : 'Arunachal SHL Installation Assignment Form'}
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
          <div className="shl-section-pills">
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Volume
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Panchayat Allocation {selectedPanchayats.length > 0 ? `(${selectedPanchayats.length})` : ''}
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name & Volume */}
          <div ref={sec1} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
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
                  Select authorized partner vendor and project volume
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_name"
                  name="vendor_name"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  className="ax-float__input"
                  style={{ appearance: 'auto', paddingRight: '28px' }}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_name" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_id"
                  name="volume_id"
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  className="ax-float__input"
                  style={{ appearance: 'auto', paddingRight: '28px' }}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumes.map((v, i) => (
                    <option key={i} value={String(v.volume)}>
                      {v.volume}
                    </option>
                  ))}
                </select>
                <label htmlFor="volume_id" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="shl-section-divider" />

          {/* Section 2: District & Block */}
          <div ref={sec2} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    2. District & Block Location <span style={{ color: '#ef4444' }}>*</span>
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
                  Filter installation zone by District and Block in Arunachal Pradesh
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_name"
                  name="district_name"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={districtsLoading || !selectedVolume || submitting || isAcceptedLocked}
                  className="ax-float__input"
                  style={{ appearance: 'auto', paddingRight: '28px' }}
                  required
                >
                  <option value="">
                    {districtsLoading ? 'Loading districts...' : !selectedVolume ? '-- Select Volume First --' : '-- Select District --'}
                  </option>
                  {districts.map((d, i) => (
                    <option key={i} value={cleanStr(d.district)}>
                      {cleanStr(d.district)}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_name" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Block * */}
              <div className="ax-float">
                {isCustomBlock ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <FloatingInput
                        label="Custom Block Name"
                        name="block_name"
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        disabled={submitting || isAcceptedLocked}
                        required
                        placeholder="Enter block name"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBlock(false);
                        setSelectedBlock('');
                      }}
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ height: 46, fontSize: 11, padding: '0 8px', whiteSpace: 'nowrap' }}
                      title="Switch back to list dropdown"
                    >
                      ↩ Dropdown
                    </button>
                  </div>
                ) : (
                  <div>
                    <select
                      id="block_name"
                      name="block_name"
                      value={selectedBlock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomBlock(true);
                          setSelectedBlock('');
                        } else {
                          setSelectedBlock(val);
                        }
                      }}
                      disabled={blocksLoading || !selectedDistrict || submitting || isAcceptedLocked}
                      className="ax-float__input"
                      style={{ appearance: 'auto', paddingRight: '28px' }}
                      required
                    >
                      <option value="">
                        {blocksLoading ? 'Loading blocks...' : !selectedDistrict ? '-- Select District First --' : '-- Select Block --'}
                      </option>
                      {blocks.map((b, i) => (
                        <option key={i} value={cleanStr(b.block)}>
                          {cleanStr(b.block)}
                        </option>
                      ))}
                      {selectedDistrict && (
                        <option value="__custom__">+ Enter Custom Block Name...</option>
                      )}
                    </select>
                    <label htmlFor="block_name" className="ax-float__label floating">
                      Block <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="shl-section-divider" />

          {/* Section 3: Panchayat Allocation */}
          <div ref={sec3} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    3. Gram Panchayat Allocation <span style={{ color: '#ef4444' }}>*</span>
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
                  Select one or more gram panchayats to allocate light installations to the partner vendor
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {filteredPanchayats.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={submitting || isAcceptedLocked}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                  >
                    {selectedPanchayats.length === filteredPanchayats.length && filteredPanchayats.length > 0
                      ? 'Deselect All'
                      : `Select All (${filteredPanchayats.length})`}
                  </button>
                )}
                {selectedPanchayats.length > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: '#dbeafe',
                      color: '#1d4ed8',
                    }}
                  >
                    {selectedPanchayats.length} Selected ({selectedLightsTally} Lights)
                  </span>
                )}
              </div>
            </div>

            {/* Selected Tags Ribbon */}
            {selectedPanchayats.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  borderRadius: 8,
                  border: '1px solid var(--ax-border, #cbd5e1)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                  Currently Selected Panchayats ({selectedPanchayats.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPanchayats.map((name, i) => (
                    <span
                      key={i}
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
                      <option value="">-- Quick Select Panchayat from List ({panchayats.length}) --</option>
                      {panchayats.map((p, idx) => {
                        const isChecked = selectedPanchayats.includes(cleanStr(p.panchayat));
                        return (
                          <option key={idx} value={cleanStr(p.panchayat)}>
                            {isChecked ? '✓ ' : ''}{cleanStr(p.panchayat)}{(p as any).light_count !== undefined ? ` (${(p as any).light_count} lights available)` : p.count !== undefined ? ` (${p.count} lights available)` : ''}
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

                {/* Checkbox Grid / Cards */}
                <div className="shl-site-list">
                  {filteredPanchayats.map((p, idx) => {
                    const isChecked = selectedPanchayats.includes(cleanStr(p.panchayat));
                    return (
                      <div
                        key={idx}
                        className={`shl-site-item ${isChecked ? 'selected' : ''}`}
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
                            <span>{(p as any).light_count !== undefined ? `${(p as any).light_count} lights available` : p.count !== undefined ? `${p.count} lights available` : 'Available for allocation'}</span>
                          </div>
                        </div>
                        {((p as any).light_count !== undefined || p.count !== undefined) && (
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
                            {(p as any).light_count ?? p.count}
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

          <hr className="shl-section-divider" />

          {/* Section 4: Timeline & Remarks */}
          <div ref={sec4} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
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
            <Link to="/vendor-management/arunachal/shl/view-assign" className="ax-btn ax-btn--secondary">
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
                `Assign (${selectedPanchayats.length}) Arunachal SHL Lights →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignLights;
