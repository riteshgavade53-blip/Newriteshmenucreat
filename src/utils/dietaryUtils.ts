import { MenuItemRow } from '../types';

export type DietaryTag = 'Veg' | 'Non-Veg' | 'Egg';

// Egg keywords across English, Hindi, Marathi, Gujarati
const EGG_REGEX = /\b(egg|eggs|anda|ande|omlet|omelet|omelette|bhurji|akuri|shakshuka|poached\s*egg|sunny\s*side|scrambled\s*egg|boiled\s*egg|अंडा|अंडे|अंडी|ઈંડા|ઈંડું)\b/i;

// Non-Veg keywords across English, Hindi, Marathi, Gujarati
const NON_VEG_REGEX = /\b(non[\s-]?veg|chicken|murgh|murg|mutton|gosht|lamb|goat|pork|bacon|ham|beef|buff|meat|fish|machli|machhli|surmai|pomfret|rawas|bombil|prawn|prawns|jhinga|kolambi|crab|lobster|squid|octopus|seafood|sea\s*food|duck|turkey|keema|kheema|tandoori\s*chicken|butter\s*chicken|chicken\s*tikka|seekh\s*kebab|galouti|rogan\s*josh|pepperoni|salami|sausage|मांसाहारी|मांस|चिकन|मटन|मच्छी|मासा|ઝીંગા|માંસાહારી|મટન|ચિકન)\b/i;

// Explicit veg keywords
const VEG_REGEX = /\b(veg|vegetarian|pure\s*veg|jain|shakahari|paneer|dal|daal|aloo|mushroom|gobi|gobhi|palak|chana|rajma|soya|corn|baby\s*corn|methi|bhindi|baingan|matar|shahi\s*paneer|kadhai\s*paneer|paneer\s*butter|dal\s*makhani|dal\s*tadka|roti|naan|paratha|kulcha|lassi|chaas|buttermilk|curd|raita|rice|jeera\s*rice|veg\s*pulao|veg\s*biryani|gulab\s*jamun|rasgulla|ice\s*cream|kulfi|dessert|shake|mocktail|tea|chai|coffee|cold\s*drink|soda|water|शाकाहारी|પનીર|શાકાહારી)\b/i;

/**
 * Accurately detects and normalizes dietary tag into strictly 'Veg', 'Non-Veg', or 'Egg'
 */
export function normalizeDietary(
  rawAttr?: string | null,
  dishName: string = '',
  category: string = '',
  description: string = '',
  variationName: string = ''
): DietaryTag {
  const combined = `${dishName} ${category} ${variationName} ${description}`.trim();
  const attrLower = (rawAttr || '').toLowerCase().trim();

  // 1. If explicit attribute is already provided and matches one of the canonical forms, ALWAYS respect it
  if (attrLower === 'egg' || attrLower === 'anda' || attrLower === 'अंडा' || attrLower === 'ઈંડા') {
    return 'Egg';
  }
  if (
    attrLower === 'non-veg' ||
    attrLower === 'nonveg' ||
    attrLower === 'non veg' ||
    attrLower === 'nv' ||
    attrLower === 'मांसाहारी' ||
    attrLower === 'માંસાહારી'
  ) {
    return 'Non-Veg';
  }
  if (
    attrLower === 'veg' ||
    attrLower === 'pure-veg' ||
    attrLower === 'vegetarian' ||
    attrLower === 'v' ||
    attrLower === 'शाकाहारी' ||
    attrLower === 'શાકાહારી'
  ) {
    return 'Veg';
  }

  // 2. Check variation name first (e.g. Parent is "Dum Biryani", Child variation is "Chicken" or "Egg")
  if (variationName) {
    if (EGG_REGEX.test(variationName)) return 'Egg';
    if (NON_VEG_REGEX.test(variationName)) return 'Non-Veg';
    if (VEG_REGEX.test(variationName)) return 'Veg';
  }

  // 3. Check combined text: dish name + category + description
  // Check Egg first (e.g., Egg Curry, Egg Bhurji, Boiled Egg, Omelette)
  // Caution: "Paneer Bhurji" is veg, "Egg Bhurji" is egg
  if (EGG_REGEX.test(combined)) {
    if (/paneer\s*bhurji/i.test(combined) && !/egg/i.test(combined)) {
      return 'Veg';
    }
    return 'Egg';
  }

  // Check Non-Veg (Chicken, Mutton, Fish, Prawn, Meat, Seafood, etc.)
  // Caution: "Veg Kebab", "Soya Chaap Tikka", "Paneer Tikka" are Veg
  if (NON_VEG_REGEX.test(combined)) {
    const isFalsePositiveNonVeg =
      /\b(paneer|veg|soya|mushroom|corn|dal)\s+(tikka|kebab|chaap|keema|roll|biryani|burger|pizza|sandwich)\b/i.test(
        combined
      );
    if (!isFalsePositiveNonVeg) {
      return 'Non-Veg';
    }
  }

  // Check Veg keywords
  if (VEG_REGEX.test(combined)) {
    return 'Veg';
  }

  // Check category clues (e.g. Category: "Non-Veg Starters", "Chicken Curries", "Sea Food", "Egg Specialties")
  if (NON_VEG_REGEX.test(category)) return 'Non-Veg';
  if (EGG_REGEX.test(category)) return 'Egg';
  if (VEG_REGEX.test(category)) return 'Veg';

  // Default fallback is Veg
  return 'Veg';
}

/**
 * Normalizes all rows in a menu list, ensuring parent-child dietary inheritance
 */
export function normalizeRowsDietary(rows: MenuItemRow[]): MenuItemRow[] {
  let lastParentTag: DietaryTag = 'Veg';
  let lastParentName = '';

  return rows.map((row) => {
    const priceStr = String(row.Price ?? '0').replace(/[^0-9.]/g, '');
    const isParent = row.isParent || (priceStr === '0' && (!row.Variation_Name || row.Variation_Name.trim() === ''));
    const isVariation = Boolean(row.Variation_Name && row.Variation_Name.trim() !== '');

    let normalizedTag = normalizeDietary(
      row.Attributes,
      row.Name,
      row.Category,
      row.Description,
      row.Variation_Name
    );

    if (isParent) {
      lastParentTag = normalizedTag;
      lastParentName = row.Name.trim().toLowerCase();
    } else if (isVariation) {
      // If child variation already has explicit tag assigned, keep it!
      const explicitChildAttr = (row.Attributes || '').trim();
      if (explicitChildAttr === 'Veg' || explicitChildAttr === 'Non-Veg' || explicitChildAttr === 'Egg') {
        normalizedTag = explicitChildAttr as DietaryTag;
      } else if (row.Variation_Name && (EGG_REGEX.test(row.Variation_Name) || NON_VEG_REGEX.test(row.Variation_Name) || VEG_REGEX.test(row.Variation_Name))) {
        // Child variation is self-describing
      } else if (lastParentName && row.Name.trim().toLowerCase() === lastParentName) {
        // Inherit parent's dietary tag for standard size variations like Half, Full, Small, Large
        normalizedTag = lastParentTag;
      }
    }

    return {
      ...row,
      Attributes: normalizedTag,
    };
  });
}

/**
 * Count items by dietary tags
 */
export function getDietaryCounts(rows: MenuItemRow[]) {
  let veg = 0;
  let nonVeg = 0;
  let egg = 0;

  for (const row of rows) {
    const tag = normalizeDietary(
      row.Attributes,
      row.Name,
      row.Category,
      row.Description,
      row.Variation_Name
    );
    if (tag === 'Egg') {
      egg++;
    } else if (tag === 'Non-Veg') {
      nonVeg++;
    } else {
      veg++;
    }
  }

  return {
    all: rows.length,
    veg,
    nonVeg,
    egg,
  };
}
