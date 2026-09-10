export type MenuOutputLanguage = 'english' | 'hindi' | 'marathi' | 'gujarati' | 'hinglish';

export interface LanguageOption {
  code: MenuOutputLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  badge?: string;
  description: string;
  sampleDish: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'english',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    badge: 'Default',
    description: 'Standard English (डिफ़ॉल्ट अंग्रेज़ी)',
    sampleDish: 'Paneer Butter Masala',
  },
  {
    code: 'hindi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    flag: '🇮🇳',
    badge: 'देवनागरी',
    description: 'शुद्ध हिंदी लिपि में मेनू (देवनागरी)',
    sampleDish: 'पनीर बटर मसाला',
  },
  {
    code: 'marathi',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    flag: '🚩',
    badge: 'मराठी',
    description: 'मराठी भाषा व खाद्यसंस्कृती (देवनागरी)',
    sampleDish: 'पनीर बटर मसाला',
  },
  {
    code: 'gujarati',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    flag: '🌾',
    badge: 'ગુજરાતી',
    description: 'ગુજરાતી ભાષા અને વાનગીઓ (લિપિ)',
    sampleDish: 'પનીર બટર મસાલા',
  },
  {
    code: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'हिंग्लिश',
    flag: '💬',
    badge: 'Romanized',
    description: 'Hindi in Roman/English alphabet (Khaana, Adha/Poora)',
    sampleDish: 'Paneer Butter Masala Lazeez',
  },
];

export interface MenuItemRow {
  id: string;
  Name: string;
  Item_Online_DisplayName: string;
  Variation_Name: string;
  Price: string | number;
  Category: string;
  Category_Online_DisplayName: string;
  Short_Code: string;
  Short_Code_2: string;
  Description: string;
  Attributes: string; // e.g. "Veg", "Non-Veg", "Egg", "Spicy"
  Goods_Services: string; // "Goods" or "Services"
  isParent?: boolean;
  isVariation?: boolean;
}

export type DietaryType = 'All' | 'Veg' | 'Non-Veg' | 'Egg';

export interface SavedMenu {
  id: string;
  restaurantName: string;
  createdAt: string;
  updatedAt?: string;
  sourceType: 'pdf' | 'image' | 'word' | 'excel' | 'text' | 'manual';
  sourceFileName?: string;
  itemCount: number;
  categoryCount: number;
  currency: string;
  outputLanguage?: MenuOutputLanguage;
  rows: MenuItemRow[];
  notes?: string;
}

export interface SiteStats {
  totalVisits: number;
  uniqueVisitors: number;
  totalMenusSaved: number;
  totalItemsProcessed: number;
  lastVisitTime?: string;
}

export interface ExtractionResponse {
  success: boolean;
  restaurantName?: string;
  currency?: string;
  outputLanguage?: MenuOutputLanguage;
  items: MenuItemRow[];
  warnings?: string[];
  error?: string;
}

export interface SamplePreset {
  id: string;
  title: string;
  cuisine: string;
  description: string;
  itemCount: number;
  sampleText: string;
  defaultRows: MenuItemRow[];
}
