import React, { useState, useRef, useMemo } from 'react';
import {
  Table,
  ArrowDownToLine,
  FileSpreadsheet,
  Download,
  Copy,
  Plus,
  Trash2,
  Search,
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  Code2,
  Check,
  Filter,
  Globe,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  extractPdfToTables,
  downloadTablesAsExcel,
  mergeTablesIntoOneSheet,
} from '../utils/pdfExtractor';
import {
  parseTextWithDocExtractor,
  DOC_EXTRACTOR_COLUMNS,
  EXTRACTOR_PYTHON_CODE,
} from '../utils/docExtractor';

interface PdfToExcelViewProps {
  onShowToast: (msg: string) => void;
}

export const PdfToExcelView: React.FC<PdfToExcelViewProps> = ({ onShowToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<string[][][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTableIdx, setActiveTableIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cleanCharsEnabled, setCleanCharsEnabled] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to remove unwanted characters (from CleanExcel module)
  const cleanString = (val: string) => {
    if (!cleanCharsEnabled) return val;
    return val
      .replace(/[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u024F]/g, '')
      .replace(/[^\p{L}\p{N}\s\-_+=,./\\:;<>[\]₹$€]+/gu, '');
  };

  const currentTable = tables[activeTableIdx] || tables[0] || [];

  const headers = useMemo(() => {
    if (!currentTable.length) return [];
    return currentTable[0].map((h, i) => cleanString(h || `Col ${i + 1}`));
  }, [currentTable, cleanCharsEnabled]);

  const rows = useMemo(() => {
    if (currentTable.length <= 1) return [];
    return currentTable.slice(1).map((r) => r.map((c) => cleanString(c ?? '')));
  }, [currentTable, cleanCharsEnabled]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(q)));
  }, [rows, searchQuery]);

  // Main file processing - implements same to same logic as GitHub repo PdfToExcel.tsx
  const handleFile = async (newFile: File | null) => {
    if (!newFile) return;
    const ext = newFile.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.xlsx') && !ext.endsWith('.csv') && !ext.endsWith('.txt')) {
      setError('Please upload a valid PDF or tabular document.');
      return;
    }

    setFile(newFile);
    setTables([]);
    setError(null);
    setIsProcessing(true);
    setProcessingStatus(`Analyzing "${newFile.name}"... Aligning rows and column coordinates`);

    try {
      if (ext.endsWith('.pdf')) {
        // Fast client-side coordinate extraction like repo
        let extracted = await extractPdfToTables(newFile);

        // If client-side couldn't detect text items, fallback to backend AI extraction
        if (!extracted || extracted.length === 0 || !extracted.some((t) => t.length > 0)) {
          setProcessingStatus('Running deep OCR and AI table reconstruction...');
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const commaIdx = res.indexOf(',');
              resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(newFile);
          });

          const resp = await fetch('/api/pdf-to-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: newFile.name,
              mimeType: 'application/pdf',
              fileBase64: base64,
              mode: 'universal-table',
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.sheets && data.sheets.length > 0) {
              extracted = data.sheets.map((sh: any) => [sh.headers, ...sh.rows]);
            }
          }
        }

        if (extracted && extracted.length > 0 && extracted.some((t) => t.length > 0)) {
          setTables(extracted);
          setActiveTableIdx(0);
          onShowToast(`✅ Extracted ${extracted.length} table(s) from ${newFile.name}!`);
        } else {
          throw new Error('No structured tables could be detected in this file.');
        }
      } else if (ext.endsWith('.txt')) {
        // Run docExtractor logic on text
        const textContent = await newFile.text();
        const docRows = parseTextWithDocExtractor(textContent);
        if (docRows.length > 0) {
          const tData = [
            DOC_EXTRACTOR_COLUMNS,
            ...docRows.map((r) => [
              r.Name,
              r.Item_Online_DisplayName,
              r.Variation_Name,
              r.Price,
              r.Category,
              r.Category_Online_DisplayName,
              r.Short_Code,
              r.Short_Code_2,
              r.Description,
              r.Attributes,
              r.Goods_Services,
            ]),
          ];
          setTables([tData]);
          setActiveTableIdx(0);
          onShowToast(`✅ Parsed ${docRows.length} rows using DocExtractor rules!`);
        } else {
          throw new Error('No items or prices could be matched in this text file.');
        }
      } else {
        // Excel/CSV direct reader
        const buffer = await newFile.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const allTbls: string[][][] = [];
        wb.SheetNames.forEach((sName) => {
          const ws = wb.Sheets[sName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
          if (rawRows.length > 0) allTbls.push(rawRows);
        });
        if (allTbls.length > 0) {
          setTables(allTbls);
          setActiveTableIdx(0);
          onShowToast(`✅ Loaded ${allTbls.length} sheet(s) successfully!`);
        }
      }
    } catch (err: any) {
      console.error('PDF to Excel extraction error:', err);
      setError(err?.message || 'Failed to extract tables from document.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Convert and download Excel (same as GitHub repo)
  const handleConvertToExcel = () => {
    if (!tables.length) return;
    const safeName = (file?.name || 'pdf-to-excel').replace(/\.[^/.]+$/, '');
    downloadTablesAsExcel(tables, `${safeName}.xlsx`);
    onShowToast(`📥 Downloaded ${safeName}.xlsx successfully!`);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!currentTable.length) return;
    const aoa = currentTable.map((row) => row.map((c) => cleanString(c ?? '')));
    const csvContent = aoa
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^/.]+$/, '') || 'table'}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('📥 CSV file exported successfully!');
  };

  // Copy TSV for Excel paste
  const handleCopyTsv = () => {
    if (!currentTable.length) return;
    const aoa = currentTable.map((row) => row.map((c) => cleanString(c ?? '')));
    const tsv = aoa.map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv);
    onShowToast('📋 Table copied to clipboard (ready to paste directly into Excel)!');
  };

  // Cell editing
  const handleCellChange = (rowIndex: number, colIndex: number, newVal: string) => {
    setTables((prev) => {
      const next = [...prev];
      const targetTable = next[activeTableIdx].map((r) => [...r]);
      // rowIndex corresponds to row in rows (i.e. targetTable[rowIndex + 1])
      if (targetTable[rowIndex + 1]) {
        targetTable[rowIndex + 1][colIndex] = newVal;
        next[activeTableIdx] = targetTable;
      }
      return next;
    });
  };

  // Header editing
  const handleHeaderChange = (colIndex: number, newHeader: string) => {
    setTables((prev) => {
      const next = [...prev];
      const targetTable = next[activeTableIdx].map((r) => [...r]);
      if (targetTable[0]) {
        targetTable[0][colIndex] = newHeader;
        next[activeTableIdx] = targetTable;
      }
      return next;
    });
  };

  // Add row
  const handleAddRow = () => {
    setTables((prev) => {
      const next = [...prev];
      const targetTable = next[activeTableIdx].map((r) => [...r]);
      const colCount = targetTable[0] ? targetTable[0].length : 5;
      targetTable.push(new Array(colCount).fill(''));
      next[activeTableIdx] = targetTable;
      return next;
    });
  };

  // Delete row
  const handleDeleteRow = (rowIndex: number) => {
    setTables((prev) => {
      const next = [...prev];
      const targetTable = next[activeTableIdx].filter((_, idx) => idx !== rowIndex + 1);
      next[activeTableIdx] = targetTable;
      return next;
    });
  };

  // Load sample data for immediate test
  const handleLoadSample = () => {
    const sampleTable = [
      DOC_EXTRACTOR_COLUMNS,
      ['Classic T-Shirt', 'Classic T-Shirt', '', '0', 'Apparel', 'Clothing', 'TS-001', '', 'Base product for variations', '', 'Goods'],
      ['Classic T-Shirt', 'Classic T-Shirt', 'Small', '15.00', 'Apparel', 'Clothing', 'TS-001-S', '', 'Small size variation', 'Size: Small', 'Goods'],
      ['Classic T-Shirt', 'Classic T-Shirt', 'Large', '18.00', 'Apparel', 'Clothing', 'TS-001-L', '', 'Large size variation', 'Size: Large', 'Goods'],
      ['Consultation Fee', 'Consultation Fee', '', '150.00', 'Services', 'Professional', '', '', 'One hour consultation', '', 'Services'],
      ['Custom Embroidery', 'Custom Embroidery', '', '25.00', 'Services', 'Addon', '', '', 'Personalized logo embroidery', '', 'Services'],
    ];
    setTables([sampleTable]);
    setActiveTableIdx(0);
    setFile(new File([''], 'sample_document.pdf'));
    onShowToast('📋 Sample 11-column table loaded!');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-slate-200 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Glow effects matching original repo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      <div className="w-full max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Live Website & Conversion Engine
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              newriteshpdttoexcel.vercel.app
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Open Website Button */}
            <a
              href="https://newriteshpdttoexcel.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Website Directly</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Clean Excel toggle */}
            <button
              onClick={() => {
                setCleanCharsEnabled(!cleanCharsEnabled);
                onShowToast(
                  !cleanCharsEnabled
                    ? '✨ Clean Excel mode ON (Special characters & invalid glyphs filtered)'
                    : 'Clean Excel mode OFF'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                cleanCharsEnabled
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Filter non-standard characters and Chinese symbols (from CleanExcel)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Chars {cleanCharsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* View Python Code */}
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Python Code</span>
            </button>
          </div>
        </div>

        {/* Direct Link Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  PDF to Excel Converter Website
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target URL:{' '}
                <a
                  href="https://newriteshpdttoexcel.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline font-mono"
                >
                  https://newriteshpdttoexcel.vercel.app/
                </a>
              </p>
            </div>
          </div>
          <a
            href="https://newriteshpdttoexcel.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
          >
            <span>Open Website Directly</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Collapsible Python Code Drawer */}
        {showCode && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  extractor.py (DocExtractor 11-Column Parser)
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(EXTRACTOR_PYTHON_CODE);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                  onShowToast('📋 Python code copied to clipboard!');
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl text-slate-300 text-[11px] font-mono max-h-60 overflow-y-auto border border-slate-800 scrollbar-thin">
              <code>{EXTRACTOR_PYTHON_CODE}</code>
            </pre>
          </div>
        )}

        {/* Central Hero Conversion Card (Exact same layout & styling as GitHub repo PdfToExcel.tsx) */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-3 tracking-tight">
              Convert PDF to Excel
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
              Extract tables and data from your PDF documents into editable Excel spreadsheets instantly.
            </p>
          </div>

          {!file ? (
            /* Upload State */
            <div
              className={`border-4 border-dashed rounded-2xl p-10 sm:p-16 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                  : 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files[0] || null);
              }}
            >
              <Table className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-5 text-emerald-500/50" />
              <div className="text-xl sm:text-2xl font-bold text-slate-200 mb-2">
                Drag & Drop your PDF here
              </div>
              <div className="text-slate-500 text-xs sm:text-sm mb-6">
                or click to browse files
              </div>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full transition-colors cursor-pointer shadow-lg shadow-emerald-600/20 text-xs sm:text-sm active:scale-95"
              >
                Select PDF File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>Supports: PDF, Scanned Tables, Rate Cards, Menus</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                >
                  Load Sample
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            /* Processing State */
            <div className="border-2 border-slate-800 rounded-2xl p-12 sm:p-16 text-center bg-slate-900/50">
              <div className="animate-spin rounded-full h-14 sm:h-16 w-14 sm:w-16 border-b-4 border-emerald-500 mx-auto mb-6"></div>
              <div className="text-lg sm:text-xl font-bold text-slate-200 mb-2">
                Converting your file...
              </div>
              <div className="text-slate-500 text-xs sm:text-sm">
                {processingStatus || 'Please wait while we extract the tables.'}
              </div>
            </div>
          ) : (
            /* Complete State */
            <div className="border-2 border-emerald-500/30 rounded-2xl p-8 sm:p-12 text-center bg-emerald-500/5">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowDownToLine className="w-8 sm:w-10 h-8 sm:h-10 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-200 mb-2">
                Conversion Complete!
              </div>
              <div className="text-slate-400 text-xs sm:text-sm mb-8">
                {tables.filter((t) => t.length > 0).length} table(s) extracted successfully from{' '}
                <span className="text-emerald-300 font-semibold">{file.name}</span>.
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleConvertToExcel}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer text-xs sm:text-sm"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setTables([]);
                    setError(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-8 rounded-full transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  Convert Another
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Table Preview & Editor (When tables exist) */}
        {tables.length > 0 && currentTable.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Live Table Preview & Editor
                  </h3>
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {rows.length} Rows
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    {headers.length} Columns
                  </span>
                </div>

                {/* Multiple Tables Tabs */}
                {tables.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {tables.map((tbl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTableIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeTableIdx === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Table {idx + 1} ({tbl.length - 1} rows)
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search table..."
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-36 sm:w-44"
                  />
                </div>

                {/* Add Row */}
                <button
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Row</span>
                </button>

                {/* Copy TSV */}
                <button
                  onClick={handleCopyTsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy formatted for Excel"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </button>

                {/* CSV */}
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>CSV</span>
                </button>

                {/* Download Excel */}
                <button
                  onClick={handleConvertToExcel}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 text-slate-300 font-bold sticky top-0 z-10">
                  <tr className="border-b border-slate-800 divide-x divide-slate-800/60">
                    <th className="p-2.5 w-10 text-center text-slate-500">#</th>
                    {headers.map((hdr, colIdx) => (
                      <th key={colIdx} className="p-2 min-w-[130px]">
                        <input
                          type="text"
                          value={hdr}
                          onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                          className="w-full bg-transparent font-bold text-emerald-400 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5"
                        />
                      </th>
                    ))}
                    <th className="p-2.5 w-12 text-center text-slate-500">Del</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/50 bg-slate-900/60">
                  {filteredRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-800/40 transition-colors divide-x divide-slate-800/40"
                    >
                      <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                        {rowIdx + 1}
                      </td>
                      {headers.map((_, colIdx) => (
                        <td key={colIdx} className="p-1.5">
                          <input
                            type="text"
                            value={row[colIdx] ?? ''}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                            className="w-full bg-transparent focus:bg-slate-950 focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-200"
                          />
                        </td>
                      ))}
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => handleDeleteRow(rowIdx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={headers.length + 2}
                        className="p-8 text-center text-slate-500 text-xs"
                      >
                        No matching rows for "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <span className="text-[11px]">
                Showing {filteredRows.length} of {rows.length} rows • Click any cell or header to edit inline
              </span>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400/80">
                <Check className="w-3 h-3" />
                <span>Ready for Excel, Google Sheets, & Petpooja POS</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
