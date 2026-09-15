import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { UploadZone } from './components/UploadZone';
import { MenuTable } from './components/MenuTable';
import { StatsCards } from './components/StatsCards';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MenuItemRow, SiteStats, MenuOutputLanguage, TopTabType } from './types';
import { PdfToExcelView } from './components/PdfToExcelView';
import { PdfImageEditorView } from './components/PdfImageEditorView';
import {
  extractMenuData,
  translateMenuData,
  getStoredUserApiKey,
  detectFileType,
} from './utils/geminiExtractor';
import { trackVisit } from './utils/savedMenusManager';
import { assignStandardShortCodes } from './utils/shortCodeUtils';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [rows, setRows] = useState<MenuItemRow[]>([]);
  const [restaurantName, setRestaurantName] = useState<string>('Restaurant Menu');
  const [currency, setCurrency] = useState<string>('INR');
  const [outputLanguage, setOutputLanguage] = useState<MenuOutputLanguage>('english');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Key & Server state
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [hasUserKey, setHasUserKey] = useState<boolean>(false);

  // Visitor stats
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Top navigation tabs: 'pos-menu' or 'pdf-to-excel'
  const [activeTopTab, setActiveTopTab] = useState<TopTabType>('pos-menu');

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  const tableSectionRef = useRef<HTMLDivElement>(null);
  const hasOutput = rows.length > 0;

  // Turn body background light green when output arrives in POS menu tab
  useEffect(() => {
    if (activeTopTab === 'pos-menu' && hasOutput) {
      document.body.classList.remove('bg-slate-50');
      document.body.classList.add('bg-[#edfcf2]');
    } else {
      document.body.classList.remove('bg-[#edfcf2]');
      document.body.classList.add('bg-slate-50');
    }
  }, [hasOutput, activeTopTab]);

  // Check health and visitor tracking on mount
  useEffect(() => {
    checkHealth();
    setHasUserKey(Boolean(getStoredUserApiKey()));

    // Record site visit & retrieve counter stats
    trackVisit()
      .then((stats) => {
        setSiteStats(stats);
      })
      .catch((err) => console.warn('Visitor tracking error:', err));
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHasServerKey(Boolean(data.hasServerKey));
      }
    } catch {
      // Fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleKeySaved = () => {
    setHasUserKey(Boolean(getStoredUserApiKey()));
  };

  // Extract from Multiple Files or Single File (Images, PDF, Word, Excel)
  const handleExtractFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    setLoadingStep(`Processing ${files.length} menu file(s) with Fast Gemini AI...`);

    try {
      const res = await extractMenuData({
        files,
        outputLanguage,
        onStatusUpdate: (status) => setLoadingStep(status),
      });

      if (res.items && res.items.length > 0) {
        const firstFileName = files[0].name.replace(/\.[^/.]+$/, '');
        const extractedRestaurantName =
          res.restaurantName ||
          (files.length > 1 ? `${firstFileName} (+${files.length - 1} pages)` : firstFileName);
        const extractedCurrency = res.currency || 'INR';

        setRows(res.items);
        setRestaurantName(extractedRestaurantName);
        setCurrency(extractedCurrency);

        showToast(
          `✅ "${extractedRestaurantName}" (${res.items.length} items from ${files.length} file(s)) extracted in ${outputLanguage.toUpperCase()}!`
        );

        // Smooth scroll to table
        setTimeout(() => {
          tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        throw new Error('No menu items could be extracted. Please ensure the files contain legible menu text or tables.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to extract menu.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Extract from Text
  const handleExtractText = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Fast AI formatting text into 11-column POS format...');

    try {
      const res = await extractMenuData({
        text,
        outputLanguage,
        onStatusUpdate: (status) => setLoadingStep(status),
      });

      if (res.items && res.items.length > 0) {
        const extractedRestaurantName = res.restaurantName || 'Pasted Menu';
        const extractedCurrency = res.currency || 'INR';

        setRows(res.items);
        setRestaurantName(extractedRestaurantName);
        setCurrency(extractedCurrency);

        showToast(`✅ "${extractedRestaurantName}" (${res.items.length} items) extracted in ${outputLanguage.toUpperCase()}!`);

        // Smooth scroll to table
        setTimeout(() => {
          tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        throw new Error('No items identified in the text.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to extract menu from text.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Translate existing active menu rows to a target language
  const handleTranslateLanguage = async (targetLang: MenuOutputLanguage) => {
    if (rows.length === 0 || isTranslating) return;
    if (targetLang === outputLanguage) return;

    setIsTranslating(true);
    try {
      const translated = await translateMenuData({
        rows,
        targetLanguage: targetLang,
        onStatusUpdate: (msg) => showToast(`🌐 ${msg}`),
      });

      if (translated && translated.length > 0) {
        setRows(translated);
        setOutputLanguage(targetLang);
        const langName =
          targetLang === 'hindi'
            ? 'Hindi (हिंदी)'
            : targetLang === 'marathi'
            ? 'Marathi (मराठी)'
            : targetLang === 'gujarati'
            ? 'Gujarati (ગુજરાતી)'
            : targetLang === 'hinglish'
            ? 'Hinglish (हिंग्लिश)'
            : 'English';
        showToast(`✨ Successfully converted menu to ${langName}! Excel & CSV updated.`);
      }
    } catch (err: any) {
      showToast(`❌ Translation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Row operations
  const handleUpdateRow = (id: string, updatedRow: Partial<MenuItemRow>) => {
    setRows((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;

      // Ensure if Name is edited, Item_Online_DisplayName matches Name exactly
      const patch: Partial<MenuItemRow> = { ...updatedRow };
      if (updatedRow.Name !== undefined && updatedRow.Item_Online_DisplayName === undefined) {
        patch.Item_Online_DisplayName = updatedRow.Name;
      }

      // If user is updating dietary Attributes on a parent dish, also cascade to its variations
      if (patch.Attributes && (target.isParent || (!target.Variation_Name && (target.Price === '0' || !target.Price)))) {
        const parentName = target.Name.trim().toLowerCase();
        return prev.map((r) => {
          if (r.id === id) {
            return { ...r, ...patch };
          }
          // If this is a child variation of this parent (same Name and has Variation_Name)
          if (parentName && r.Name.trim().toLowerCase() === parentName && r.Variation_Name) {
            return { ...r, Attributes: patch.Attributes! };
          }
          return r;
        });
      }

      return prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
    });
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDuplicateRow = (id: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const copy: MenuItemRow = {
        ...target,
        id: `dup-${Date.now()}`,
        Name: `${target.Name} (Copy)`,
        Item_Online_DisplayName: `${target.Name} (Copy)`,
        Goods_Services: '',
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleAddRow = () => {
    const newRow: MenuItemRow = {
      id: `new-${Date.now()}`,
      Name: 'New Dish Name',
      Item_Online_DisplayName: 'New Dish Name',
      Variation_Name: '',
      Price: '100',
      Category: 'Main Course',
      Category_Online_DisplayName: 'Main Course',
      Short_Code: '',
      Short_Code_2: '',
      Description: '',
      Attributes: 'Veg',
      Goods_Services: '',
    };
    setRows((prev) => assignStandardShortCodes([...prev, newRow], false));
  };

  const handleRegenerateShortCodes = () => {
    if (rows.length === 0) return;
    const sanitized = rows.map((r) => ({
      ...r,
      Item_Online_DisplayName: r.Name,
      Goods_Services: '',
    }));
    const fixed = assignStandardShortCodes(sanitized, true);
    setRows(fixed);
    showToast('⚡ Single variations merged into Name ( ) e.g. Sprite (200ml) & Short Codes refreshed!');
  };

  const handleClearRows = () => {
    if (window.confirm('Clear all menu items to extract a new file?')) {
      setRows([]);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col text-slate-900 pb-16 transition-colors duration-700 ease-in-out ${
      hasOutput ? 'bg-[#edfcf2]' : 'bg-slate-50'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        hasServerKey={hasServerKey}
        hasUserKey={hasUserKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        siteStats={siteStats}
        hasOutput={hasOutput}
        itemCount={rows.length}
        activeTab={activeTopTab}
        onSelectTab={setActiveTopTab}
      />

      {/* Main Content */}
      <main className={`flex-1 w-full ${
        activeTopTab === 'pos-menu'
          ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'
          : 'w-full px-2 sm:px-4 py-2 flex flex-col'
      }`}>
        {activeTopTab === 'pdf-to-excel' ? (
          <PdfToExcelView onShowToast={showToast} />
        ) : activeTopTab === 'pdf-image-editor' ? (
          <PdfImageEditorView onShowToast={showToast} />
        ) : (
          <>
            {/* Step 1: Prominent Output Language Selection (Hindi, Gujarati, Marathi, English, Hinglish) */}
            <LanguageSelector
              selectedLanguage={outputLanguage}
              onSelectLanguage={setOutputLanguage}
              disabled={isLoading || isTranslating}
            />

            {/* Step 2: Upload & Extraction Zone (PDF, Images, Word, Excel, Text) */}
            <UploadZone
              onExtractFiles={handleExtractFiles}
              onExtractText={handleExtractText}
              isLoading={isLoading}
              loadingStep={loadingStep}
              error={error}
              selectedLanguage={outputLanguage}
              onSelectLanguage={setOutputLanguage}
              hasOutput={hasOutput}
              outputCount={rows.length}
            />

            {/* Output Received Celebration Banner */}
            {hasOutput && (
              <div
                id="output-ready-banner"
                className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 border-2 border-emerald-400 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top duration-500"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                        Output Aa Gaya Hai! (Menu Safaltapoorvak Ready Hai)
                      </h2>
                      <span className="bg-emerald-900/90 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/50">
                        {rows.length} Items
                      </span>
                      <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/30 uppercase">
                        {outputLanguage}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100 mt-1">
                      Pura page <strong>Light Green</strong> ho chuka hai taaki aapko turant pata chal sake ki process complete ho gaya hai. Niche table me aapka 11-column POS menu taiyar hai — aap check karke <strong>Export Excel (.xlsx)</strong> download kar sakte hain!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Table Par Jayein ↓</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stats KPI Cards */}
            {rows.length > 0 && (
              <StatsCards
                rows={rows}
                restaurantName={restaurantName}
                currency={currency}
              />
            )}

            {/* Menu Data Table */}
            <div ref={tableSectionRef}>
              <MenuTable
                rows={rows}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                onDuplicateRow={handleDuplicateRow}
                onAddRow={handleAddRow}
                onClearRows={handleClearRows}
                onRegenerateShortCodes={handleRegenerateShortCodes}
                restaurantName={restaurantName}
                currentLanguage={outputLanguage}
                onTranslateLanguage={handleTranslateLanguage}
                isTranslating={isTranslating}
              />
            </div>

            {/* Specification Reference Footer Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Standard POS 11-Column Format Compliance
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800 block">1. Variation Parent-Child</span>
                  Parent dish price is always 0. Variations (Half/Full, Sizes) follow as child rows with their individual prices.
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800 block">2. Category Online Name</span>
                  Both offline POS Category and Online Display Category are extracted to ensure Swiggy/Zomato sync.
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800 block">3. Dietary Attributes</span>
                  Accurately tagged as Veg, Non-Veg, or Egg for POS order routing and kitchen display tickets.
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800 block">4. Excel (.xlsx) & CSV</span>
                  Export generated directly with SheetJS in UTF-8 format ready for POS admin portal bulk upload.
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        hasServerKey={hasServerKey}
        onKeySaved={handleKeySaved}
      />
    </div>
  );
}

