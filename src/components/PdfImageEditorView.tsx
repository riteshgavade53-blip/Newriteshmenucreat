import React, { useState } from 'react';
import {
  FileImage,
  Globe,
  RefreshCw,
  Maximize2,
  FileText,
  Image,
  ShieldCheck,
} from 'lucide-react';

interface PdfImageEditorViewProps {
  onShowToast: (msg: string) => void;
}

export const PdfImageEditorView: React.FC<PdfImageEditorViewProps> = ({ onShowToast }) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const targetUrl = 'https://newtoolpdfimage.vercel.app/';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    onShowToast('🔄 Reloading Pdf & Image Editor tool...');
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-[calc(100vh-110px)] bg-slate-950 text-slate-200 p-2 sm:p-3 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-2.5">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800/80 relative z-10 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileImage className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Pdf & Image Editor
            </h2>
            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Tool
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reload Tool"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Tool Iframe - Full Width & Height of Black Area */}
      <div className="w-full flex-1 min-h-[calc(100vh-170px)] h-[85vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative z-10">
        {/* Iframe Top Browser Bar */}
        <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="ml-2 px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-purple-400" />
              <span>https://newtoolpdfimage.vercel.app/</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
              title="Open full page in new tab"
            >
              <span>Full Screen</span>
              <Maximize2 className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-x-0 top-9 bottom-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-xs text-slate-300 font-medium">Loading Pdf & Image Editor...</p>
          </div>
        )}

        {/* Live Iframe - Expanded */}
        <iframe
          key={iframeKey}
          src={targetUrl}
          title="Pdf & Image Editor"
          className="w-full h-full border-none bg-white flex-1"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write; camera; microphone"
        />
      </div>

      {/* Feature Footnote */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 relative z-10 shrink-0">
        <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>PDF table extraction, page splitting & merging</span>
        </div>
        <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <Image className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Image compression, cropping & format conversion</span>
        </div>
        <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>100% Client-side privacy & immediate processing</span>
        </div>
      </div>
    </div>
  );
};
