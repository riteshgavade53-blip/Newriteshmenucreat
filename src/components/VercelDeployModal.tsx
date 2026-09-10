import React, { useState } from 'react';
import { Cloud, Check, Copy, ExternalLink, X, Terminal, FolderGit2, Sparkles, AlertCircle } from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg shadow-sm">
              ▲
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Deploy to Vercel (Live Website)
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full">
                  100% Vercel Ready
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Aapke GitHub repo se Vercel par live karne ka aasaan tareeka
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-600 max-h-[75vh] overflow-y-auto">
          {/* Quick Notice */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-semibold text-emerald-900">
                Pehle GitHub repo me `src/` folder missing tha!
              </p>
              <p className="text-emerald-800">
                Hamne pura production-ready frontend code, Vite setup, 11-column Petpooja Excel extractor, aur <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">vercel.json</code> build config banake ready kar diya hai.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
              Deployment Steps (Sirf 3 Steps)
            </h4>

            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    GitHub Repo me Code Push / Update karein
                  </span>
                </div>
                <FolderGit2 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600">
                AI Studio ke top-right <strong>Settings / Export</strong> menu se <strong>Export to GitHub</strong> ya <strong>Download ZIP</strong> karke apne GitHub repo (<code className="font-mono bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">riteshgavade53-blip/Riteshnewmenucreat</code>) me commit karein.
              </p>
              <div className="bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-xs flex items-center justify-between">
                <span>git add . && git commit -m "Add full menu extractor app" && git push</span>
                <button
                  onClick={() => copyText('git add . && git commit -m "Add full menu extractor app" && git push origin main', 'cmd1')}
                  className="text-slate-400 hover:text-white ml-2 p-1"
                  title="Copy command"
                >
                  {copiedStep === 'cmd1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    Vercel Dashboard par Import karein
                  </span>
                </div>
                <Cloud className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600">
                1. <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold underline inline-flex items-center gap-0.5">vercel.com/new <ExternalLink className="w-3 h-3" /></a> par jayein.<br />
                2. Apna GitHub repository <strong>Riteshnewmenucreat</strong> select karke <strong>Import</strong> par click karein.<br />
                3. Framework preset auto-detected rahega: <strong>Vite</strong>.<br />
                4. <strong>vercel.json</strong> pehle se project me include hai:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400">Build Command:</span>
                  <p className="text-slate-800 font-semibold">npm run build</p>
                </div>
                <div>
                  <span className="text-slate-400">Output Directory:</span>
                  <p className="text-slate-800 font-semibold">dist</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    Gemini AI Key (Kaise Kaam Karega?)
                  </span>
                </div>
                <Terminal className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600">
                Vercel par live hone ke baad:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 ml-1">
                <li>
                  Aap ya koi bhi user website ke top header me <strong>API Key</strong> button par click karke apni free Google Gemini key daal sakte hain (localStorage me safe save rehti hai).
                </li>
                <li>
                  Ya fir Vercel Project Settings &gt; Environment Variables me <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">GEMINI_API_KEY</code> add kar sakte hain.
                </li>
              </ul>
            </div>
          </div>

          {/* Direct Vercel Button */}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Sabhi files (<code className="font-mono text-slate-700">src/</code>, <code className="font-mono text-slate-700">package.json</code>, <code className="font-mono text-slate-700">vercel.json</code>) ready hain.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                Go to Vercel <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
