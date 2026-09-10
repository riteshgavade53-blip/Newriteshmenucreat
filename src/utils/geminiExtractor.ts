import { GoogleGenAI, Type } from '@google/genai';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { MenuItemRow, ExtractionResponse, MenuOutputLanguage } from '../types';

export const USER_GEMINI_KEY_STORAGE = 'menu_extractor_gemini_api_key';

export function getStoredUserApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_GEMINI_KEY_STORAGE) || '';
}

export function setStoredUserApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(USER_GEMINI_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(USER_GEMINI_KEY_STORAGE);
  }
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Extracts raw text or structured CSV from Excel (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let combinedText = `=== EXCEL SPREADSHEET: "${file.name}" ===\n\n`;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to CSV format which preserves rows & columns perfectly
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
    if (csv && csv.trim()) {
      combinedText += `--- SHEET: ${sheetName} ---\n${csv}\n\n`;
    }
  });

  return combinedText;
}

/**
 * Extracts text from Word documents (.docx, .doc)
 */
export async function parseWordFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result && result.value && result.value.trim()) {
      return `=== WORD DOCUMENT: "${file.name}" ===\n\n${result.value.trim()}`;
    }
  } catch (err) {
    console.warn('Mammoth extraction failed, falling back to text stream:', err);
  }

  // Fallback for older .doc or text encoded formats
  try {
    const rawText = await file.text();
    // Filter printable ASCII/UTF-8 characters
    const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    if (cleanText.trim().length > 20) {
      return `=== WORD DOCUMENT: "${file.name}" ===\n\n${cleanText.trim()}`;
    }
  } catch {}

  throw new Error(`Unable to read text from Word document "${file.name}". Please ensure it is a valid .docx or .doc file.`);
}

export type SupportedFileType = 'pdf' | 'image' | 'word' | 'excel' | 'text';

export function detectFileType(file: File): SupportedFileType {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return 'pdf';
  }
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv') ||
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    type.includes('csv')
  ) {
    return 'excel';
  }
  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    type.includes('wordprocessing') ||
    type.includes('msword')
  ) {
    return 'word';
  }
  if (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    name.endsWith('.bmp') ||
    name.endsWith('.tiff') ||
    type.startsWith('image/')
  ) {
    return 'image';
  }
  return 'text';
}

function getClientLanguageInstruction(language: MenuOutputLanguage = 'english'): string {
  switch (language) {
    case 'hindi':
      return `LANGUAGE REQUIREMENT - HINDI (हिंदी - देवनागरी लिपि):
- Output all item Name, Item_Online_DisplayName, Category, Category_Online_DisplayName, Variation_Name (e.g. "हाफ", "फुल", "रेगुलर", "1 पीस"), and Description in natural Hindi in Devanagari script.
- Attributes: "वेज" or "शाकाहारी", "नॉन-वेज" or "मांसाहारी", "एग" or "अंडा".
- Price must remain numeric.`;

    case 'marathi':
      return `LANGUAGE REQUIREMENT - MARATHI (मराठी - देवनागरी लिपी):
- Output all item Name, Item_Online_DisplayName, Category, Category_Online_DisplayName, Variation_Name (e.g. "अर्धा / हाफ", "पूर्ण / फुल", "लहान", "मोठा", "1 नग"), and Description in natural Marathi in Devanagari script.
- Attributes: "शाकाहारी", "मांसाहारी", "अंडा", "पेय".
- Price must remain numeric.`;

    case 'gujarati':
      return `LANGUAGE REQUIREMENT - GUJARATI (ગુજરાતી - ગુજરાતી લિપિ):
- Output all item Name, Item_Online_DisplayName, Category, Category_Online_DisplayName, Variation_Name (e.g. "હાફ", "ફુલ", "નાનું", "મોટું", "1 નંગ"), and Description in natural Gujarati script.
- Attributes: "શાકાહારી", "માંસાહારી", "ઈંડા", "પીણું".
- Price must remain numeric.`;

    case 'hinglish':
      return `LANGUAGE REQUIREMENT - HINGLISH (हिंग्लिश / Romanized Hindi):
- Output item Names, Categories, Variations, and Descriptions in Hinglish (Hindi culinary words in English/Latin letters, e.g. "Paneer Butter Masala", "Dal Makhani Tadka", "Shuruaat / Starters", "Khaas Sabziyan", "Half / Adha", "Full / Poora").
- Attributes: "Veg / Shakahari", "Non-Veg / Mansahari", "Egg / Anda".
- Price must remain numeric.`;

    case 'english':
    default:
      return `LANGUAGE REQUIREMENT - ENGLISH (Standard):
- Output all item Names, Categories, Variation names, and Descriptions in standard English.`;
  }
}

export async function extractMenuData(params: {
  file?: File;
  text?: string;
  customApiKey?: string;
  outputLanguage?: MenuOutputLanguage;
  onStatusUpdate?: (status: string) => void;
}): Promise<ExtractionResponse> {
  const { file, text, customApiKey, outputLanguage = 'english', onStatusUpdate } = params;
  const userKey = customApiKey || getStoredUserApiKey();

  let fileBase64: string | undefined;
  let mimeType: string | undefined;
  let textContent: string | undefined = text;

  // Process uploaded file based on its format: PDF, Image, Word, Excel
  if (file) {
    const fileCategory = detectFileType(file);

    if (fileCategory === 'excel') {
      onStatusUpdate?.('Parsing Excel sheets (.xlsx / .xls / .csv)...');
      textContent = await parseExcelFile(file);
    } else if (fileCategory === 'word') {
      onStatusUpdate?.('Extracting text and tables from Word document (.docx)...');
      textContent = await parseWordFile(file);
    } else if (fileCategory === 'text') {
      onStatusUpdate?.('Reading menu text file...');
      textContent = await file.text();
    } else if (fileCategory === 'pdf') {
      onStatusUpdate?.('Reading PDF pages...');
      fileBase64 = await fileToBase64(file);
      mimeType = 'application/pdf';
    } else {
      // Image (JPG, PNG, WebP, etc.)
      onStatusUpdate?.('Encoding menu image for Gemini Vision...');
      fileBase64 = await fileToBase64(file);
      mimeType = file.type || 'image/jpeg';
    }
  }

  // 1. Try server-side API first
  try {
    const langLabel =
      outputLanguage === 'hindi'
        ? 'Hindi (हिंदी)'
        : outputLanguage === 'marathi'
        ? 'Marathi (मराठी)'
        : outputLanguage === 'gujarati'
        ? 'Gujarati (ગુજરાતી)'
        : outputLanguage === 'hinglish'
        ? 'Hinglish'
        : 'English';

    onStatusUpdate?.(`Gemini 2.5 Flash formatting into Petpooja 11 columns [${langLabel}]...`);
    const res = await fetch('/api/extract-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileBase64,
        mimeType,
        textContent,
        outputLanguage,
        userApiKey: userKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.error || 'Server extraction failed');
    }

    const errJson = await res.json().catch(() => null);
    const errMsg = errJson?.error || `Server responded with status ${res.status}`;

    if (res.status !== 404 && res.status !== 502 && !errMsg.toLowerCase().includes('no gemini api key')) {
      throw new Error(errMsg);
    }
  } catch (serverErr: any) {
    if (!userKey) {
      throw new Error(
        serverErr.message ||
          'Failed to extract menu data. Please make sure GEMINI_API_KEY is configured or enter your API key in Settings.'
      );
    }
  }

  // 2. Client-side fallback if server is unreachable (or static Vercel host with user's key)
  if (!userKey) {
    throw new Error('Please configure a Gemini API key in Settings to extract menus on static deployments.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: userKey });
    const contents: Array<any> = [];

    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: fileBase64,
          mimeType,
        },
      });
    }

    const prompt = textContent
      ? `Menu document content to parse (Target Language: ${outputLanguage.toUpperCase()}):\n\n${textContent}\n\nExtract all items and categories into Petpooja 11-column format with variation parent-child rules.`
      : `Extract all items and categories from this restaurant menu into the Petpooja 11-column format with variation parent/child rows. Target Language: ${outputLanguage.toUpperCase()}.`;

    contents.push(prompt);

    const systemInstruction = `You are an expert restaurant menu parser for Petpooja POS.
Extract every item into 11 columns: Name, Item_Online_DisplayName, Variation_Name, Price, Category, Category_Online_DisplayName, Short_Code, Short_Code_2, Description, Attributes, Goods_Services.
CRITICAL: For items with variations (e.g. Half/Full or slash prices like 140/260), first create a PARENT row with Price="0" and Variation_Name="", followed by CHILD rows for each variation with their respective prices.
For single items without variations, create a single row with actual Price and Variation_Name="".

${getClientLanguageInstruction(outputLanguage)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restaurantName: { type: Type.STRING },
            currency: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Name: { type: Type.STRING },
                  Item_Online_DisplayName: { type: Type.STRING },
                  Variation_Name: { type: Type.STRING },
                  Price: { type: Type.STRING },
                  Category: { type: Type.STRING },
                  Category_Online_DisplayName: { type: Type.STRING },
                  Short_Code: { type: Type.STRING },
                  Short_Code_2: { type: Type.STRING },
                  Description: { type: Type.STRING },
                  Attributes: { type: Type.STRING },
                  Goods_Services: { type: Type.STRING },
                },
                required: ['Name', 'Price', 'Category'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const items: MenuItemRow[] = (parsed.items || []).map((item: any, idx: number) => {
      const priceStr = String(item.Price || '0').replace(/[^0-9.]/g, '');
      const isParent = priceStr === '0' && (!item.Variation_Name || item.Variation_Name.trim() === '');
      const isVariation = Boolean(item.Variation_Name && item.Variation_Name.trim() !== '');

      return {
        id: `client-${Date.now()}-${idx}`,
        Name: item.Name || 'Unnamed Item',
        Item_Online_DisplayName: item.Item_Online_DisplayName || item.Name || 'Unnamed Item',
        Variation_Name: item.Variation_Name || '',
        Price: priceStr || '0',
        Category: item.Category || 'General',
        Category_Online_DisplayName: item.Category_Online_DisplayName || item.Category || 'General',
        Short_Code: item.Short_Code || '',
        Short_Code_2: item.Short_Code_2 || '',
        Description: item.Description || '',
        Attributes: item.Attributes || 'Veg',
        Goods_Services: item.Goods_Services || 'Goods',
        isParent,
        isVariation,
      };
    });

    return {
      success: true,
      restaurantName: parsed.restaurantName || '',
      currency: parsed.currency || 'INR',
      outputLanguage,
      items,
    };
  } catch (clientErr: any) {
    throw new Error(clientErr?.message || 'Client-side Gemini extraction failed. Please check your API key.');
  }
}

/**
 * Translates / localizes existing menu rows into Hindi, Marathi, Gujarati, Hinglish, or English
 */
export async function translateMenuData(params: {
  rows: MenuItemRow[];
  targetLanguage: MenuOutputLanguage;
  customApiKey?: string;
  onStatusUpdate?: (status: string) => void;
}): Promise<MenuItemRow[]> {
  const { rows, targetLanguage, customApiKey, onStatusUpdate } = params;
  if (!rows || rows.length === 0) return [];

  const userKey = customApiKey || getStoredUserApiKey();
  const langLabel =
    targetLanguage === 'hindi'
      ? 'Hindi (हिंदी)'
      : targetLanguage === 'marathi'
      ? 'Marathi (मराठी)'
      : targetLanguage === 'gujarati'
      ? 'Gujarati (ગુજરાતી)'
      : targetLanguage === 'hinglish'
      ? 'Hinglish'
      : 'English';

  onStatusUpdate?.(`Translating menu items to ${langLabel}...`);

  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/translate-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows,
        targetLanguage,
        userApiKey: userKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.items) {
        return data.items;
      }
    }
  } catch (serverErr) {
    console.warn('Server translate failed, trying client fallback:', serverErr);
  }

  // 2. Client fallback
  if (!userKey) {
    throw new Error('Please configure a Gemini API key to translate menus.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: userKey });
    const prompt = `You are a culinary translator for Petpooja POS.
Translate and adapt the following menu items into ${targetLanguage.toUpperCase()}:
${getClientLanguageInstruction(targetLanguage)}

Preserve exact id, Price, Short_Code, and Goods_Services.
Items to translate (JSON):
${JSON.stringify(
  rows.map((r) => ({
    id: r.id,
    Name: r.Name,
    Item_Online_DisplayName: r.Item_Online_DisplayName,
    Variation_Name: r.Variation_Name,
    Price: String(r.Price ?? '0'),
    Category: r.Category,
    Category_Online_DisplayName: r.Category_Online_DisplayName,
    Description: r.Description,
    Attributes: r.Attributes,
  }))
)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  Name: { type: Type.STRING },
                  Item_Online_DisplayName: { type: Type.STRING },
                  Variation_Name: { type: Type.STRING },
                  Price: { type: Type.STRING },
                  Category: { type: Type.STRING },
                  Category_Online_DisplayName: { type: Type.STRING },
                  Description: { type: Type.STRING },
                  Attributes: { type: Type.STRING },
                },
                required: ['id', 'Name', 'Category'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const translatedList = parsed.items || [];

    return rows.map((orig, idx) => {
      const tr = translatedList.find((t: any) => t.id === orig.id) || translatedList[idx] || {};
      return {
        ...orig,
        Name: tr.Name || orig.Name,
        Item_Online_DisplayName: tr.Item_Online_DisplayName || tr.Name || orig.Item_Online_DisplayName,
        Variation_Name: tr.Variation_Name !== undefined ? tr.Variation_Name : orig.Variation_Name,
        Category: tr.Category || orig.Category,
        Category_Online_DisplayName: tr.Category_Online_DisplayName || tr.Category || orig.Category_Online_DisplayName,
        Description: tr.Description !== undefined ? tr.Description : orig.Description,
        Attributes: tr.Attributes || orig.Attributes,
      };
    });
  } catch (clientErr: any) {
    throw new Error(clientErr?.message || 'Failed to translate menu items.');
  }
}
