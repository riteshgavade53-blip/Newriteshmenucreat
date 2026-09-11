import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Plus,
  Trash2,
  CopyPlus,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Languages,
  Loader2,
  Leaf,
  Drumstick,
  Egg as EggIcon,
} from 'lucide-react';
import { MenuItemRow, DietaryType, MenuOutputLanguage, SUPPORTED_LANGUAGES } from '../types';
import { exportToExcel, exportToCsv, copyToClipboardTsv, POS_COLUMNS } from '../utils/exportUtils';
import { normalizeDietary, getDietaryCounts } from '../utils/dietaryUtils';
import { countOrphanVariations } from '../utils/shortCodeUtils';

interface MenuTableProps {
  rows: MenuItemRow[];
  onUpdateRow: (id: string, updatedRow: Partial<MenuItemRow>) => void;
  onDeleteRow: (id: string) => void;
  onDuplicateRow: (id: string) => void;
  onAddRow: () => void;
  onClearRows: () => void;
  onRegenerateShortCodes?: () => void;
  restaurantName?: string;
  currentLanguage?: MenuOutputLanguage;
  onTranslateLanguage?: (targetLang: MenuOutputLanguage) => Promise<void>;
  isTranslating?: boolean;
}

export const MenuTable: React.FC<MenuTableProps> = ({
  rows,
  onUpdateRow,
  onDeleteRow,
  onDuplicateRow,
  onAddRow,
  onClearRows,
  onRegenerateShortCodes,
  restaurantName,
  currentLanguage = 'english',
  onTranslateLanguage,
  isTranslating = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryType>('All');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof MenuItemRow } | null>(null);

  // Available unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(rows.map((r) => r.Category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [rows]);

  // Dietary counts for quick badges
  const dietaryCounts = useMemo(() => getDietaryCounts(rows), [rows]);

  // Count orphan variations (items with variation label but no parent item)
  const orphanVariationCount = useMemo(() => countOrphanVariations(rows), [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (row.Name || '').toLowerCase().includes(q) ||
          (row.Category || '').toLowerCase().includes(q) ||
          (row.Variation_Name || '').toLowerCase().includes(q) ||
          (row.Short_Code || '').toLowerCase().includes(q) ||
          (row.Description || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && row.Category !== selectedCategory) {
        return false;
      }

      // Dietary filter (strictly normalized into 'Veg' | 'Non-Veg' | 'Egg')
      if (dietaryFilter !== 'All') {
        const tag =
          row.Attributes === 'Veg' || row.Attributes === 'Non-Veg' || row.Attributes === 'Egg'
            ? row.Attributes
            : normalizeDietary(
                row.Attributes,
                row.Name,
                row.Category,
                row.Description,
                row.Variation_Name
              );
        if (tag !== dietaryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [rows, searchQuery, selectedCategory, dietaryFilter]);

  const handleCopyClipboard = async () => {
    const ok = await copyToClipboardTsv(rows);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 1800);
    }
  };

  const handleCellChange = (id: string, field: keyof MenuItemRow, value: string) => {
    if (field === 'Name') {
      onUpdateRow(id, { Name: value, Item_Online_DisplayName: value });
    } else {
      onUpdateRow(id, { [field]: value });
    }
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5 shadow-2xs">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          No Menu Extracted Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Upload your restaurant menu in <strong>PDF, Multiple Images (JPG/PNG), Word (.docx), or Excel (.xlsx/.csv)</strong> format above, or paste menu text to instantly generate the standard 11-column POS table.
        </p>
        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Blank Row Manually</span>
        </button>
      </div>
    );
  }

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Multilingual Output & Conversion Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Output Language:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
              <span>{currentLangConfig.flag}</span>
              <span>{currentLangConfig.label}</span>
              {currentLangConfig.nativeLabel !== currentLangConfig.label && (
                <span className="text-emerald-400 font-normal text-[11px]">
                  ({currentLangConfig.nativeLabel})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Translation Switch Buttons */}
        {onTranslateLanguage && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">
              Translate Menu To:
            </span>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  disabled={isTranslating || isActive}
                  onClick={() => onTranslateLanguage(lang.code)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-2xs cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 disabled:opacity-50'
                  }`}
                  title={isActive ? `Currently in ${lang.label}` : `Translate all dishes and categories to ${lang.label} (${lang.nativeLabel})`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {isActive && <Check className="w-3 h-3 text-slate-950 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Translating Indicator */}
      {isTranslating && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-900 font-medium">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span>Gemini AI is translating dishes, categories, and descriptions... Excel/CSV downloads will instantly update!</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish, category, SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Buttons (Veg, Non-Veg, Egg) */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDietaryFilter('All')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                dietaryFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1 rounded ${dietaryFilter === 'All' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                {dietaryCounts.all}
              </span>
            </button>

            <button
              onClick={() => setDietaryFilter('Veg')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                dietaryFilter === 'Veg'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Veg</span>
              <span className={`text-[10px] px-1 rounded ${dietaryFilter === 'Veg' ? 'bg-emerald-700 text-white' : 'bg-emerald-100/70 text-emerald-800 font-bold'}`}>
                {dietaryCounts.veg}
              </span>
            </button>

            <button
              onClick={() => setDietaryFilter('Non-Veg')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                dietaryFilter === 'Non-Veg'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Drumstick className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Non-Veg</span>
              <span className={`text-[10px] px-1 rounded ${dietaryFilter === 'Non-Veg' ? 'bg-rose-700 text-white' : 'bg-rose-100/70 text-rose-800 font-bold'}`}>
                {dietaryCounts.nonVeg}
              </span>
            </button>

            <button
              onClick={() => setDietaryFilter('Egg')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                dietaryFilter === 'Egg'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <EggIcon className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Egg</span>
              <span className={`text-[10px] px-1 rounded ${dietaryFilter === 'Egg' ? 'bg-amber-700 text-white' : 'bg-amber-100/70 text-amber-800 font-bold'}`}>
                {dietaryCounts.egg}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden xl:inline">
            Showing {filteredRows.length} of {rows.length} rows
          </span>
        </div>

        {/* Right: Export & Table Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRegenerateShortCodes && (
            <button
              onClick={onRegenerateShortCodes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg transition-colors border border-amber-200 shadow-2xs"
              title="Recalculate all Short Codes into standard Alphabetic format (e.g. Hyderabadi Chicken Dum Biryani -> HCD, variations -> HCD1, HCD2, CSK)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Auto Short Codes</span>
            </button>
          )}

          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            title="Add a manual blank row"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            title="Copy as TSV to paste directly into Excel or Google Sheets"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy TSV</span>
              </>
            )}
          </button>

          <button
            onClick={() => exportToCsv(rows, restaurantName ? `${restaurantName}_POS_Menu` : 'POS_Menu')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            title="Download CSV file"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportToExcel(rows, restaurantName ? `${restaurantName}_POS_Menu` : 'POS_Menu')}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            title="Download POS compatible Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download POS Excel (.xlsx)</span>
          </button>

          <button
            onClick={onClearRows}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear and extract new menu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* POS Rule Notice Bar */}
      <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded">
            POS Rule
          </span>
          <span>
            Parent dishes have <strong>Price = 0</strong> (e.g. Short_Code: <strong>HCD</strong>), followed by variations (e.g. <strong>HCD1, HCD2</strong>, or <strong>CSK</strong> for single items).
          </span>
        </div>
        <span className="text-emerald-700 italic hidden md:inline">
          Tip: Click any cell to edit values inline, or click "Auto Short Codes" to refresh SKU codes.
        </span>
      </div>

      {/* Orphan Variations Alert & Quick Fix */}
      {orphanVariationCount > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{orphanVariationCount} item(s)</strong> have variations without a parent dish (e.g. Sprite 200ml). In POS, single items should be written as <strong>Name (200ml)</strong> with blank variation.
            </span>
          </div>
          {onRegenerateShortCodes && (
            <button
              onClick={onRegenerateShortCodes}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs text-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Merge Variations into Name ( )</span>
            </button>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header */}
          <thead className="bg-slate-100/90 text-slate-700 font-semibold sticky top-0 z-10 shadow-2xs">
            <tr className="border-b border-slate-200 divide-x divide-slate-200/70">
              <th className="p-2.5 w-10 text-center text-slate-400">#</th>
              <th className="p-2.5 min-w-[170px]">1. Name</th>
              <th className="p-2.5 min-w-[170px]">2. Item_Online_DisplayName</th>
              <th className="p-2.5 min-w-[110px]">3. Variation_Name</th>
              <th className="p-2.5 min-w-[90px]">4. Price</th>
              <th className="p-2.5 min-w-[130px]">5. Category</th>
              <th className="p-2.5 min-w-[130px]">6. Category_Online_DisplayName</th>
              <th className="p-2.5 min-w-[110px]">
                <div className="flex items-center justify-between">
                  <span>7. Short_Code</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">POS</span>
                </div>
              </th>
              <th className="p-2.5 min-w-[100px]">8. Short_Code_2</th>
              <th className="p-2.5 min-w-[200px]">9. Description</th>
              <th className="p-2.5 min-w-[100px]">10. Attributes</th>
              <th className="p-2.5 min-w-[90px]">11. Goods_Services</th>
              <th className="p-2.5 w-16 text-center">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {filteredRows.map((row, idx) => {
              const isParent = row.isParent || (String(row.Price) === '0' && (!row.Variation_Name || row.Variation_Name === ''));
              const isVariation = row.isVariation !== undefined ? row.isVariation : Boolean(row.Variation_Name && row.Variation_Name.trim() !== '');
              const dietaryTag =
                row.Attributes === 'Veg' || row.Attributes === 'Non-Veg' || row.Attributes === 'Egg'
                  ? row.Attributes
                  : normalizeDietary(row.Attributes, row.Name, row.Category, row.Description, row.Variation_Name);
              const isVeg = dietaryTag === 'Veg';
              const isNonVeg = dietaryTag === 'Non-Veg';
              const isEgg = dietaryTag === 'Egg';

              return (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/80 transition-colors divide-x divide-slate-200/50 ${
                    isParent
                      ? 'bg-emerald-50/30 font-medium'
                      : isVariation
                      ? 'bg-amber-50/15'
                      : ''
                  }`}
                >
                  {/* Row # */}
                  <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* 1. Name */}
                  <td className="p-2 font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {isVariation && (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                      )}
                      <input
                        type="text"
                        value={row.Name}
                        onChange={(e) => handleCellChange(row.id, 'Name', e.target.value)}
                        className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-900 font-semibold"
                      />
                      {isParent && (
                        <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">
                          Parent
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Item_Online_DisplayName */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.Item_Online_DisplayName}
                      onChange={(e) => handleCellChange(row.id, 'Item_Online_DisplayName', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-700"
                    />
                  </td>

                  {/* 3. Variation_Name */}
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={row.Variation_Name}
                        onChange={(e) => handleCellChange(row.id, 'Variation_Name', e.target.value)}
                        placeholder="—"
                        className={`w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs ${
                          row.Variation_Name
                            ? 'text-amber-800 font-bold bg-amber-50/70'
                            : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </td>

                  {/* 4. Price */}
                  <td className="p-2 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[11px]">₹</span>
                      <input
                        type="text"
                        value={String(row.Price)}
                        onChange={(e) => handleCellChange(row.id, 'Price', e.target.value)}
                        className={`w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs font-bold ${
                          isParent ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      />
                    </div>
                  </td>

                  {/* 5. Category */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.Category}
                      onChange={(e) => handleCellChange(row.id, 'Category', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs font-medium text-purple-900"
                    />
                  </td>

                  {/* 6. Category_Online_DisplayName */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.Category_Online_DisplayName}
                      onChange={(e) => handleCellChange(row.id, 'Category_Online_DisplayName', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-600"
                    />
                  </td>

                  {/* 7. Short_Code */}
                  <td className="p-2 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.Short_Code}
                      onChange={(e) => handleCellChange(row.id, 'Short_Code', e.target.value)}
                      placeholder="SKU"
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-700 uppercase"
                    />
                  </td>

                  {/* 8. Short_Code_2 */}
                  <td className="p-2 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.Short_Code_2}
                      onChange={(e) => handleCellChange(row.id, 'Short_Code_2', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-400"
                    />
                  </td>

                  {/* 9. Description */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.Description}
                      onChange={(e) => handleCellChange(row.id, 'Description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-600"
                    />
                  </td>

                  {/* 10. Attributes (Veg / Non-Veg / Egg) */}
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                          isVeg
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isNonVeg
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {isVeg && <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />}
                        {isNonVeg && <Drumstick className="w-3 h-3 text-rose-600 shrink-0" />}
                        {isEgg && <EggIcon className="w-3 h-3 text-amber-600 shrink-0" />}
                        <select
                          value={dietaryTag}
                          onChange={(e) => handleCellChange(row.id, 'Attributes', e.target.value)}
                          className="bg-transparent font-bold text-[11px] cursor-pointer focus:outline-none pr-1"
                          title="Click to toggle Veg / Non-Veg / Egg"
                        >
                          <option value="Veg" className="text-emerald-700 font-semibold bg-white">Veg</option>
                          <option value="Non-Veg" className="text-rose-700 font-semibold bg-white">Non-Veg</option>
                          <option value="Egg" className="text-amber-700 font-semibold bg-white">Egg</option>
                        </select>
                      </div>
                    </div>
                  </td>

                  {/* 11. Goods_Services */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.Goods_Services || ''}
                      placeholder="(Blank)"
                      onChange={(e) => handleCellChange(row.id, 'Goods_Services', e.target.value)}
                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-xs text-slate-600 placeholder:text-slate-300 placeholder:italic"
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onDuplicateRow(row.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded transition-colors"
                        title="Duplicate Row"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRow(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer info bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Standard 11-Column Export: Ready for POS Menu Import</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-600 font-semibold">
            {rows.length} Total Records
          </span>
          <button
            onClick={() => exportToExcel(rows, restaurantName ? `${restaurantName}_POS_Menu` : 'POS_Menu')}
            className="text-emerald-700 hover:text-emerald-800 font-bold underline text-xs"
          >
            Export .xlsx now
          </button>
        </div>
      </div>
    </div>
  );
};
