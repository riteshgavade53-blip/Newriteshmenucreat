import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Loader2,
  AlertCircle,
  File,
  Languages,
  Check,
} from 'lucide-react';
import { detectFileType, SupportedFileType } from '../utils/geminiExtractor';
import { MenuOutputLanguage, SUPPORTED_LANGUAGES } from '../types';

interface UploadZoneProps {
  onExtractFile: (file: File) => void;
  onExtractText: (text: string) => void;
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  selectedLanguage: MenuOutputLanguage;
  onSelectLanguage: (language: MenuOutputLanguage) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onExtractFile,
  onExtractText,
  isLoading,
  loadingStep,
  error,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    onExtractFile(file);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onExtractText(pastedText.trim());
  };

  const getFileBadge = (file: File) => {
    const type: SupportedFileType = detectFileType(file);
    switch (type) {
      case 'pdf':
        return { label: 'PDF Document', color: 'bg-red-50 text-red-700 border-red-200', icon: FileText };
      case 'excel':
        return { label: 'Excel Spreadsheet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet };
      case 'word':
        return { label: 'Word Document', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: File };
      case 'image':
        return { label: 'Menu Image', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileImage };
      default:
        return { label: 'Text File', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileCode };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Multilingual Output Language Selector Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white p-4 sm:px-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Menu Output Language
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  • मेनू आउटपुट भाषा
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Default is <strong>English</strong>. Choose <strong>Hindi (हिंदी)</strong>, <strong>Marathi (मराठी)</strong>, <strong>Gujarati (ગુજરાતી)</strong>, or <strong>Hinglish</strong> if desired.
              </p>
            </div>
          </div>

          {/* 5 Language Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={`${lang.label} - ${lang.description}`}
                >
                  <span className="text-sm leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {lang.nativeLabel !== lang.label && (
                    <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                      ({lang.nativeLabel})
                    </span>
                  )}
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Language indicator */}
        {selectedLanguage !== 'english' && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong>Output Active:</strong> Dishes, categories, and variations will be extracted in{' '}
                <strong>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.label} (
                  {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeLabel})
                </strong>
                !
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectLanguage('english')}
              className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 shrink-0 ml-3"
            >
              Reset to English (डिफ़ॉल्ट)
            </button>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-emerald-600" />
          <span>Upload Menu File (PDF, Images, Word, Excel)</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'text'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-teal-600" />
          <span>Paste Menu Text / WhatsApp Message</span>
        </button>
      </div>

      {/* Tab 1: File Upload (PDF, Images, Word, Excel) */}
      {activeTab === 'upload' && (
        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.doc,.xlsx,.xls,.csv,.txt,application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/csv,text/plain"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isLoading}
            />

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-base font-semibold text-slate-800 mb-1">
              {isLoading
                ? 'Digitizing Menu with Gemini AI...'
                : 'Drop restaurant menu file here, or click to browse'}
            </h3>

            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4">
              Upload any restaurant menu file in PDF, Image, Word, or Excel format. Gemini AI extracts all dishes, prices, and categories into Petpooja POS 11-column format with variation parent-child rows.
            </p>

            {/* 4 Supported Formats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto text-xs text-slate-600">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">PDF Document</div>
                  <div className="text-[10px] text-slate-400 font-mono">.pdf</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">Images</div>
                  <div className="text-[10px] text-slate-400 font-mono">.jpg, .png, .webp</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <File className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">Word Document</div>
                  <div className="text-[10px] text-slate-400 font-mono">.docx, .doc</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">Excel / Sheets</div>
                  <div className="text-[10px] text-slate-400 font-mono">.xlsx, .xls, .csv</div>
                </div>
              </div>
            </div>

            {selectedFile && !isLoading && (
              <div className="mt-5 inline-flex items-center gap-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs px-3.5 py-2 rounded-xl shadow-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {(() => {
                  const badge = getFileBadge(selectedFile);
                  const Icon = badge.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  );
                })()}
                <span className="font-semibold">{selectedFile.name}</span>
                <span className="text-emerald-700 text-[11px]">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Text Paste */}
      {activeTab === 'text' && (
        <div className="p-6">
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Raw Menu Text / WhatsApp Message
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      setPastedText(clip);
                    } catch {}
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Paste from Clipboard
                </button>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Example:
STARTERS
Paneer Tikka - 220
Chicken Malai Tikka - 280

MAIN COURSE
Dal Makhani (Half: 140 / Full: 240)
Butter Chicken (Half: 210 / Full: 390)
Veg Biryani - 190
..."
                rows={7}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-500">
                Gemini automatically extracts categories, detects variations (Half/Full, Sizes), and assigns Petpooja parent-child codes.
              </p>
              <button
                type="submit"
                disabled={isLoading || !pastedText.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Menu Items</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Progress Feedback */}
      {isLoading && (
        <div className="px-6 py-4 bg-emerald-50/80 border-t border-emerald-100 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
              <span>{loadingStep || 'Processing with Gemini AI...'}</span>
              <span className="font-mono text-[11px] text-emerald-700">Please wait</span>
            </div>
            <div className="w-full h-1.5 bg-emerald-200/70 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="px-6 py-4 bg-rose-50 border-t border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-900">Extraction Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
