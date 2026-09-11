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
  Plus,
  Trash2,
  Play,
  Layers,
  X,
} from 'lucide-react';
import { detectFileType, SupportedFileType } from '../utils/geminiExtractor';
import { MenuOutputLanguage, SUPPORTED_LANGUAGES } from '../types';

interface UploadZoneProps {
  onExtractFiles: (files: File[]) => void;
  onExtractText: (text: string) => void;
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  selectedLanguage: MenuOutputLanguage;
  onSelectLanguage: (language: MenuOutputLanguage) => void;
  hasOutput?: boolean;
  outputCount?: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onExtractFiles,
  onExtractText,
  isLoading,
  loadingStep,
  error,
  selectedLanguage,
  onSelectLanguage,
  hasOutput = false,
  outputCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      const droppedFiles: File[] = Array.from(e.dataTransfer.files) as File[];
      addFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const chosen: File[] = Array.from(e.target.files) as File[];
      addFiles(chosen);
    }
    // reset input value so re-selecting the same file fires onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (newFiles: File[]) => {
    setSelectedFiles((prev) => {
      // Prevent exact duplicate by name and size
      const existingSignatures = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const filtered = newFiles.filter((f) => !existingSignatures.has(`${f.name}-${f.size}`));
      return [...prev, ...filtered];
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  // Manual Trigger: User clicks the Start Button to process
  const handleStartExtraction = () => {
    if (selectedFiles.length === 0 || isLoading) return;
    onExtractFiles(selectedFiles);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || isLoading) return;
    onExtractText(pastedText.trim());
  };

  const getFileBadge = (file: File) => {
    const type: SupportedFileType = detectFileType(file);
    switch (type) {
      case 'pdf':
        return { label: 'PDF', color: 'bg-red-50 text-red-700 border-red-200', icon: FileText };
      case 'excel':
        return { label: 'Excel', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet };
      case 'word':
        return { label: 'Word', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: File };
      case 'image':
        return { label: 'Image', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileImage };
      default:
        return { label: 'Text', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileCode };
    }
  };

  const totalSizeKB = (selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1);

  return (
    <div className={`bg-white rounded-2xl transition-all duration-500 overflow-hidden ${
      hasOutput
        ? 'border-2 border-emerald-300 shadow-md shadow-emerald-500/5'
        : 'border border-slate-200/90 shadow-sm'
    }`}>
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
                Default is <strong>English</strong>. Choose <strong>Hindi (हिंदी)</strong>, <strong>Marathi (मराठी)</strong>, <strong>Gujarati (ગુજરાતી)</strong>, or <strong>Hinglish</strong>.
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

      {/* Mode Tabs - Highlighted with distinct, vibrant colors */}
      <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-100/90 p-2.5 gap-2.5 text-xs sm:text-sm">
        {/* Tab 1: Upload Files - High-visibility Emerald Green */}
        <button
          id="tab-mode-upload"
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 border-2 border-emerald-600 ring-2 ring-emerald-400/40'
              : 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 hover:border-emerald-400'
          }`}
        >
          <UploadCloud className={`w-5 h-5 shrink-0 ${activeTab === 'upload' ? 'text-white' : 'text-emerald-600'}`} />
          <span className="tracking-wide">Multiple Images & Files (PDF, Images, Word, Excel)</span>
          {selectedFiles.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                activeTab === 'upload'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {selectedFiles.length}
            </span>
          )}
        </button>

        {/* Tab 2: Text / WhatsApp - High-visibility Indigo / Royal Blue */}
        <button
          id="tab-mode-text"
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'text'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/25 border-2 border-indigo-600 ring-2 ring-indigo-400/40'
              : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-800 border-2 border-indigo-300 hover:border-indigo-400'
          }`}
        >
          <ClipboardList className={`w-5 h-5 shrink-0 ${activeTab === 'text' ? 'text-white' : 'text-indigo-600'}`} />
          <span className="tracking-wide">Paste Menu Text / WhatsApp Message</span>
          {pastedText.trim().length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              Text Added
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: File Upload (Supports Multiple Images, PDF, Word, Excel) */}
      {activeTab === 'upload' && (
        <div className="p-6 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
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

            <h3 className="text-base font-bold text-slate-800 mb-1">
              {isLoading
                ? 'Digitizing Menu with Fast Gemini Flash AI...'
                : 'Drop Multiple Menu Images or Files Here, or Click to Browse'}
            </h3>

            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4">
              Aap ek sath multiple images / photos (Page 1, Page 2, drinks, food) ya PDF, Word, Excel files upload kar sakte hain. Select karne ke baad neeche diye <strong>"Start Extraction"</strong> button par click karein.
            </p>

            {/* 4 Supported Formats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto text-xs text-slate-600">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">Multiple Images</div>
                  <div className="text-[10px] text-slate-400 font-mono">.jpg, .png, .webp</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-[11px]">PDF Document</div>
                  <div className="text-[10px] text-slate-400 font-mono">.pdf</div>
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
          </div>

          {/* Selected Files List & START Button Bar */}
          {selectedFiles.length > 0 && !isLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'File Selected' : 'Files Selected'} ({totalSizeKB} KB Total)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ready for extraction. Press "Start Extraction" to begin processing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add More Images</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Grid of Selected File Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => {
                  const badge = getFileBadge(file);
                  const BadgeIcon = badge.icon;
                  const isImage = file.type.startsWith('image/');
                  const previewUrl = isImage ? URL.createObjectURL(file) : null;

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs group hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${badge.color}`}>
                            <BadgeIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-600">{badge.label}</span>
                            <span>•</span>
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* THE PROMINENT MANUAL START EXTRACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                  <span>
                    START EXTRACTION (प्रोसेस शुरू करें) — {selectedFiles.length} {selectedFiles.length === 1 ? 'Image/File' : 'Images/Files'}
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-1.5">
                  Clicking this button sends {selectedFiles.length} file(s) to Gemini 2.5/3.x Flash for fast tabular extraction.
                </p>
              </div>
            </div>
          )}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-500">
                Fast AI automatically extracts categories, detects variations (Half/Full, Sizes), and assigns POS parent-child codes.
              </p>
              <button
                type="submit"
                disabled={isLoading || !pastedText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>START EXTRACTION (प्रोसेस शुरू करें)</span>
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
              <span>{loadingStep || 'Fast processing with Gemini Flash AI...'}</span>
              <span className="font-mono text-[11px] text-emerald-700">Lightning Fast Output</span>
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
