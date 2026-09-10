import React, { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, X, ExternalLink, Shield } from 'lucide-react';
import { getStoredUserApiKey, setStoredUserApiKey } from '../utils/geminiExtractor';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasServerKey: boolean;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  hasServerKey,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredUserApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredUserApiKey(apiKey);
    setSavedSuccess(true);
    onKeySaved();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setStoredUserApiKey('');
    setApiKey('');
    setSavedSuccess(true);
    onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Gemini API Key Settings</h3>
              <p className="text-xs text-slate-400">For Vercel & AI Menu Extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-sm text-slate-600">
          {hasServerKey ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2.5">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-emerald-900">
                  AI Studio Server Key Active
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The environment has a built-in server key. You can use the app without entering a key.
                  If you deploy to Vercel as a static app, you can enter your own key below.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-amber-900">No Server Key Detected</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Enter your Google Gemini API key below to extract restaurant menus.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Stored locally in your browser's localStorage.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Your API key is never shared or saved on any remote database. It is used directly for Gemini 2.5 Flash / 3.x Flash fast menu extraction.
              </span>
            </div>

            {savedSuccess && (
              <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove Key
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
              >
                Save Key
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
