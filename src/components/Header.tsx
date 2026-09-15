import React from 'react';
import {
  UtensilsCrossed,
  FileSpreadsheet,
  Key,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ExternalLink,
  FileImage,
} from 'lucide-react';
import { SiteStats, TopTabType } from '../types';

interface HeaderProps {
  hasServerKey: boolean;
  hasUserKey: boolean;
  onOpenApiKeyModal: () => void;
  siteStats: SiteStats | null;
  hasOutput?: boolean;
  itemCount?: number;
  activeTab: TopTabType;
  onSelectTab: (tab: TopTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasServerKey,
  hasUserKey,
  onOpenApiKeyModal,
  siteStats,
  hasOutput = false,
  itemCount = 0,
  activeTab,
  onSelectTab,
}) => {
  const isKeyReady = hasServerKey || hasUserKey;

  return (
    <header className={`sticky top-0 z-30 shadow-xs transition-colors duration-500 ${
      hasOutput && activeTab === 'pos-menu'
        ? 'bg-white/95 backdrop-blur-md border-b-2 border-emerald-400'
        : 'bg-white border-b border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Brand & Title (Always consistent Menu File Extractor) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/15">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Menu File Extractor
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <FileSpreadsheet className="w-3 h-3" />
                  11-Column POS Format
                </span>

                {/* Output Ready Indicator Badge */}
                {hasOutput && activeTab === 'pos-menu' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full animate-pulse shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Ready ({itemCount})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Extract dishes, variations & prices into POS Excel format
              </p>
            </div>
          </div>

          {/* Center 2 Mode Switcher Tabs (Desktop / Tablet) */}
          <div className="hidden md:flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner gap-1.5">
            {/* Tab 1: Menu to POS Excel */}
            <button
              onClick={() => onSelectTab('pos-menu')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pos-menu'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/40 scale-102'
                  : 'text-emerald-950 bg-emerald-100/60 hover:bg-emerald-200/70 border border-emerald-200/80'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu to POS Excel</span>
              {itemCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'pos-menu' ? 'bg-white/25 text-white' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {itemCount}
                </span>
              )}
            </button>

            {/* Tab 2: Pdf to Excel (In-App Tab Switching) */}
            <button
              onClick={() => onSelectTab('pdf-to-excel')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf-to-excel'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-400/40 scale-102'
                  : 'text-indigo-950 bg-indigo-100 hover:bg-indigo-200/80 border border-indigo-200 hover:scale-102 shadow-xs'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pdf to Excel</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === 'pdf-to-excel' ? 'bg-white/25 text-white' : 'bg-indigo-600 text-white'
              }`}>
                Tool
              </span>
            </button>

            {/* Tab 3: Pdf & Image editor (In-App Tab Switching) */}
            <button
              onClick={() => onSelectTab('pdf-image-editor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf-image-editor'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-400/40 scale-102'
                  : 'text-purple-950 bg-purple-100 hover:bg-purple-200/80 border border-purple-200 hover:scale-102 shadow-xs'
              }`}
            >
              <FileImage className="w-3.5 h-3.5 text-purple-600" />
              <span>Pdf & Image editor</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === 'pdf-image-editor' ? 'bg-white/25 text-white' : 'bg-purple-600 text-white'
              }`}>
                Tool
              </span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* API Key Modal Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                isKeyReady
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasUserKey
                  ? 'Custom API Key'
                  : hasServerKey
                  ? 'AI Studio Key Active'
                  : 'Set Gemini Key'}
              </span>
              <span className="sm:hidden">API Key</span>
              {isKeyReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar (Visible on small screens) */}
        <div className="flex md:hidden items-center justify-center pb-2.5 pt-1 gap-2 border-t border-slate-100">
          <button
            onClick={() => onSelectTab('pos-menu')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pos-menu'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu to POS Excel</span>
            {itemCount > 0 && (
              <span className="px-1 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                {itemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('pdf-to-excel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'pdf-to-excel'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
            <span className="truncate">Pdf to Excel</span>
          </button>

          <button
            onClick={() => onSelectTab('pdf-image-editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'pdf-image-editor'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                : 'bg-purple-50 text-purple-900 border border-purple-200'
            }`}
          >
            <FileImage className="w-3 h-3 text-purple-600" />
            <span className="truncate">Pdf & Image</span>
          </button>
        </div>
      </div>
    </header>
  );
};
