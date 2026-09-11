import { MenuItemRow } from '../types';

// Common Indian script leading sound / consonant maps for Devanagari and Gujarati
const DEVANAGARI_CONSONANTS: Record<string, string> = {
  'क': 'K', 'ख': 'K', 'ग': 'G', 'घ': 'G',
  'च': 'C', 'छ': 'C', 'ज': 'J', 'झ': 'J',
  'ट': 'T', 'ठ': 'T', 'ड': 'D', 'ढ': 'D', 'ण': 'N',
  'त': 'T', 'थ': 'T', 'द': 'D', 'ध': 'D', 'न': 'N',
  'प': 'P', 'फ': 'F', 'ब': 'B', 'भ': 'B', 'म': 'M',
  'य': 'Y', 'र': 'R', 'ल': 'L', 'व': 'V',
  'श': 'S', 'ष': 'S', 'स': 'S', 'ह': 'H',
  'अ': 'A', 'आ': 'A', 'इ': 'I', 'ई': 'I',
  'उ': 'U', 'ऊ': 'U', 'ए': 'E', 'ऐ': 'A', 'ओ': 'O', 'औ': 'O',
};

const GUJARATI_CONSONANTS: Record<string, string> = {
  'ક': 'K', 'ખ': 'K', 'ગ': 'G', 'ઘ': 'G',
  'ચ': 'C', 'છ': 'C', 'જ': 'J', 'ઝ': 'J',
  'ટ': 'T', 'ઠ': 'T', 'ડ': 'D', 'ઢ': 'D', 'ણ': 'N',
  'ત': 'T', 'થ': 'T', 'દ': 'D', 'ધ': 'D', 'ન': 'N',
  'પ': 'P', 'ફ': 'F', 'બ': 'B', 'ભ': 'B', 'મ': 'M',
  'ય': 'Y', 'ર': 'R', 'લ': 'L', 'વ': 'V',
  'શ': 'S', 'ષ': 'S', 'સ': 'S', 'હ': 'H',
};

const STOP_WORDS = new Set([
  'and', 'with', 'in', 'the', 'of', 'or', 'a', 'an', 'to', 'for', 'on', 'at', '&', '+', 'ke', 'ka', 'ki', 'wale', 'wali'
]);

/**
 * Extracts a Latin letter corresponding to the start of a word.
 * Works for Latin English words as well as Hindi / Gujarati / Marathi words.
 */
function getWordInitial(word: string): string {
  if (!word) return '';
  const firstChar = word[0];

  // If Latin alphabet
  if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  // If Devanagari
  if (DEVANAGARI_CONSONANTS[firstChar]) {
    return DEVANAGARI_CONSONANTS[firstChar];
  }

  // If Gujarati
  if (GUJARATI_CONSONANTS[firstChar]) {
    return GUJARATI_CONSONANTS[firstChar];
  }

  // Check second char in case of combining marks
  for (const ch of word) {
    if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
    if (DEVANAGARI_CONSONANTS[ch]) return DEVANAGARI_CONSONANTS[ch];
    if (GUJARATI_CONSONANTS[ch]) return GUJARATI_CONSONANTS[ch];
  }

  return '';
}

/**
 * Generates base 2-4 letter alphabetic acronym from dish name.
 * Examples:
 * - "Hyderabadi Chicken Dum Biryani" -> "HCD"
 * - "Chicken Seekh Kebab (4Pcs)"    -> "CSK"
 * - "Paneer Butter Masala"          -> "PBM"
 * - "Dal Makhani"                   -> "DM"
 * - "Tandoori Chicken Tikka"        -> "TCT"
 * - "Biryani"                       -> "BIR"
 */
export function generateBaseAcronym(name: string): string {
  if (!name || !name.trim()) return 'ITM';

  // 1. Strip brackets e.g. (4Pcs), (1 Leg), [Chef Special], (Half), etc.
  let cleaned = name.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');

  // 2. Strip piece / size mentions e.g. "4 Pcs", "250ml", "1kg", "100g", etc.
  cleaned = cleaned.replace(/\b\d+\s*(pcs|pc|piece|pieces|g|gm|gms|kg|ml|ltr|l)\b/gi, ' ');

  // 3. Remove punctuation / symbols like hyphens, colons, slashes
  cleaned = cleaned.replace(/[-,/\\:_#*!@$%^&+=?]/g, ' ');

  // 4. Split into words
  const rawWords = cleaned.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return 'ITM';

  // Filter out stop words if we have enough words
  const words = rawWords.filter(w => !STOP_WORDS.has(w.toLowerCase()));
  const activeWords = words.length > 0 ? words : rawWords;

  // Case A: 3 or more words -> take the first letter of each of the first 3 words
  // e.g. "Hyderabadi Chicken Dum Biryani" -> H, C, D -> "HCD"
  // e.g. "Chicken Seekh Kebab" -> C, S, K -> "CSK"
  if (activeWords.length >= 3) {
    const letters = activeWords.slice(0, 3).map(getWordInitial).filter(Boolean);
    const code = letters.join('');
    if (code.length >= 2) return code.toUpperCase();
  }

  // Case B: Exactly 2 words -> take first letter of both words
  // e.g. "Dal Makhani" -> "DM", "Butter Naan" -> "BN"
  if (activeWords.length === 2) {
    const l1 = getWordInitial(activeWords[0]);
    const l2 = getWordInitial(activeWords[1]);
    const code = `${l1}${l2}`.trim();
    if (code.length === 2) return code.toUpperCase();
  }

  // Case C: 1 word -> take up to 3 consonants/letters
  // e.g. "Biryani" -> "BIR", "Roti" -> "ROT"
  const single = activeWords[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (single.length >= 3) {
    return single.slice(0, 3);
  } else if (single.length > 0) {
    return single;
  }

  // Fallback if script couldn't be parsed
  const fallback = activeWords.map(getWordInitial).join('').slice(0, 3);
  return fallback.toUpperCase() || 'ITM';
}

/**
 * Assigns POS-standard Alphabetic Short Codes across all rows:
 * 
 * 1. Base dish or standalone dish gets alphabetic initials:
 *    e.g. "Hyderabadi Chicken Dum Biryani" -> "HCD"
 *    e.g. "Chicken Seekh Kebab (4Pcs)"    -> "CSK"
 * 
 * 2. Child variations sequentially append digits without hyphens:
 *    e.g. Variation 1 (Qtr)  -> "HCD1"
 *    e.g. Variation 2 (Half) -> "HCD2"
 *    e.g. Variation 3 (Full) -> "HCD3"
 * 
 * 3. Duplicate dish names with the same acronym get disambiguated with sequential digits:
 *    e.g. Next dish with acronym "CSK" -> "CSK1", "CSK2"
 *    e.g. Next dish with acronym "HCD" -> "HCD4" (since HCD1..3 are used)
 * 
 * @param rows Array of MenuItemRow
 * @param forceAll If true, regenerates codes even if row already has Short_Code
 */
export function assignStandardShortCodes(rows: MenuItemRow[], forceAll: boolean = false): MenuItemRow[] {
  if (!rows || rows.length === 0) return [];

  // First normalize parent-child relations and merge orphan variations into Name e.g. Sprite (200ml)
  const normalizedRows = normalizeParentChildAndOrphanVariations(rows);

  const usedCodes = new Set<string>();

  // If NOT forceAll, pre-register existing codes so we don't accidentally duplicate
  if (!forceAll) {
    for (const r of normalizedRows) {
      if (r.Short_Code && r.Short_Code.trim()) {
        usedCodes.add(r.Short_Code.trim().toUpperCase());
      }
    }
  }

  let currentParent: {
    name: string;
    baseCode: string;
    variationIndex: number;
  } | null = null;

  return normalizedRows.map((row) => {
    // If not forcing all and row already has a valid non-empty short code, keep it
    if (!forceAll && row.Short_Code && row.Short_Code.trim()) {
      const code = row.Short_Code.trim().toUpperCase();
      usedCodes.add(code);

      // Track if this row acts as parent
      const isParent = row.isParent || (String(row.Price) === '0' && (!row.Variation_Name || row.Variation_Name === ''));
      if (isParent) {
        currentParent = {
          name: row.Name.trim().toLowerCase(),
          baseCode: code,
          variationIndex: 0,
        };
      }
      return { ...row, Short_Code: code };
    }

    const rowNameLower = (row.Name || '').trim().toLowerCase();
    const hasVariationName = Boolean(row.Variation_Name && row.Variation_Name.trim() !== '');
    const isChildOfCurrentParent = Boolean(
      currentParent &&
      hasVariationName &&
      rowNameLower === currentParent.name
    );

    // CASE 1: Child variation of existing parent dish
    if (isChildOfCurrentParent && currentParent) {
      currentParent.variationIndex += 1;
      let varDigit = currentParent.variationIndex;
      let candidate = `${currentParent.baseCode}${varDigit}`;

      // Guarantee absolute uniqueness in the entire menu sheet
      while (usedCodes.has(candidate)) {
        varDigit += 1;
        candidate = `${currentParent.baseCode}${varDigit}`;
      }

      usedCodes.add(candidate);
      return {
        ...row,
        Short_Code: candidate,
      };
    }

    // CASE 2: New dish (Parent dish or Standalone dish)
    const baseAcronym = generateBaseAcronym(row.Name || 'Item');
    let assignedCode = baseAcronym;

    if (usedCodes.has(assignedCode)) {
      // User requirement: "our dusre item name me same aata he to usme digit add kr dete he"
      // If the acronym is already taken, add a sequential digit (e.g. CSK -> CSK1, CSK2)
      let suffix = 1;
      while (usedCodes.has(`${baseAcronym}${suffix}`)) {
        suffix += 1;
      }
      assignedCode = `${baseAcronym}${suffix}`;
    }

    usedCodes.add(assignedCode);

    // If this row is a parent dish (Price 0 and no variation, or marked isParent), establish as currentParent
    const isParent = row.isParent || (String(row.Price) === '0' && !hasVariationName);
    currentParent = {
      name: rowNameLower,
      baseCode: assignedCode,
      variationIndex: 0,
    };

    return {
      ...row,
      Short_Code: assignedCode,
    };
  });
}

/**
 * Appends variation / portion text to dish Name inside parentheses ( ) without duplicating.
 * e.g. ("Sprite", "200ml") -> "Sprite (200ml)"
 * e.g. ("Sprite 200ml", "200ml") -> "Sprite (200ml)"
 * e.g. ("Sprite (200ml)", "200ml") -> "Sprite (200ml)"
 */
export function appendVariationToName(name: string, variation: string): string {
  const cleanName = (name || '').trim();
  const cleanVar = (variation || '').trim();
  if (!cleanVar || cleanVar === '—') return cleanName;

  // If already has exact "(variation)"
  if (cleanName.toLowerCase().includes(`(${cleanVar.toLowerCase()})`)) {
    return cleanName;
  }

  // If name ends with the variation text without parens (e.g. "Sprite 200ml")
  const regexEnds = new RegExp(`\\s+${cleanVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (regexEnds.test(cleanName)) {
    return cleanName.replace(regexEnds, ` (${cleanVar})`);
  }

  return `${cleanName} (${cleanVar})`;
}

/**
 * Normalizes parent-child structures and fixes orphan variations:
 * 
 * User mandate:
 * "Sprite or soda ki parent item nahi he to usne 200ml varaition me diya e aisa nahi hona chiye.
 * Jab parent item na hoto varation wala item name ke piche ( ) me likhe ke aana chiye."
 * 
 * Rules:
 * 1. If an item has a parent item (Price = 0, Variation_Name = ""), it remains a child variation.
 * 2. If an item does NOT have a parent item:
 *    - The variation label (e.g. "200ml", "6 pcs") is appended in parentheses behind Name: e.g. "Sprite (200ml)"
 *    - Item_Online_DisplayName is set identical to Name: e.g. "Sprite (200ml)"
 *    - Variation_Name is emptied ("")
 *    - isVariation is set to false
 *    - isParent is set to false
 */
export function normalizeParentChildAndOrphanVariations(rows: MenuItemRow[]): MenuItemRow[] {
  if (!rows || rows.length === 0) return [];

  // 1. Identify all base dish names that have a legitimate Parent item (Price === 0 or isParent === true with empty variation)
  const parentNames = new Set<string>();
  const nameOccurrences = new Map<string, number>();

  for (const r of rows) {
    const rawName = (r.Name || '').trim();
    if (!rawName) continue;
    const nameLower = rawName.toLowerCase();
    nameOccurrences.set(nameLower, (nameOccurrences.get(nameLower) || 0) + 1);

    const priceNum = parseFloat(String(r.Price || '0').replace(/[^0-9.]/g, ''));
    const isVarEmpty = !r.Variation_Name || r.Variation_Name.trim() === '' || r.Variation_Name.trim() === '—';

    if (r.isParent || (priceNum === 0 && isVarEmpty)) {
      parentNames.add(nameLower);
    }
  }

  return rows.map((r) => {
    const rawName = (r.Name || '').trim();
    const nameLower = rawName.toLowerCase();
    const rawVar = (r.Variation_Name || '').trim();
    const hasVariation = Boolean(rawVar && rawVar !== '—');
    const priceNum = parseFloat(String(r.Price || '0').replace(/[^0-9.]/g, ''));

    // Check if this row is a parent item
    if (r.isParent || (priceNum === 0 && (!rawVar || rawVar === '—'))) {
      return {
        ...r,
        Name: rawName,
        Item_Online_DisplayName: rawName,
        Variation_Name: '',
        Price: '0',
        isParent: true,
        isVariation: false,
        Goods_Services: '',
      };
    }

    // If row has variation text
    if (hasVariation) {
      const hasParentItem = parentNames.has(nameLower);

      // If NO parent item exists for this dish:
      // Convert to standalone item with variation in parentheses: "Sprite (200ml)"
      if (!hasParentItem) {
        const formattedName = appendVariationToName(rawName, rawVar);
        return {
          ...r,
          Name: formattedName,
          Item_Online_DisplayName: formattedName, // Keep identical to Name
          Variation_Name: '', // Left blank as requested
          isVariation: false,
          isParent: false,
          Goods_Services: '',
        };
      }

      // If it DOES have a parent item, it is a valid child variation
      return {
        ...r,
        Name: rawName,
        Item_Online_DisplayName: rawName,
        Variation_Name: rawVar,
        isVariation: true,
        isParent: false,
        Goods_Services: '',
      };
    }

    // Regular item without variation
    return {
      ...r,
      Name: rawName,
      Item_Online_DisplayName: rawName,
      Variation_Name: '',
      isVariation: false,
      isParent: false,
      Goods_Services: '',
    };
  });
}

/**
 * Counts how many rows have an orphan variation (variation exists but no parent item).
 */
export function countOrphanVariations(rows: MenuItemRow[]): number {
  if (!rows || rows.length === 0) return 0;

  const parentNames = new Set<string>();
  for (const r of rows) {
    const priceNum = parseFloat(String(r.Price || '0').replace(/[^0-9.]/g, ''));
    const isVarEmpty = !r.Variation_Name || r.Variation_Name.trim() === '' || r.Variation_Name.trim() === '—';
    if (r.isParent || (priceNum === 0 && isVarEmpty)) {
      if (r.Name && r.Name.trim()) {
        parentNames.add(r.Name.trim().toLowerCase());
      }
    }
  }

  let count = 0;
  for (const r of rows) {
    const rawVar = (r.Variation_Name || '').trim();
    if (rawVar && rawVar !== '—') {
      const nameLower = (r.Name || '').trim().toLowerCase();
      if (!parentNames.has(nameLower)) {
        count++;
      }
    }
  }
  return count;
}
