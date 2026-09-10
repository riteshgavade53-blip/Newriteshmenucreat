import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STATS_FILE = path.join(DATA_DIR, 'site_stats.json');
const MENUS_FILE = path.join(DATA_DIR, 'saved_menus.json');

function getStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed reading stats file:', e);
  }
  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    totalMenusSaved: 0,
    totalItemsProcessed: 0,
    lastVisitTime: new Date().toISOString(),
  };
}

function saveStats(stats: any) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing stats file:', e);
  }
}

function getSavedMenus(): any[] {
  try {
    if (fs.existsSync(MENUS_FILE)) {
      return JSON.parse(fs.readFileSync(MENUS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed reading menus file:', e);
  }
  return [];
}

function saveSavedMenus(menus: any[]) {
  try {
    fs.writeFileSync(MENUS_FILE, JSON.stringify(menus, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing menus file:', e);
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasServerKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Site stats endpoints
app.get('/api/stats', (req, res) => {
  const stats = getStats();
  res.json({ success: true, stats });
});

app.post('/api/stats/visit', (req, res) => {
  const { isNew } = req.body || {};
  const stats = getStats();
  stats.totalVisits = (stats.totalVisits || 0) + 1;
  if (isNew) {
    stats.uniqueVisitors = (stats.uniqueVisitors || 0) + 1;
  } else if (!stats.uniqueVisitors) {
    stats.uniqueVisitors = 1;
  }
  stats.lastVisitTime = new Date().toISOString();
  saveStats(stats);
  res.json({ success: true, stats });
});

// Saved menus endpoints
app.get('/api/saved-menus', (req, res) => {
  const menus = getSavedMenus();
  res.json({ success: true, menus });
});

app.post('/api/saved-menus', (req, res) => {
  const menu = req.body;
  if (!menu || !menu.rows) {
    return res.status(400).json({ success: false, error: 'Invalid menu data' });
  }

  const menus = getSavedMenus();
  const existingIdx = menus.findIndex((m: any) => m.id === menu.id);
  if (existingIdx >= 0) {
    menus[existingIdx] = menu;
  } else {
    menus.unshift(menu);
  }
  saveSavedMenus(menus);

  const stats = getStats();
  stats.totalMenusSaved = menus.length;
  stats.totalItemsProcessed = (stats.totalItemsProcessed || 0) + (menu.rows?.length || 0);
  saveStats(stats);

  res.json({ success: true, menu });
});

app.delete('/api/saved-menus/:id', (req, res) => {
  const { id } = req.params;
  let menus = getSavedMenus();
  menus = menus.filter((m: any) => m.id !== id);
  saveSavedMenus(menus);

  const stats = getStats();
  stats.totalMenusSaved = menus.length;
  saveStats(stats);

  res.json({ success: true });
});

// Menu extraction prompt generator with Multilingual support
const BASE_PETPOOJA_SYSTEM_INSTRUCTION = `You are a world-class restaurant menu digitization specialist for Petpooja POS system.
Your job is to accurately extract restaurant menu items from documents (images, PDFs, text, Word docs, or Excel spreadsheets) and format them into the standard 11-column Petpooja menu format.

CRITICAL RULES FOR PETPOOJA MENU FORMAT:
1. Columns must follow this structure:
   - Name: Item name
   - Item_Online_DisplayName: Customer-facing item name (usually same as Name)
   - Variation_Name: Name of variation (e.g. "Half", "Full", "Small", "Medium", "Large", "Regular", "1 Pc", "2 Pcs", "Veg", "Chicken", "500ml", "1L"). If single item with no variation, leave empty "".
   - Price: Numeric price as string (e.g. "180" or "180.00"). Do NOT include currency symbols like ₹, $, Rs.
   - Category: Menu category (e.g. "Starters", "Soups", "Main Course", "Tandoor", "Breads", "Biryani & Rice", "Beverages", "Desserts", "Pizzas", "Burgers").
   - Category_Online_DisplayName: Online display category name (usually same as Category).
   - Short_Code: Short SKU abbreviation (e.g. "PBM", "PBM-H", "DM"). Generate a clean logical code if not in menu.
   - Short_Code_2: Secondary code (usually empty "").
   - Description: Dish description or ingredients if mentioned in menu.
   - Attributes: Dietary tag: "Veg", "Non-Veg", "Egg", "Vegan", or "Beverage".
   - Goods_Services: Always "Goods" for food & drinks.

2. VARIATIONS & PARENT-CHILD RULE (CRITICAL FOR PETPOOJA POS):
   - Whenever an item has multiple sizes/portions/variations (e.g., slash-separated prices like "140/260", or explicit options like "Half/Full", "Small/Medium/Large", "Single/Double"):
     A. Create ONE PARENT ROW FIRST:
        - Name: Base dish name (e.g. "Paneer Butter Masala")
        - Item_Online_DisplayName: Base dish name
        - Variation_Name: ""
        - Price: "0"  (CRITICAL: Parent row price in Petpooja MUST ALWAYS BE 0)
        - Category: Category name
        - Category_Online_DisplayName: Category name
        - Short_Code: Base code (e.g. "PBM")
        - Attributes: Dietary tag (e.g. "Veg")
        - Goods_Services: "Goods"
     B. Create CHILD ROWS for EACH variation immediately under the parent:
        - Name: EXACT same base dish name as parent (e.g. "Paneer Butter Masala")
        - Item_Online_DisplayName: EXACT same base dish name as parent
        - Variation_Name: Variation label (e.g. "Half", "Full", "Small", "Medium", "Large")
        - Price: The actual variation price (e.g. "160", "280")
        - Category: Same Category
        - Category_Online_DisplayName: Same Category
        - Short_Code: Base code + variation suffix (e.g. "PBM-H", "PBM-F")
        - Attributes: Dietary tag
        - Goods_Services: "Goods"
   - If an item does NOT have variations, create a single row with its actual price and empty Variation_Name.

3. Extract ALL items from the menu without skipping any categories or items.
4. Clean up any OCR artifacts, price symbols, or accidental characters.`;

function getExtractionSystemInstruction(language: string = 'english'): string {
  const lang = (language || 'english').toLowerCase().trim();

  let languageRule = '';
  switch (lang) {
    case 'hindi':
      languageRule = `5. LANGUAGE REQUIREMENT - HINDI (हिंदी - देवनागरी लिपि):
   - Output all dish names (Name, Item_Online_DisplayName), categories (Category, Category_Online_DisplayName), variation labels (Variation_Name e.g. "हाफ", "फुल", "रेगुलर", "लार्ज", "1 पीस"), and descriptions (Description) in natural, authentic Hindi in Devanagari script (देवनागरी).
   - Culinary dish names must be accurate in Devanagari (e.g. "पनीर बटर मसाला", "दाल मखनी", "कढ़ाई पनीर", "मसाला डोसा", "तंदूरी रोटी", "गुलाब जामुन").
   - Categories in Hindi (e.g. "स्टार्टर्स", "मुख्य भोजन", "रोटी व नान", "चावल व बिरयानी", "पेय पदार्थ", "मिठाई").
   - Attributes: Dietary tag: "वेज" (or "शाकाहारी"), "नॉन-वेज" (or "मांसाहारी"), "एग" (or "अंडा").
   - Price must remain strictly numeric (e.g. "180" or "0"). Goods_Services is always "Goods".`;
      break;

    case 'marathi':
      languageRule = `5. LANGUAGE REQUIREMENT - MARATHI (मराठी - देवनागरी लिपी):
   - Output all dish names (Name, Item_Online_DisplayName), categories (Category, Category_Online_DisplayName), variation labels (Variation_Name e.g. "अर्धा / हाफ", "पूर्ण / फुल", "लहान", "मोठा", "1 नग"), and descriptions (Description) in natural, fluent Marathi in Devanagari script.
   - Food names authentic in Marathi (e.g. "पनीर बटर मसाला", "मटण सुक्का", "मिसळ पाव", "वरण भात", "सोलकढी", "कोथिंबीर वडी").
   - Categories in Marathi (e.g. "सुरुवात / स्टार्टर्स", "मुख्य जेवण", "रोटी आणि भाकरी", "भात व पुलाव", "पेये / सरबत", "मिष्टान्न / गोडधोड").
   - Attributes: "शाकाहारी", "मांसाहारी", "अंडा", "पेय".
   - Price must remain strictly numeric (e.g. "180" or "0"). Goods_Services is always "Goods".`;
      break;

    case 'gujarati':
      languageRule = `5. LANGUAGE REQUIREMENT - GUJARATI (ગુજરાતી - ગુજરાતી લિપિ):
   - Output all dish names (Name, Item_Online_DisplayName), categories (Category, Category_Online_DisplayName), variation labels (Variation_Name e.g. "હાફ", "ફુલ", "નાનું", "મોટું", "1 નંગ"), and descriptions (Description) in natural Gujarati script.
   - Food names authentic in Gujarati (e.g. "પનીર બટર મસાલા", "દાળ ફ્રાય", "ખમણ ઢોકળા", "સેવ ટામેટા શાક", "રોટલી / ભાખરી", "ગુલાબ જાંબુ").
   - Categories in Gujarati (e.g. "સ્ટાર્ટર્સ / નાસ્તો", "મુખ્ય વાનગી / શાક", "રોટલી અને પરોઠા", "દાળ-ભાત", "પીણાં", "મિઠાઈ").
   - Attributes: "શાકાહારી", "માંસાહારી", "ઈંડા", "પીણું".
   - Price must remain strictly numeric (e.g. "180" or "0"). Goods_Services is always "Goods".`;
      break;

    case 'hinglish':
      languageRule = `5. LANGUAGE REQUIREMENT - HINGLISH (हिंग्लिश / Romanized Hindi):
   - Output dish Names, Categories, Variation names, and Descriptions in Hinglish (Hindi/Indian culinary words written using standard English/Latin alphabet, popular in Indian cafes and casual dining menus).
   - Dishes like: "Paneer Butter Masala", "Dal Makhani Tadke Wali", "Tandoori Murgh Tikka", "Kadhai Paneer Lazeez", "Garam Gulab Jamun".
   - Categories in Hinglish (e.g. "Shuruaat / Starters", "Khaas Sabziyan / Main Course", "Roti aur Paratha", "Chawal aur Biryani", "Thanda Peena / Drinks", "Meetha / Desserts").
   - Variations in Hinglish (e.g. "Half / Adha", "Full / Poora", "Small / Chhota", "Large / Bada", "1 Piece").
   - Attributes: "Veg / Shakahari", "Non-Veg / Mansahari", "Egg / Anda", "Drink".
   - Price must remain strictly numeric (e.g. "180" or "0"). Goods_Services is always "Goods".`;
      break;

    case 'english':
    default:
      languageRule = `5. LANGUAGE REQUIREMENT - ENGLISH (Standard):
   - Output all item Names, Categories, Variation labels, and Descriptions in standard English (e.g. "Paneer Butter Masala", "Starters", "Main Course", "Half", "Full", "Veg", "Non-Veg").`;
      break;
  }

  return `${BASE_PETPOOJA_SYSTEM_INSTRUCTION}\n\n${languageRule}`;
}

// Extract menu endpoint
app.post('/api/extract-menu', async (req, res) => {
  try {
    const { fileBase64, mimeType, textContent, userApiKey, outputLanguage } = req.body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error:
          'No Gemini API Key provided. Please provide a GEMINI_API_KEY in the environment or enter your key in the app settings.',
      });
    }

    if (!fileBase64 && !textContent) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a file (PDF, Image, Word, Excel) or text content to extract.',
      });
    }

    const targetLang = outputLanguage || 'english';
    let parsedText = textContent || '';
    let sendInlineData: { data: string; mimeType: string } | null = null;

    // If fileBase64 is provided and textContent wasn't already generated:
    if (fileBase64 && !parsedText) {
      const isExcel =
        mimeType?.includes('sheet') ||
        mimeType?.includes('excel') ||
        mimeType?.includes('csv');
      const isWord =
        mimeType?.includes('wordprocessingml') ||
        mimeType?.includes('msword');

      if (isExcel) {
        try {
          const buffer = Buffer.from(fileBase64, 'base64');
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          let sheetText = '=== EXCEL SPREADSHEET ===\n';
          workbook.SheetNames.forEach((name) => {
            const sheet = workbook.Sheets[name];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv.trim()) {
              sheetText += `\n--- Sheet: ${name} ---\n${csv}\n`;
            }
          });
          parsedText = sheetText;
        } catch (excelErr) {
          console.error('Server Excel parse error:', excelErr);
        }
      } else if (isWord) {
        try {
          const buffer = Buffer.from(fileBase64, 'base64');
          const result = await mammoth.extractRawText({ buffer });
          parsedText = `=== WORD DOCUMENT ===\n\n${result.value}`;
        } catch (wordErr) {
          console.error('Server Word parse error:', wordErr);
        }
      } else {
        // PDF or Images (JPG, PNG, WebP, etc.)
        sendInlineData = {
          data: fileBase64,
          mimeType: mimeType || 'image/jpeg',
        };
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents: Array<any> = [];

    if (sendInlineData) {
      contents.push({
        inlineData: sendInlineData,
      });
    }

    const promptText = parsedText
      ? `Here is the menu content to parse into Petpooja POS 11-column format:\n\n${parsedText}\n\nTarget Output Language: ${targetLang.toUpperCase()}.\nParse and structure every item following the Petpooja 11-column standards, variation parent-child rules, and the language requirement.`
      : `Please analyze this restaurant menu document and extract every item and category into the Petpooja 11-column structured format with proper parent rows (price 0) for variations and child rows for each variation. Target Output Language: ${targetLang.toUpperCase()}.`;

    contents.push(promptText);

    const systemInstruction = getExtractionSystemInstruction(targetLang);

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

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(responseText);

    // Post-process rows: generate IDs and tag parent/child
    const items = (parsedData.items || []).map((item: any, index: number) => {
      const priceStr = String(item.Price || '0').replace(/[^0-9.]/g, '');
      const isParent = priceStr === '0' && (!item.Variation_Name || item.Variation_Name.trim() === '');
      const isVariation = Boolean(item.Variation_Name && item.Variation_Name.trim() !== '');

      return {
        id: `extracted-${Date.now()}-${index}`,
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

    return res.json({
      success: true,
      restaurantName: parsedData.restaurantName || '',
      currency: parsedData.currency || 'INR',
      outputLanguage: targetLang,
      items,
    });
  } catch (err: any) {
    console.error('Extraction error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while extracting menu.',
    });
  }
});

// Translate / Localize existing menu rows endpoint
app.post('/api/translate-menu', async (req, res) => {
  try {
    const { rows, targetLanguage, userApiKey } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No menu rows provided for translation.',
      });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'No Gemini API key available for menu translation.',
      });
    }

    const targetLang = (targetLanguage || 'english').toLowerCase().trim();
    const systemInstruction = `You are a culinary localization and menu translation expert for Indian restaurants and Petpooja POS.
Your task is to translate and adapt restaurant menu items into the target language: "${targetLang.toUpperCase()}".

${getExtractionSystemInstruction(targetLang)}

STRICT MAPPING INSTRUCTIONS:
1. Preserve the exact 'id', 'Price', 'Short_Code', 'Short_Code_2', 'Goods_Services', 'isParent', and 'isVariation' fields without modification.
2. Accurately translate, transliterate, and adapt:
   - 'Name' (Food dish name in target language/script)
   - 'Item_Online_DisplayName' (usually same as translated Name)
   - 'Variation_Name' (e.g. "Half" -> "हाफ" in Hindi, "अर्धा / हाफ" in Marathi, "હાફ" in Gujarati, "Half / Adha" in Hinglish)
   - 'Category' (Category name in target language)
   - 'Category_Online_DisplayName' (usually same as Category)
   - 'Description' (Dish description in target language)
   - 'Attributes' (keep dietary meaning: "Veg"/"शाकाहारी", "Non-Veg"/"मांसाहारी", "Egg"/"अंडा")
3. Return the exact same number of items in the exact same sequence.`;

    const ai = new GoogleGenAI({ apiKey });

    // Send the rows
    const prompt = `Translate the following ${rows.length} Petpooja menu rows into target language "${targetLang.toUpperCase()}":\n\n${JSON.stringify(
      rows.map((r) => ({
        id: r.id,
        Name: r.Name,
        Item_Online_DisplayName: r.Item_Online_DisplayName,
        Variation_Name: r.Variation_Name,
        Price: String(r.Price ?? '0'),
        Category: r.Category,
        Category_Online_DisplayName: r.Category_Online_DisplayName,
        Short_Code: r.Short_Code,
        Short_Code_2: r.Short_Code_2,
        Description: r.Description,
        Attributes: r.Attributes,
        Goods_Services: r.Goods_Services,
      }))
    )}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        systemInstruction,
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
                  Short_Code: { type: Type.STRING },
                  Short_Code_2: { type: Type.STRING },
                  Description: { type: Type.STRING },
                  Attributes: { type: Type.STRING },
                  Goods_Services: { type: Type.STRING },
                },
                required: ['id', 'Name', 'Price', 'Category'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned empty translation.');
    }

    const parsedData = JSON.parse(responseText);
    const translatedList = parsedData.items || [];

    // Map back with fallbacks
    const updatedRows = rows.map((origRow, index) => {
      const translated = translatedList.find((t: any) => t.id === origRow.id) || translatedList[index] || {};
      return {
        ...origRow,
        Name: translated.Name || origRow.Name,
        Item_Online_DisplayName: translated.Item_Online_DisplayName || translated.Name || origRow.Item_Online_DisplayName,
        Variation_Name: translated.Variation_Name !== undefined ? translated.Variation_Name : origRow.Variation_Name,
        Category: translated.Category || origRow.Category,
        Category_Online_DisplayName: translated.Category_Online_DisplayName || translated.Category || origRow.Category_Online_DisplayName,
        Description: translated.Description !== undefined ? translated.Description : origRow.Description,
        Attributes: translated.Attributes || origRow.Attributes,
      };
    });

    return res.json({
      success: true,
      items: updatedRows,
      targetLanguage: targetLang,
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while translating menu.',
    });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Menu Extractor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
