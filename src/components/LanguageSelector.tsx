import React from 'react';
import { Languages, Check, Sparkles } from 'lucide-react';
import { MenuOutputLanguage, SUPPORTED_LANGUAGES } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: MenuOutputLanguage;
  onSelectLanguage: (language: MenuOutputLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-sm p-4 sm:p-5 overflow-hidden">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Menu Output Language (आउटपुट भाषा चुनें)
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">
                Required
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aapko extracted POS menu kis bhasha me chahiye? Niche se apni language select karein:
            </p>
          </div>
        </div>

        {/* Current Active Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-900 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active:</span>
          <span className="font-bold text-emerald-950">
            {currentLang.flag} {currentLang.label} ({currentLang.nativeLabel})
          </span>
        </div>
      </div>

      {/* 5 Language Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3.5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLanguage(lang.code)}
              className={`relative text-left p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-emerald-50/80 to-emerald-100/50 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 hover:bg-white hover:border-slate-300 border-slate-200/80 text-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Top Row: Flag & Checkmark */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xl leading-none">{lang.flag}</span>
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300"></span>
                )}
              </div>

              {/* Language Name */}
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                    {lang.label}
                  </span>
                  {lang.nativeLabel !== lang.label && (
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {lang.nativeLabel}
                    </span>
                  )}
                </div>

                <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-emerald-800 font-medium' : 'text-slate-500'}`}>
                  {lang.description}
                </p>
              </div>

              {/* Sample Dish preview */}
              <div className={`mt-2 pt-1.5 border-t text-[10px] truncate ${
                isSelected ? 'border-emerald-200/80 text-emerald-900 font-semibold' : 'border-slate-200 text-slate-400'
              }`}>
                उदा: {lang.sampleDish}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation text */}
      <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-lg flex items-center justify-between border border-slate-200/70">
        <span>
          💡 <strong>Output Format:</strong> Dishes, categories, and variations will be extracted in{' '}
          <strong className="text-emerald-700 font-bold">
            {currentLang.label} ({currentLang.nativeLabel})
          </strong>{' '}
          and formatted into standard 11 POS columns.
        </span>
        {selectedLanguage !== 'english' && (
          <button
            type="button"
            onClick={() => onSelectLanguage('english')}
            className="text-emerald-600 hover:text-emerald-800 font-bold underline ml-2 shrink-0 cursor-pointer"
          >
            Reset to English
          </button>
        )}
      </div>
    </div>
  );
};
