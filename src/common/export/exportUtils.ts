export interface ExportColumn<T = any> {
  label?: string;
  key?: string;
  header?: string;
  accessor?: any;
  [key: string]: any;
}

const extractHeader = (c: ExportColumn<any>): string => c.header || c.label || c.key || '';

const extractValue = (c: ExportColumn<any>, item: any, idx: number): any => {
  const acc = c.accessor || c.key;
  if (typeof acc === 'function') {
    return acc(item, idx);
  }
  if (acc !== undefined && acc !== null && typeof acc === 'string') {
    return item[acc];
  }
  return '';
};

/**
 * Low-level CSV export from raw headers and rows.
 * Adds UTF-8 BOM so special characters open cleanly in Microsoft Excel.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const sanitizeCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitizeCell).join(',');
  const dataRows = rows.map((r) => r.map(sanitizeCell).join(','));

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, ensureExtension(filename, '.csv'));
}

/**
 * High-level CSV exporter from typed object data and column definitions.
 */
export function exportDataToCSV<T>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[]
): void {
  const headers = columns.map(extractHeader);
  const rows = data.map((item, idx) =>
    columns.map((c) => extractValue(c, item, idx))
  );

  exportToCSV(filename, headers, rows);
}

/**
 * Generates an Excel-compatible HTML/XML spreadsheet.
 * Opens natively in Microsoft Excel with formatted headers and auto-column width.
 */
export function exportDataToExcel<T>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[],
  sheetName = 'Sheet1'
): void {
  const escapeXml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${escapeXml(sheetName)}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <style>
        th { background-color: #0A234A; color: #FFFFFF; font-weight: bold; border: 0.5pt solid #CCCCCC; padding: 6px; }
        td { border: 0.5pt solid #E2E8F0; padding: 5px; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${columns.map((c) => `<th>${escapeXml(extractHeader(c))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item, idx) => `
            <tr>
              ${columns
                .map((c) => {
                  const val = extractValue(c, item, idx);
                  return `<td>${escapeXml(val)}</td>`;
                })
                .join('')}
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, ensureExtension(filename, '.xls'));
}

/**
 * Copies table data as tab-separated values (TSV) directly to clipboard.
 * Pastes cleanly into Excel, Google Sheets, or Word tables.
 */
export async function copyTableDataToClipboard<T>(
  data: T[],
  columns: ExportColumn<T>[]
): Promise<boolean> {
  try {
    const headers = columns.map(extractHeader).join('\t');
    const rows = data.map((item, idx) =>
      columns
        .map((c) => {
          const val = extractValue(c, item, idx);
          return val === null || val === undefined ? '' : String(val).replace(/\t|\r|\n/g, ' ');
        })
        .join('\t')
    );

    const tsv = [headers, ...rows].join('\n');
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy table data to clipboard:', err);
    return false;
  }
}

/**
 * Opens a clean printable window with the table data.
 */
export function printTableData<T>(
  title: string,
  data: T[],
  columns: ExportColumn<T>[]
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=650');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
          h2 { margin-bottom: 4px; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background-color: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <div class="meta">Exported on ${new Date().toLocaleString()} | Total Records: ${data.length}</div>
        <table>
          <thead>
            <tr>${columns.map((c) => `<th>${extractHeader(c)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item, idx) => `
              <tr>
                ${columns
                  .map((c) => {
                    const val = extractValue(c, item, idx);
                    return `<td>${val ?? ''}</td>`;
                  })
                  .join('')}
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Helpers
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ensureExtension(filename: string, ext: string): string {
  if (filename.toLowerCase().endsWith(ext.toLowerCase())) return filename;
  return `${filename}${ext}`;
}
