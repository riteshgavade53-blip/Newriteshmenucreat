import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { UploadZone } from './components/UploadZone';
import { MenuTable } from './components/MenuTable';
import { StatsCards } from './components/StatsCards';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MenuItemRow, SiteStats, MenuOutputLanguage } from './types';
import {
  extractMenuData,
  translateMenuData,
  getStoredUserApiKey,
  detectFileType,
} from './utils/geminiExtractor';
import { trackVisit } from './utils/savedMenusManager';
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

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  const tableSectionRef = useRef<HTMLDivElement>(null);

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

  // Extract from File (PDF, Image, Word, Excel)
  const handleExtractFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Uploading and reading menu file...');

    try {
      const res = await extractMenuData({
        file,
        outputLanguage,
        onStatusUpdate: (status) => setLoadingStep(status),
      });

      if (res.items && res.items.length > 0) {
        const extractedRestaurantName = res.restaurantName || file.name.replace(/\.[^/.]+$/, '');
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
        throw new Error('No menu items could be extracted. Please ensure the file contains legible menu text or tables.');
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
    setLoadingStep('Gemini 2.5 Flash formatting text into Petpooja 11 columns...');

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
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedRow } : r))
    );
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
      Short_Code: 'NEW-01',
      Short_Code_2: '',
      Description: '',
      Attributes: 'Veg',
      Goods_Services: 'Goods',
    };
    setRows((prev) => [newRow, ...prev]);
  };

  const handleClearRows = () => {
    if (window.confirm('Clear all menu items to extract a new file?')) {
      setRows([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-16">
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
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Step 1: Prominent Output Language Selection (Hindi, Gujarati, Marathi, English, Hinglish) */}
        <LanguageSelector
          selectedLanguage={outputLanguage}
          onSelectLanguage={setOutputLanguage}
          disabled={isLoading || isTranslating}
        />

        {/* Step 2: Upload & Extraction Zone (PDF, Images, Word, Excel, Text) */}
        <UploadZone
          onExtractFile={handleExtractFile}
          onExtractText={handleExtractText}
          isLoading={isLoading}
          loadingStep={loadingStep}
          error={error}
          selectedLanguage={outputLanguage}
          onSelectLanguage={setOutputLanguage}
        />

        {/* Stats KPI Cards */}
        {rows.length > 0 && (
          <StatsCards
            rows={rows}
            restaurantName={restaurantName}
            currency={currency}
          />
        )}

        {/* Petpooja Data Table */}
        <div ref={tableSectionRef}>
          <MenuTable
            rows={rows}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
            onDuplicateRow={handleDuplicateRow}
            onAddRow={handleAddRow}
            onClearRows={handleClearRows}
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
              Petpooja POS 11-Column Format Standard Compliance
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
              Export generated directly with SheetJS in UTF-8 format ready for Petpooja admin portal bulk upload.
            </div>
          </div>
        </div>
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

