import React, { useState } from 'react';
import {
  FileImage,
  Globe,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Maximize2,
  FileText,
  Image,
  Crop,
  Layers,
  Download,
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

  const handleOpenNewTab = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    onShowToast('🚀 Opening https://newtoolpdfimage.vercel.app/ in new tab!');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 text-slate-200 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Pdf & Image Editor
              </h2>
              <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Live Tool
              </span>
            </div>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-mono mt-0.5"
            >
              <span>{targetUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reload Tool"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Reload</span>
          </button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenNewTab}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/25 active:scale-95 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Website Directly</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Hero Direct Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">
              Direct Web Access: newtoolpdfimage.vercel.app
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Edit PDFs, resize & compress images, crop menu photos, convert documents, and clean spreadsheets in one unified toolkit.
            </p>
          </div>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer shrink-0"
        >
          <span>Open Fullscreen Website</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Embedded Live Tool Iframe */}
      <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
        {/* Iframe Top Browser-like Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="ml-3 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
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
              title="Open full page"
            >
              <span>Full Screen</span>
              <Maximize2 className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-x-0 top-11 bottom-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-xs text-slate-300 font-medium">Loading Pdf & Image Editor...</p>
          </div>
        )}

        {/* Live Iframe */}
        <iframe
          key={iframeKey}
          src={targetUrl}
          title="Pdf & Image Editor"
          className="w-full h-full border-none bg-slate-950"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write; camera; microphone"
        />
      </div>

      {/* Feature Footnote */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 relative z-10">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <span>PDF table extraction, page splitting, merging & rotation</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <Image className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Image compression, cropping, and format conversion</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>100% Client-side privacy & immediate browser processing</span>
        </div>
      </div>
    </div>
  );
};
