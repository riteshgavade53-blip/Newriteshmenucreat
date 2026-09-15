import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Configure PDF.js worker using CDN fallback or standard url
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch {
    // fallback
  }
}

export interface PdfExtractResult {
  tables: string[][][];
  totalTables: number;
  totalRows: number;
}

function clusterPositions(allX: number[], threshold: number): number[] {
  if (!allX.length) return [0];
  const sorted = [...allX].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let current: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] <= threshold) {
      current.push(sorted[i]);
    } else {
      clusters.push(current);
      current = [sorted[i]];
    }
  }
  clusters.push(current);
  return clusters.map((c) => c.reduce((a, b) => a + b, 0) / c.length);
}

function findNearestColumn(x: number, centers: number[]): number {
  if (!centers.length) return 0;
  let best = 0;
  let bestDist = Math.abs(x - centers[0]);

  for (let i = 1; i < centers.length; i++) {
    const dist = Math.abs(x - centers[i]);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export async function extractPdfToTables(file: File): Promise<string[][][]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const newTables: string[][][] = [];

  for (let pg = 1; pg <= pdf.numPages; pg++) {
    const page = await pdf.getPage(pg);
    const tc = await page.getTextContent();
    const vp = page.getViewport({ scale: 1 });
    const pgH = vp.height;

    const items: Array<{ x: number; y: number; w: number; h: number; text: string }> = [];

    tc.items.forEach((it: any) => {
      const str = (it.str || '').trim();
      if (!str) return;
      items.push({
        x: Math.round(it.transform[4] * 10) / 10,
        y: Math.round((pgH - it.transform[5]) * 10) / 10,
        w: Math.abs(it.width),
        h: Math.abs(it.height) || 10,
        text: str,
      });
    });

    if (!items.length) {
      continue;
    }

    const avgCharWidth = (() => {
      const samples = items.filter((i) => i.text.length > 0 && i.w > 0).slice(0, 200);
      if (!samples.length) return 6;
      const widths = samples.map((i) => i.w / Math.max(i.text.length, 1));
      widths.sort((a, b) => a - b);
      return widths[Math.floor(widths.length / 2)] || 6;
    })();

    const rowTolerance = Math.max(
      3,
      Math.round((items.reduce((s, i) => s + i.h, 0) / items.length) * 0.6)
    );

    const rowMap = new Map<number, any[]>();
    items.forEach((it) => {
      let foundKey: number | null = null;
      for (const [ky] of rowMap) {
        if (Math.abs(ky - it.y) <= rowTolerance) {
          foundKey = ky;
          break;
        }
      }
      const key = foundKey ?? it.y;
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key)!.push(it);
    });

    const sortedRows = [...rowMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, cells]) => cells.sort((a, b) => a.x - b.x));

    const gapThreshold = Math.max(10, avgCharWidth * 2.2);
    const rowCells = sortedRows.map((row) => {
      const cells: { x: number; w: number; text: string }[] = [];
      let current = row[0];
      let cellText = current.text;
      let cellStart = current.x;
      let cellEnd = current.x + current.w;

      for (let i = 1; i < row.length; i++) {
        const it = row[i];
        const gap = it.x - cellEnd;
        if (gap > gapThreshold) {
          cells.push({ x: cellStart, w: cellEnd - cellStart, text: cellText });
          cellText = it.text;
          cellStart = it.x;
          cellEnd = it.x + it.w;
        } else {
          cellText += ' ' + it.text;
          cellEnd = Math.max(cellEnd, it.x + it.w);
        }
      }
      cells.push({ x: cellStart, w: cellEnd - cellStart, text: cellText });
      return cells;
    });

    const allX = rowCells.flatMap((r) => r.map((c) => c.x));
    const colCenters = clusterPositions(allX, Math.max(12, avgCharWidth * 2.6));

    const tableData = rowCells
      .map((row) => {
        const rowOut = new Array(Math.max(colCenters.length, 1)).fill('');
        row.forEach((cell) => {
          const colIdx = findNearestColumn(cell.x, colCenters);
          rowOut[colIdx] = rowOut[colIdx] ? rowOut[colIdx] + ' ' + cell.text : cell.text;
        });
        return rowOut;
      })
      .filter((r) => r.some((c) => c.trim()));

    if (!tableData.length) {
      const fallback = sortedRows.map((row) => [row.map((c) => c.text).join(' ')]);
      newTables.push(fallback);
    } else {
      newTables.push(tableData);
    }
  }

  return newTables;
}

export function mergeTablesIntoOneSheet(extractedTables: string[][][]): string[][] {
  const mergedRows: string[][] = [];
  extractedTables.forEach((table) => {
    if (!table.length) return;
    const tableRows: string[][] = [];
    table.forEach((row) => {
      if (row.some((cell) => (cell || '').trim())) {
        tableRows.push(row);
      }
    });
    if (!tableRows.length) return;
    if (mergedRows.length) {
      const widestRow = Math.max(
        ...mergedRows.map((row) => row.length),
        ...tableRows.map((row) => row.length),
        1
      );
      mergedRows.push(new Array(widestRow).fill(''));
    }
    mergedRows.push(...tableRows);
  });
  return mergedRows;
}

export function downloadTablesAsExcel(tables: string[][][], filename = 'pdf-to-excel.xlsx') {
  const mergedRows = mergeTablesIntoOneSheet(tables);
  if (!mergedRows.length) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(mergedRows);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  ws['!cols'] = Array.from({ length: range.e.c + 1 }, (_, colIndex) => {
    const maxWidth = mergedRows.reduce((max, row) => {
      const value = row[colIndex] || '';
      return Math.max(max, value.length);
    }, 8);
    return { wch: Math.min(Math.max(maxWidth + 2, 10), 60) };
  });
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
}
