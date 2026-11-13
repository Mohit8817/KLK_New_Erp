import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  karnatakaAdminService,
  type WarehouseItem,
  type ProductItem,
  type VendorItem,
} from '../../karnataka-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (same as Assign Installation)
const SINGLE_CARD_FORM_CSS = `
.kmat-dispatch-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.kmat-dispatch-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.kmat-dispatch-form .ax-card__body { padding: var(--ax-space-6); }

/* Quick Section Nav Pills */
.kmat-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.kmat-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  color: var(--ax-text);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.kmat-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid));
}
.kmat-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.kmat-section-block { padding-top: var(--ax-space-2); }
.kmat-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.kmat-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.kmat-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  color: var(--ax-text);
  outline: none;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard),
              box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }
textarea.ax-float__input {
  height: auto;
  min-height: 96px;
  padding-top: 20px;
  resize: vertical;
}

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm);
  color: var(--ax-text-subtle);
  background: var(--ax-surface-solid);
  border-radius: var(--ax-radius-xs);
  pointer-events: none;
  transition: top var(--ax-motion-fast) var(--ax-ease-standard),
              font-size var(--ax-motion-fast) var(--ax-ease-standard),
              color var(--ax-motion-fast) var(--ax-ease-standard);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
textarea.ax-float__input + .ax-float__label { top: 22px; }
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
  color: var(--ax-text-muted);
}

/* Product table */
.kmat-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--ax-border);
  border-radius: 10px;
  background: var(--ax-surface-solid);
}
.kmat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.kmat-table th {
  background: var(--ax-surface-subtle);
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--ax-border);
  font-weight: 600;
  font-size: 12px;
  color: var(--ax-text-muted);
}
.kmat-table td { padding: 10px 14px; border-bottom: 1px solid var(--ax-border-subtle); }
.kmat-table tr:last-child td { border-bottom: 0; }
.kmat-cell-input {
  width: 100%;
  height: 40px;
  padding: 6px 12px;
  font-size: var(--ax-text-sm);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  color: var(--ax-text);
  outline: none;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard),
              box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.kmat-cell-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.kmat-cell-input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }
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
  min?: number;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder, min }: FloatingInputProps) {
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
        min={min}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

interface ProductRow {
  material_id?: number;
  product: string;
  unit: string;
  quantity: string | number;
}

const COMMON_UNITS = ['Nos', 'Sets', 'Pcs', 'Mtr', 'Kg', 'Box', 'Units'];

export function DispatchMaterial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // Form Fields
  const [vendorId, setVendorId] = useState<string>('');
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [numberOfSites, setNumberOfSites] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [truckNumber, setTruckNumber] = useState<string>('');
  const [challanNumber, setChallanNumber] = useState<string>('');
  const [driverNumber, setDriverNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Dynamic Product Rows
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { product: '', unit: 'Nos', quantity: '' },
  ]);

  // Options from API
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Initial Data Load (API 22 or API 24)
  useEffect(() => {
    let isMounted = true;
    async function loadFormRequirements() {
      setLoading(true);
      setErrorMsg('');
      try {
        if (editId) {
          const editData = await karnatakaAdminService.getUpdateMaterialDispatch(editId);
          if (!isMounted) return;
          setVendors(Array.isArray(editData?.vendors) ? editData.vendors : []);
          setWarehouses(Array.isArray(editData?.warehouse) ? editData.warehouse : []);
          setProducts(Array.isArray(editData?.products) ? editData.products : []);

          const dm = editData?.dispatchmaterial || {};
          setVendorId(String(dm.vendor_id || ''));
          setWarehouseName(dm.warehouse_name || dm.warehouse || '');
          setNumberOfSites(String(dm.site_count || ''));
          setDispatchDate(dm.dispatch_date ? dm.dispatch_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
          setTruckNumber(dm.truck_no || dm.truck || '');
          setChallanNumber(dm.challan_no || dm.challan || '');
          setDriverNumber(dm.driver_no || dm.phone || '');
          setRemarks(dm.remarks || '');

          const mats = editData?.dispatches?.[0]?.material || dm.material || [];
          if (Array.isArray(mats) && mats.length > 0) {
            setProductRows(
              mats.map((m: any) => ({
                material_id: m.id,
                product: m.product || '',
                unit: m.unit || 'Nos',
                quantity: m.quantity || '',
              }))
            );
          }
        } else {
          const data = await karnatakaAdminService.getMaterialDispatchFormData();
          if (!isMounted) return;
          setVendors(Array.isArray(data?.vendors) ? data.vendors : []);
          setWarehouses(Array.isArray(data?.warehouse) ? data.warehouse : []);
          setProducts(Array.isArray(data?.products) ? data.products : []);
        }
      } catch (err: any) {
        console.error('Material dispatch requirements load error:', err);
        setErrorMsg(err?.message || 'Failed to load dispatch form options.');
        setVendors([]);
        setWarehouses([]);
        setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFormRequirements();
    return () => { isMounted = false; };
  }, [editId]);

  // Product Row Operations
  const handleAddRow = () => {
    setProductRows((prev) => [...prev, { product: '', unit: 'Nos', quantity: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (productRows.length === 1) {
      setProductRows([{ product: '', unit: 'Nos', quantity: '' }]);
      return;
    }
    setProductRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, key: keyof ProductRow, value: any) => {
    setProductRows((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, [key]: value } : r))
    );
  };

  // Submit Handler (API 23 or API 25)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendorId) {
      setErrorMsg('Please select a Vendor Name.');
      return;
    }
    if (!warehouseName) {
      setErrorMsg('Please select a Warehouse Name.');
      return;
    }
    const sitesCountNum = Number(numberOfSites);
    if (!numberOfSites || isNaN(sitesCountNum) || sitesCountNum < 1) {
      setErrorMsg('Please enter a valid Number of Sites (min 1).');
      return;
    }
    if (!dispatchDate) {
      setErrorMsg('Please select a Dispatch Date.');
      return;
    }
    if (!truckNumber.trim()) {
      setErrorMsg('Please enter Truck Number.');
      return;
    }
    if (!challanNumber.trim()) {
      setErrorMsg('Please enter Challan Number.');
      return;
    }
    if (!driverNumber.trim()) {
      setErrorMsg('Please enter Driver Number.');
      return;
    }

    // Validate product rows
    const validRows = productRows.filter((r) => r.product && Number(r.quantity) > 0);
    if (validRows.length === 0) {
      setErrorMsg('Please enter at least one Product Requirement with valid quantity.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        site_count: sitesCountNum,
        vendor_id: Number(vendorId),
        dispatch_date: dispatchDate,
        truck: truckNumber,
        challan: challanNumber,
        phone: driverNumber,
        warehouse: warehouseName,
        remarks: remarks || '',
        product: validRows.map((r) => r.product),
        quantity: validRows.map((r) => Number(r.quantity)),
        unit: validRows.map((r) => r.unit || 'Nos'),
      };

      if (editId) {
        payload.material_id = validRows.map((r) => r.material_id ?? null);
        const res = await karnatakaAdminService.updateMaterialDispatch(editId, payload);
        setSuccessMsg(res.message || 'Material Updated Successfully!!!');
      } else {
        const res = await karnatakaAdminService.storeMaterialDispatch(payload);
        setSuccessMsg(res.message || 'Material Dispatch Successfully!!!');
      }

      setTimeout(() => {
        navigate('/vendor-management/karnataka/swp/view-material-dispatch');
      }, 1200);
    } catch (err: any) {
      console.error('Material dispatch save error:', err);
      setErrorMsg(err?.message || 'Something went wrong while saving material dispatch.');
    } finally {
      setLoading(false);
    }
  };

  const filledItemsCount = productRows.filter((r) => r.product && Number(r.quantity) > 0).length;

  return (
    <div className="ax-page kmat-dispatch-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={editId ? 'Edit Karnataka Material Dispatch' : 'Karnataka Material Dispatch'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Karnataka SWP', href: '/vendor-management/karnataka/swp/dashboard' },
          { label: editId ? 'Edit Material Dispatch' : 'Karnataka Material Dispatch' },
        ]}
        actions={
          <Link
            to="/vendor-management/karnataka/swp/view-material-dispatch"
            className="ax-btn ax-btn--secondary ax-btn--sm"
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
            View Dispatch Details
          </Link>
        }
      />

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
                {editId ? `Edit Karnataka Material Dispatch #${editId}` : 'Karnataka Material Dispatch'}
              </h2>
           
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {filledItemsCount > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {filledItemsCount} Product(s) Added
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="kmat-section-pills">
            <button type="button" className="kmat-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Warehouse
            </button>
            <button type="button" className="kmat-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Consignment Details
            </button>
            <button type="button" className="kmat-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Product Requirement
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor & Warehouse */}
          <div ref={sec1} className="kmat-section-block">
            <div className="kmat-section-header">
              <div className="kmat-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & Warehouse</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select vendor, dispatch warehouse and number of sites
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_name"
                  className="ax-float__input"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.vendor_id ? `(${v.vendor_id})` : ''}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_name" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Warehouse Name * */}
              <div className="ax-float">
                <select
                  id="warehouse_name"
                  className="ax-float__input"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((w, idx) => (
                    <option key={idx} value={w.warehouse}>
                      {w.warehouse}
                    </option>
                  ))}
                </select>
                <label htmlFor="warehouse_name" className="ax-float__label floating">
                  Warehouse Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Number of Sites * */}
              <FloatingInput
                label="Number of Sites"
                name="sites_count"
                type="number"
                min={1}
                value={numberOfSites}
                onChange={(e) => setNumberOfSites(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <hr className="kmat-section-divider" />

          {/* Section 2: Consignment Details */}
          <div ref={sec2} className="kmat-section-block">
            <div className="kmat-section-header">
              <div className="kmat-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Consignment Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Dispatch date, truck, challan and driver information
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              <FloatingInput
                label="Dispatch Date"
                name="dispatch_date"
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                disabled={loading}
                required
              />
              <FloatingInput
                label="Truck Number"
                name="truck_no"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                disabled={loading}
                required
              />
              <FloatingInput
                label="Challan Number"
                name="challan_no"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                disabled={loading}
                required
              />
              <FloatingInput
                label="Driver Number"
                name="driver_no"
                value={driverNumber}
                onChange={(e) => setDriverNumber(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Remarks */}
            <div className="ax-float">
              <textarea
                id="remarks"
                className="ax-float__input"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
              />
              <label
                htmlFor="remarks"
                className={`ax-float__label ${remarks ? 'has-val' : ''}`}
              >
                Remarks
              </label>
            </div>
          </div>

          <hr className="kmat-section-divider" />

          {/* Section 3: Product Requirement * */}
          <div ref={sec3} className="kmat-section-block">
            <div className="kmat-section-header">
              <div className="kmat-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Product Requirement <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Add equipment, pumps, solar modules, and controllers allocated in this consignment
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={loading}
                className="ax-btn ax-btn--secondary ax-btn--sm"
                style={{ fontSize: 12 }}
              >
                + Add Product Item
              </button>
            </div>

            <div className="kmat-table-wrap">
              <table className="kmat-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>Product *</th>
                    <th style={{ minWidth: 160 }}>Unit *</th>
                    <th style={{ minWidth: 160 }}>Quantity *</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="kmat-cell-input"
                          value={row.product}
                          onChange={(e) => handleRowChange(idx, 'product', e.target.value)}
                          disabled={loading}
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="kmat-cell-input"
                          value={row.unit}
                          onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                          disabled={loading}
                          required
                        >
                          <option value="">-- Select Unit --</option>
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          className="kmat-cell-input"
                          placeholder="Enter Quantity"
                          value={row.quantity}
                          onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                          disabled={loading}
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={loading || (productRows.length === 1 && idx === 0)}
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{
                            color: '#ef4444',
                            opacity: productRows.length === 1 && idx === 0 ? 0.4 : 1,
                            cursor: productRows.length === 1 && idx === 0 ? 'not-allowed' : 'pointer',
                          }}
                          title="Delete Item"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/karnataka/swp/view-material-dispatch" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {editId ? 'Updating...' : 'Submitting...'}
                </span>
              ) : editId ? (
                'Update Dispatch'
              ) : (
                'Submit Dispatch'
              )}
            </button>
          </div>
        </div>
      </form>

      <footer
        style={{
          marginTop: 32,
          textAlign: 'center',
          color: 'var(--ax-text-muted, #64748b)',
          fontSize: 13,
        }}
      >
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export default DispatchMaterial;