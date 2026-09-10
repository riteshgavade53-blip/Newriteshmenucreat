import React, { useState } from 'react';
import {
  Archive,
  Calendar,
  FileSpreadsheet,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Check,
  FileText,
  FileImage,
  File,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SavedMenu, MenuItemRow } from '../types';
import { exportSavedMenuToExcel } from '../utils/savedMenusManager';

interface SavedMenusSectionProps {
  savedMenus: SavedMenu[];
  onLoadMenu: (menu: SavedMenu) => void;
  onDeleteMenu: (id: string) => void;
  onSaveCurrentMenu: () => void;
  hasActiveRows: boolean;
  activeRestaurantName: string;
}

export const SavedMenusSection: React.FC<SavedMenusSectionProps> = ({
  savedMenus,
  onLoadMenu,
  onDeleteMenu,
  onSaveCurrentMenu,
  hasActiveRows,
  activeRestaurantName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMenus = savedMenus.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.restaurantName.toLowerCase().includes(q) ||
      (m.sourceFileName && m.sourceFileName.toLowerCase().includes(q)) ||
      m.rows.some((r) => r.Name.toLowerCase().includes(q) || r.Category.toLowerCase().includes(q))
    );
  });

  const getSourceIcon = (type: SavedMenu['sourceType']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      case 'image':
        return <FileImage className="w-3.5 h-3.5 text-blue-600" />;
      case 'word':
        return <File className="w-3.5 h-3.5 text-indigo-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
      case 'text':
        return <ClipboardList className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-emerald-50/20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Saved Menus & History (मेरे बनाए हुए मेनू)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {savedMenus.length} {savedMenus.length === 1 ? 'Menu' : 'Menus'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aapke dwara banaye gaye sabhi restaurant menus yahan saved hain. Kabhi bhi dobara open ya download karein.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {hasActiveRows && (
            <button
              onClick={onSaveCurrentMenu}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all shrink-0"
              title="Save current active table menu to history"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save Current Menu</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Search bar & filter if there are items */}
          {savedMenus.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant name, dish..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div className="text-xs text-slate-500 self-end sm:self-center">
                Showing {filteredMenus.length} of {savedMenus.length} saved records
              </div>
            </div>
          )}

          {/* Menus Grid / List */}
          {savedMenus.length === 0 ? (
            <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Abhi tak koi menu save nahi hua hai</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Upar kisi bhi PDF, Image, Word ya Excel file ko upload karein. Gemini dwara extract hone ke baad wo automatic yahan save ho jayega!
              </p>
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No saved menus matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMenus.map((menu) => {
                return (
                  <div
                    key={menu.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top badge and action */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {getSourceIcon(menu.sourceType)}
                          <span className="capitalize">{menu.sourceType}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(menu.createdAt)}
                        </span>
                      </div>

                      {/* Restaurant Title */}
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
                        {menu.restaurantName}
                      </h3>

                      {/* Source file name if present */}
                      {menu.sourceFileName && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 font-mono">
                          📁 {menu.sourceFileName}
                        </p>
                      )}

                      {/* Stats chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {menu.itemCount} Items
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                          {menu.categoryCount} Categories
                        </span>
                        {menu.outputLanguage && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            menu.outputLanguage === 'hindi'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : menu.outputLanguage === 'marathi'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : menu.outputLanguage === 'gujarati'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : menu.outputLanguage === 'hinglish'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {menu.outputLanguage === 'hindi' ? '🇮🇳 हिंदी' :
                             menu.outputLanguage === 'marathi' ? '🚩 मराठी' :
                             menu.outputLanguage === 'gujarati' ? '🌾 ગુજરાતી' :
                             menu.outputLanguage === 'hinglish' ? '💬 Hinglish' : '🇬🇧 English'}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono ml-auto">
                          {menu.currency}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                      <button
                        onClick={() => onLoadMenu(menu)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/80"
                        title="Load this menu into active table"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open & Edit</span>
                      </button>

                      <button
                        onClick={() => exportSavedMenuToExcel(menu)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                        title="Download Petpooja Excel (.xlsx)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete "${menu.restaurantName}" from saved history?`
                            )
                          ) {
                            onDeleteMenu(menu.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete saved menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
