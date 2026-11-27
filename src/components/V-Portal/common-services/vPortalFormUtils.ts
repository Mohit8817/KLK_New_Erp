/**
 * Universal Form & Error Handling Utilities for V-Portal Forms
 * 
 * Ensures:
 * 1. Backend error text (e.g., "mobile number digit less", Laravel 422 errors) is shown directly
 *    instead of generic strings like "The given data was invalid." or "Failed to submit form".
 * 2. Missing required fields are explicitly listed to the user (e.g., "Required fields missing: Contact Number, Module Serial").
 * 3. Maps backend validation error keys (e.g., f_contact, contact_number, mobile) to the corresponding form field keys.
 * 4. Automatically scrolls to and highlights the first invalid field.
 */

// Common generic phrases that should NOT be shown if specific validation details exist
const GENERIC_ERROR_PATTERNS = [
  /^the given data was invalid/i,
  /^validation failed/i,
  /^validation error/i,
  /^server error/i,
  /^error occurred/i,
  /^an error occurred/i,
  /^request failed/i,
  /^something went wrong/i,
  /^whoops, looks like something went wrong/i,
  /^internal server error/i,
  /^bad request/i,
  /^failed to (submit|save|update|create|process)/i,
];

export function isGenericErrorMessage(msg?: string | null): boolean {
  if (!msg || typeof msg !== 'string') return true;
  const trimmed = msg.trim();
  if (!trimmed) return true;
  return GENERIC_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Standard dictionary of friendly field labels for V-Portal forms
 */
export const V_PORTAL_FIELD_LABELS: Record<string, string> = {
  // Common & Demographics
  district: 'District',
  block: 'Block',
  panchayat: 'Panchayat',
  panchyat: 'Panchayat',
  village: 'Village',
  post: 'Post Office',
  state: 'State',
  ward_no: 'Ward No.',
  wardNo: 'Ward No.',
  pole_no: 'Pole No.',
  poleNo: 'Pole No.',
  beneficiary_name: 'Beneficiary / Farmer Name',
  beneficiaryName: 'Beneficiary / Farmer Name',
  farmer_name: 'Farmer Name',
  f_farmer_name: 'Farmer Name',
  father_name: 'Father Name',
  f_father_name: 'Father Name',
  gender: 'Gender',
  contact_no: 'Contact Number',
  contactNo: 'Contact Number',
  contact_number: 'Contact Number',
  mobile: 'Mobile Number',
  f_contact: 'Contact Number',
  f_mobile: 'Contact Number',
  beneficiaryContact: 'Beneficiary Contact',
  amc_beneficiary_contact: 'Beneficiary Contact',
  amc_beneficiary_name: 'Beneficiary Name',

  // Site & IDs
  site: 'Site',
  site_id: 'Site Selection',
  selectedSiteId: 'Site Selection',
  srt_id: 'Site Selection',
  unique_id: 'Site / Unique ID',
  uniqueId: 'Site / Unique ID',
  uid: 'UID',
  discom: 'Discom',
  dept_name: 'Department Name',
  firm_name: 'Firm Name',
  ca_no: 'CA Number',
  sanction_load: 'Sanction Load',
  plant_sc: 'Plant SC',
  wo_no: 'Work Order No.',
  phase: 'Phase',
  lot_no: 'Lot No.',
  invoice_no: 'Invoice No.',
  f_invoice_no: 'Invoice No.',
  application_no: 'Application No.',

  // Technical & Equipment
  inverter_no: 'Inverter Number',
  Inverter_no: 'Inverter Number',
  inverterNo: 'Inverter Number',
  vfd_no: 'VFD Number',
  vfdNo: 'VFD Number',
  uuid_no: 'UUID Number',
  uuidNo: 'UUID Number',
  battery_no: 'Battery Serial Number',
  batteryNo: 'Battery Serial Number',
  battery_serial_no: 'Battery Serial Number',
  panel_no: 'Module / Panel Number',
  panelNo: 'Module / Panel Number',
  module_no: 'Module / Panel Number',
  module_serial_no: 'Module Serial Number(s)',
  moduleSerials: 'Module Serial Number(s)',
  light_no: 'Light Number',
  lightNo: 'Light Number',
  solarmeter_no: 'Solar Meter Number',
  loger_no: 'Logger Number',
  rms_id: 'RMS ID',

  // GPS Coordinates
  latitude: 'Latitude',
  longitude: 'Longitude',
  inst_latitude: 'Installation Latitude',
  inst_longitude: 'Installation Longitude',
  amc_latitude: 'AMC Latitude',
  amc_longitude: 'AMC Longitude',

  // Dates & AMC
  date: 'Date',
  complaint_date: 'Complaint Date',
  amcDate: 'AMC Date',
  amc_date: 'AMC Date',
  amcType: 'AMC Type',
  amc_type: 'AMC Type',
  month: 'AMC Month / Period',
  months: 'AMC Month / Period',
  year: 'AMC Year',
  amc_years: 'AMC Year',

  // Complaints
  complaint: 'Complaint Description',
  complaint_text: 'Complaint Description',
  remarks: 'Remarks',
  inst_remarks: 'Installation Remarks',
  amc_remark: 'AMC Remarks',

  // Files & Photos
  light_file: 'Installation / Light Photo',
  module_image: 'Module with Farmer Photo',
  inverter_vfd_image: 'Inverter & VFD Photo',
  running_water_image: 'Running Water Photo',
  document: 'Document / Photo',
  file: 'Document / Photo',
  file2: 'Rooftop Array Photo',
  file3: 'ACDB / DCDB Photo',
  file4: 'Test Sheet / Document',
  image1: 'AMC Image 1',
  image2: 'AMC Image 2',
  image3: 'AMC Image 3',
  amc_image1: 'AMC Image 1',
  amc_image2: 'AMC Image 2',
  amc_image3: 'AMC Image 3',
  complaint_image: 'Complaint Photo',
};

/**
 * Normalizes field key to map backend validation keys to common frontend form state keys
 */
export function normalizeFieldKey(rawKey: string): string[] {
  const clean = rawKey.trim();
  const candidates: string[] = [clean];

  // Contact / Mobile aliases
  if (/^(f_contact|f_mobile|contact_no|contact_number|mobile|beneficiary_contact|amc_beneficiary_contact|c_contact_no|contractor_no|contractor_mo_no)$/i.test(clean)) {
    candidates.push('contact_no', 'contactNo', 'mobile', 'beneficiaryContact', 'contact');
  }

  // Beneficiary Name aliases
  if (/^(beneficiary_name|f_name|farmer_name|f_farmer_name|amc_beneficiary_name)$/i.test(clean)) {
    candidates.push('beneficiary_name', 'beneficiaryName', 'farmer_name', 'f_name');
  }

  // Equipment serials
  if (/^(module_no|module_serial|module_serial_no|panel_no|panelNo)$/i.test(clean)) {
    candidates.push('panelNo', 'panel_no', 'module_serial_no', 'moduleSerials');
  }
  if (/^(light_no|luminary_no|lightNo)$/i.test(clean)) {
    candidates.push('lightNo', 'light_no');
  }
  if (/^(uuid_no|uuidNo)$/i.test(clean)) {
    candidates.push('uuidNo', 'uuid_no');
  }
  if (/^(battery_no|battery_serial_no|batteryNo)$/i.test(clean)) {
    candidates.push('batteryNo', 'battery_no', 'battery_serial_no');
  }
  if (/^(inverter_no|inverterNo)$/i.test(clean)) {
    candidates.push('inverterNo', 'inverter_no');
  }
  if (/^(vfd_no|vfdNo)$/i.test(clean)) {
    candidates.push('vfdNo', 'vfd_no');
  }
  if (/^(ward_no|wardNo)$/i.test(clean)) {
    candidates.push('wardNo', 'ward_no');
  }
  if (/^(pole_no|poleNo)$/i.test(clean)) {
    candidates.push('poleNo', 'pole_no');
  }

  // GPS aliases
  if (/^(latitude|inst_latitude|amc_latitude)$/i.test(clean)) {
    candidates.push('latitude', 'inst_latitude', 'amc_latitude');
  }
  if (/^(longitude|inst_longitude|amc_longitude)$/i.test(clean)) {
    candidates.push('longitude', 'inst_longitude', 'amc_longitude');
  }

  // File aliases
  if (/^(light_file|image|photo|light_image)$/i.test(clean)) {
    candidates.push('light_file', 'file');
  }
  if (/^(document|doc|file)$/i.test(clean)) {
    candidates.push('document', 'file');
  }
  if (/^(amc_image1|image1)$/i.test(clean)) {
    candidates.push('image1', 'amc_image1');
  }
  if (/^(amc_image2|image2)$/i.test(clean)) {
    candidates.push('image2', 'amc_image2');
  }
  if (/^(amc_image3|image3)$/i.test(clean)) {
    candidates.push('image3', 'amc_image3');
  }

  // Site aliases
  if (/^(srt_id|site_id|id|selectedSiteId)$/i.test(clean)) {
    candidates.push('site', 'selectedSiteId', 'srt_id', 'site_id');
  }

  return Array.from(new Set(candidates));
}

/**
 * Extracts exact backend error messages and mapped field-level errors.
 * Prioritizes specific messages over generic Laravel texts like "The given data was invalid."
 */
export function extractBackendError(
  resOrErr: any,
  fallbackMsg = 'Failed to submit form. Please check the fields.'
): {
  message: string;
  fieldErrors: Record<string, string>;
  rawErrors?: any;
} {
  const fieldErrors: Record<string, string> = {};
  const specificMessages: string[] = [];

  if (!resOrErr) {
    return { message: fallbackMsg, fieldErrors };
  }

  // If passed an Error object or string
  if (typeof resOrErr === 'string') {
    return { message: resOrErr.trim() || fallbackMsg, fieldErrors };
  }

  const raw = resOrErr?.response?.data || resOrErr?.data || resOrErr;

  // 1. Check `errors` object (Laravel standard validation bag: { [field]: ["error text"] })
  const errorsObj = raw?.errors || resOrErr?.errors;
  if (errorsObj && typeof errorsObj === 'object') {
    if (Array.isArray(errorsObj)) {
      errorsObj.forEach((errItem) => {
        if (typeof errItem === 'string' && errItem.trim()) {
          specificMessages.push(errItem.trim());
        }
      });
    } else {
      Object.entries(errorsObj).forEach(([rawKey, val]) => {
        let msg = '';
        if (Array.isArray(val)) {
          msg = val.filter(Boolean).map((v) => String(v).trim()).join(', ');
        } else if (typeof val === 'string') {
          msg = val.trim();
        } else if (val) {
          msg = String(val).trim();
        }

        if (msg) {
          specificMessages.push(msg);
          // Map to original key and normalized aliases
          const aliasKeys = normalizeFieldKey(rawKey);
          aliasKeys.forEach((k) => {
            if (!fieldErrors[k]) {
              fieldErrors[k] = msg;
            }
          });
        }
      });
    }
  }

  // 2. Check `error` property
  const errorProp = raw?.error || resOrErr?.error;
  if (errorProp) {
    if (typeof errorProp === 'string' && errorProp.trim()) {
      if (!isGenericErrorMessage(errorProp)) {
        specificMessages.push(errorProp.trim());
      }
    } else if (typeof errorProp === 'object' && !Array.isArray(errorProp)) {
      Object.entries(errorProp).forEach(([k, v]) => {
        const msg = Array.isArray(v) ? v.join(', ') : String(v || '');
        if (msg) {
          specificMessages.push(msg);
          normalizeFieldKey(k).forEach((alias) => {
            if (!fieldErrors[alias]) fieldErrors[alias] = msg;
          });
        }
      });
    }
  }

  // 3. Check `msg` property (Common in custom PHP endpoints)
  const msgProp = raw?.msg || resOrErr?.msg;
  if (typeof msgProp === 'string' && msgProp.trim()) {
    if (!isGenericErrorMessage(msgProp)) {
      specificMessages.push(msgProp.trim());
    }
  }

  // 4. Check `message` property
  const messageProp = raw?.message || resOrErr?.message;
  let generalMessage = '';
  if (typeof messageProp === 'string' && messageProp.trim()) {
    if (!isGenericErrorMessage(messageProp)) {
      specificMessages.push(messageProp.trim());
    } else {
      generalMessage = messageProp.trim();
    }
  }

  // Assemble final user-facing message:
  // Prefer specific messages (e.g., "mobile number digit less")
  let finalMessage = '';
  const uniqueSpecific = Array.from(new Set(specificMessages)).filter(Boolean);
  if (uniqueSpecific.length > 0) {
    finalMessage = uniqueSpecific.join(' | ');
  } else if (generalMessage) {
    finalMessage = generalMessage;
  } else {
    finalMessage = fallbackMsg;
  }

  return {
    message: finalMessage,
    fieldErrors,
    rawErrors: errorsObj || errorProp,
  };
}

/**
 * Builds an explicit list of missing required fields when client-side validation fails.
 * Example return: "Required fields missing: Contact Number, Inverter Number, Module Photo"
 */
export function formatMissingRequiredMsg(
  errors: Record<string, string>,
  customLabels?: Record<string, string>
): string {
  const keys = Object.keys(errors).filter((k) => !!errors[k]);
  if (keys.length === 0) return 'Please check the form for errors.';

  // Check if any error is an invalid format message rather than empty field
  const formatErrorMsgs = Object.values(errors).filter((msg) =>
    /(must be|invalid|digit|exceeds|less than|greater than|valid)/i.test(msg)
  );

  const missingLabels: string[] = [];
  const labelMap = { ...V_PORTAL_FIELD_LABELS, ...(customLabels || {}) };

  keys.forEach((key) => {
    // If it's a specific format error, we can still list the field
    const friendly =
      labelMap[key] ||
      key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();

    if (!missingLabels.includes(friendly)) {
      missingLabels.push(friendly);
    }
  });

  // If there are specific format errors (e.g. "mobile number digit less"), surface them directly
  if (formatErrorMsgs.length > 0 && keys.length <= 2) {
    return formatErrorMsgs.join(' | ');
  }

  if (missingLabels.length === 1) {
    return `Required field missing: ${missingLabels[0]}. ${errors[keys[0]] || 'Please fill in this field.'}`;
  }

  return `Required field(s) missing or invalid: ${missingLabels.join(', ')}.`;
}

/**
 * Smoothly scrolls to and focuses the first invalid element on the page.
 */
export function scrollToFirstError(customSelector?: string): HTMLElement | null {
  const selector =
    customSelector ||
    '.is-invalid, [aria-invalid="true"], .ax-field-feedback--error, .up-field-error, .ssl-field-error, .has-error, input:invalid, select:invalid, textarea:invalid';

  const el = document.querySelector<HTMLElement>(selector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      if (typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
      }
    } catch {}
    return el;
  }

  // Fallback scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return null;
}
