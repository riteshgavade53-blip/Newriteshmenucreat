import React from 'react';
import {
  UtensilsCrossed,
  FileSpreadsheet,
  Key,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Sparkles,
  ExternalLink,
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
          {/* Brand & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md transition-all ${
              activeTab === 'pos-menu'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/15'
                : 'bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-indigo-500/15'
            }`}>
              {activeTab === 'pos-menu' ? (
                <UtensilsCrossed className="w-5 h-5" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activeTab === 'pos-menu' ? 'Menu File Extractor' : 'PDF to Excel Converter'}
                </h1>
                <span className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                  activeTab === 'pos-menu'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  <FileSpreadsheet className="w-3 h-3" />
                  {activeTab === 'pos-menu' ? '11-Column POS Format' : 'Universal XLSX Tables'}
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
                {activeTab === 'pos-menu'
                  ? 'Extract dishes, variations & prices into POS Excel format'
                  : 'Convert PDF tables, invoices & reports to editable Excel sheets'}
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

            {/* Tab 2: Pdf to Excel (Direct Open https://newriteshpdttoexcel.vercel.app/) */}
            <a
              href="https://newriteshpdttoexcel.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSelectTab('pdf-to-excel')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf-to-excel'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-400/40 scale-102'
                  : 'text-indigo-950 bg-indigo-100 hover:bg-indigo-200/80 border border-indigo-200 hover:scale-102 shadow-xs'
              }`}
              title="Click to open https://newriteshpdttoexcel.vercel.app/"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pdf to Excel</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                New
              </span>
              <ExternalLink className="w-3 h-3 text-indigo-500" />
            </a>
          </div>

          {/* Action buttons & Stats Badges */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Visitor Counter Badge */}
            {siteStats && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs font-semibold shadow-2xs"
                title={`Total Visits: ${siteStats.totalVisits} | Unique Visitors: ${siteStats.uniqueVisitors}`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold">{siteStats.totalVisits}</span>
                <span className="hidden sm:inline text-indigo-700 text-[11px]">
                  {siteStats.totalVisits === 1 ? 'Visit' : 'Visits'}
                </span>
              </div>
            )}

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

          <a
            href="https://newriteshpdttoexcel.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSelectTab('pdf-to-excel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pdf-to-excel'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pdf to Excel</span>
            <span className="px-1 py-0.2 rounded-md text-[10px] bg-indigo-600 text-white font-bold animate-pulse">
              New
            </span>
            <ExternalLink className="w-3 h-3 text-indigo-500" />
          </a>
        </div>
      </div>
    </header>
  );
};
