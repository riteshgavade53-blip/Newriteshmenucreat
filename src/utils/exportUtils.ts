import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { MenuItemRow } from '../types';

export const PETPOOJA_COLUMNS = [
  'Name',
  'Item_Online_DisplayName',
  'Variation_Name',
  'Price',
  'Category',
  'Category_Online_DisplayName',
  'Short_Code',
  'Short_Code_2',
  'Description',
  'Attributes',
  'Goods_Services',
] as const;

export function sanitizeRowsForExport(rows: MenuItemRow[]): Record<string, string>[] {
  return rows.map((row) => ({
    Name: row.Name || '',
    Item_Online_DisplayName: row.Item_Online_DisplayName || row.Name || '',
    Variation_Name: row.Variation_Name || '',
    Price: String(row.Price ?? ''),
    Category: row.Category || 'General',
    Category_Online_DisplayName: row.Category_Online_DisplayName || row.Category || 'General',
    Short_Code: row.Short_Code || '',
    Short_Code_2: row.Short_Code_2 || '',
    Description: row.Description || '',
    Attributes: row.Attributes || '',
    Goods_Services: row.Goods_Services || 'Goods',
  }));
}

export function exportToExcel(rows: MenuItemRow[], filename = 'Petpooja_Menu_Extraction') {
  const data = sanitizeRowsForExport(rows);
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: [...PETPOOJA_COLUMNS],
  });

  // Calculate reasonable column widths
  const colWidths = PETPOOJA_COLUMNS.map((col) => {
    let maxLen = col.length;
    for (const row of data) {
      const val = row[col] || '';
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 14), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Petpooja Menu');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}

export function exportToCsv(rows: MenuItemRow[], filename = 'Petpooja_Menu_Extraction') {
  const data = sanitizeRowsForExport(rows);
  const csv = Papa.unparse(data, {
    columns: [...PETPOOJA_COLUMNS],
    quotes: true,
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly recognizes Hindi, Marathi, Gujarati Devanagari/Gujarati scripts
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboardTsv(rows: MenuItemRow[]): Promise<boolean> {
  try {
    const data = sanitizeRowsForExport(rows);
    const headerRow = PETPOOJA_COLUMNS.join('\t');
    const contentRows = data.map((row) =>
      PETPOOJA_COLUMNS.map((col) => (row[col] || '').replace(/[\t\n\r]/g, ' ')).join('\t')
    );
    const tsv = [headerRow, ...contentRows].join('\n');
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
