import React from 'react';
import {
  UtensilsCrossed,
  FileSpreadsheet,
  Key,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Users,
  Archive,
} from 'lucide-react';
import { SiteStats } from '../types';

interface HeaderProps {
  hasServerKey: boolean;
  hasUserKey: boolean;
  onOpenApiKeyModal: () => void;
  onOpenVercelModal: () => void;
  siteStats: SiteStats | null;
  savedMenusCount: number;
  onScrollToSavedMenus?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasServerKey,
  hasUserKey,
  onOpenApiKeyModal,
  onOpenVercelModal,
  siteStats,
  savedMenusCount,
  onScrollToSavedMenus,
}) => {
  const isKeyReady = hasServerKey || hasUserKey;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Menu File Extractor
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  Petpooja POS 11-Cols
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Extract items, variations & prices into Petpooja Excel format via Gemini AI
              </p>
            </div>
          </div>

          {/* Action buttons & Stats Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* Saved Menus Count Badge */}
            <button
              onClick={onScrollToSavedMenus}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
              title="View all saved restaurant menus"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">{savedMenusCount}</span>
              <span className="hidden sm:inline text-emerald-800 text-[11px]">Saved</span>
            </button>

            {/* Vercel Deploy Guide */}
            <button
              onClick={onOpenVercelModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200/80"
              title="Vercel deployment instructions"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Deploy to Vercel</span>
              <span className="bg-black text-white text-[10px] px-1.5 py-0.2 rounded font-mono">
                ▲
              </span>
            </button>

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
      </div>
    </header>
  );
};
