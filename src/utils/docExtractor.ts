// TypeScript port of extractor.py (DocExtractor)
// Implements the exact 11-column document & menu extraction rules

export interface DocExtractorRow {
  Name: string;
  Item_Online_DisplayName: string;
  Variation_Name: string;
  Price: string;
  Category: string;
  Category_Online_DisplayName: string;
  Short_Code: string;
  Short_Code_2: string;
  Description: string;
  Attributes: string;
  Goods_Services: string;
}

export const DOC_EXTRACTOR_COLUMNS = [
  "Name",
  "Item_Online_DisplayName",
  "Variation_Name",
  "Price",
  "Category",
  "Category_Online_DisplayName",
  "Short_Code",
  "Short_Code_2",
  "Description",
  "Attributes",
  "Goods_Services",
];

const VARIATION_KEYWORDS = [
  'small', 'medium', 'large', 'xl', 'red', 'blue', 'green', 'black', 'white', 'half', 'full'
];

const DIETARY_KEYWORDS = [
  'veg', 'non-veg', 'egg', 'chicken', 'paneer', 'mutton', 'fish', 'prawns', 'soya'
];

function cleanName(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/^[\s\-:/|]+|[\s\-:/|]+$/g, '');
}

function extractPriceList(text: string): string[] {
  const match = text.match(/(\d{2,}(?:[.,]\d{1,2})?(?:\s*\/\s*\d{2,}(?:[.,]\d{1,2})?)*)/);
  if (!match) return [];
  const cluster = match[1];
  return cluster.split(/\s*\/\s*/).map(p => p.replace(',', '.').trim()).filter(Boolean);
}

export function parseTextWithDocExtractor(text: string): DocExtractorRow[] {
  const data: DocExtractorRow[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const pricePattern = /(\d{2,}(?:[.,]\d{1,2})?)/;
  const variantLinePattern = /variant\s*[-:]\s*(.+)/i;

  const tempItems: Record<string, Array<{ variation: string; price: string; line: string }>> = {};
  let previousItemName: string | null = null;
  let skipNext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipNext) {
      skipNext = false;
      continue;
    }

    // Handle explicit variant rows that sit under an item
    const varLineMatch = line.match(variantLinePattern);
    if (varLineMatch) {
      let baseName = previousItemName;
      if (!baseName && i > 0) {
        baseName = cleanName(lines[i - 1]);
      }
      if (!baseName) continue;

      const variantText = varLineMatch[1];
      let variantNames = variantText.split(/[/|]/).map(cleanName).filter(Boolean);
      let prices = extractPriceList(line);

      // Sometimes prices are on the next line
      if (prices.length === 0 && i + 1 < lines.length && /^[\d\s/.,]+$/.test(lines[i + 1])) {
        prices = extractPriceList(lines[i + 1]);
        if (prices.length > 0) {
          skipNext = true;
        }
      }

      if (variantNames.length === 0) {
        variantNames = Array.from({ length: Math.max(prices.length, 1) }, (_, idx) => `Option ${idx + 1}`);
      }

      if (!tempItems[baseName]) {
        tempItems[baseName] = [];
      }

      for (let idx = 0; idx < variantNames.length; idx++) {
        const vname = variantNames[idx];
        const priceVal = idx < prices.length ? prices[idx] : '';
        tempItems[baseName].push({
          variation: vname,
          price: priceVal,
          line: line,
        });
      }

      previousItemName = baseName;
      continue;
    }

    const priceMatch = line.match(pricePattern);
    if (priceMatch) {
      const pricesInLine = extractPriceList(line);
      const price = pricesInLine.length > 0 ? pricesInLine[0].trim() : priceMatch[1].trim();
      let remainingText = line.replace(priceMatch[1], '').trim();

      // Detect dietary/protein prefix
      let dietaryPrefix = '';
      for (const diet of DIETARY_KEYWORDS) {
        const dietRegex = new RegExp(`\\b${diet}\\b`, 'i');
        if (dietRegex.test(remainingText)) {
          dietaryPrefix = diet.charAt(0).toUpperCase() + diet.slice(1);
          break;
        }
      }

      // Detect variation (Size/Color)
      let foundVar = '';
      for (const v of VARIATION_KEYWORDS) {
        const vRegex = new RegExp(`\\b${v}\\b`, 'i');
        if (vRegex.test(remainingText)) {
          foundVar = v.charAt(0).toUpperCase() + v.slice(1);
          remainingText = remainingText.replace(new RegExp(`\\b${v}\\b`, 'gi'), '').trim();
          break;
        }
      }

      let baseName = remainingText.replace(/^,\s*|,\s*$/g, '').trim();
      if (!baseName && i > 0) {
        const prevLine = lines[i - 1];
        if (!pricePattern.test(prevLine)) {
          baseName = prevLine.slice(0, 50);
        }
      }

      baseName = cleanName(baseName);

      if (baseName) {
        if (dietaryPrefix && !baseName.toLowerCase().includes(dietaryPrefix.toLowerCase())) {
          baseName = `${dietaryPrefix} ${baseName}`;
        }

        if (!tempItems[baseName]) {
          tempItems[baseName] = [];
        }

        tempItems[baseName].push({
          variation: foundVar,
          price: price,
          line: line,
        });
        previousItemName = baseName;
      }
    } else {
      // Track potential base names even if price isn't on the same line
      if (line && !variantLinePattern.test(line) && /[A-Za-z]/.test(line)) {
        previousItemName = cleanName(line);
      }
    }
  }

  // Process grouped items into final format
  for (const [baseName, variations] of Object.entries(tempItems)) {
    if (variations.length > 1) {
      // Create PARENT row
      data.push({
        Name: baseName,
        Item_Online_DisplayName: baseName,
        Variation_Name: '',
        Price: '0',
        Category: 'General',
        Category_Online_DisplayName: 'General',
        Short_Code: '',
        Short_Code_2: '',
        Description: 'Base product for variations',
        Attributes: '',
        Goods_Services: 'Services',
      });

      // Create CHILD rows
      for (const v of variations) {
        data.push({
          Name: baseName,
          Item_Online_DisplayName: baseName,
          Variation_Name: v.variation,
          Price: v.price,
          Category: 'General',
          Category_Online_DisplayName: 'General',
          Short_Code: '',
          Short_Code_2: '',
          Description: v.line,
          Attributes: v.variation ? `Size: ${v.variation}` : '',
          Goods_Services: 'Services',
        });
      }
    } else if (variations.length === 1) {
      // Single item
      const v = variations[0];
      data.push({
        Name: baseName,
        Item_Online_DisplayName: baseName,
        Variation_Name: v.variation,
        Price: v.price,
        Category: 'General',
        Category_Online_DisplayName: 'General',
        Short_Code: '',
        Short_Code_2: '',
        Description: v.line,
        Attributes: v.variation ? `Size: ${v.variation}` : '',
        Goods_Services: 'Services',
      });
    }
  }

  return data;
}

export const EXTRACTOR_PYTHON_CODE = `import os
import re
import pandas as pd
import pytesseract
import pdfplumber
from PIL import Image
from datetime import datetime

# Requirements: pip install pytesseract pdfplumber pandas Pillow
# Note: You must have Tesseract OCR installed on your system for image extraction.

class DocExtractor:
    """
    A modular document extractor that maps various document types 
    to a standardized 11-column format.
    """
    def __init__(self):
        self.columns = [
            "Name", 
            "Item_Online_DisplayName", 
            "Variation_Name", 
            "Price", 
            "Category", 
            "Category_Online_DisplayName", 
            "Short_Code", 
            "Short_Code_2", 
            "Description", 
            "Attributes", 
            "Goods_Services"
        ]
        
    def extract_from_pdf(self, pdf_path):
        """Extracts raw text from a PDF file."""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text

    def extract_from_image(self, img_path):
        """Extracts text from an image using OCR."""
        try:
            return pytesseract.image_to_string(Image.open(img_path))
        except Exception as e:
            print(f"Error reading image: {e}")
            return ""

    def parse_text(self, text):
        """
        Enhanced parsing logic to handle diverse document patterns and variations.
        Creates parent rows with 0 price for items with variations.
        """
        data = []
        lines = [l.strip() for l in text.split('\\n') if l.strip()]
        
        # Common patterns
        price_pattern = r'(\\d{2,}(?:[.,]\\d{1,2})?)'
        variation_keywords = ['small', 'medium', 'large', 'xl', 'red', 'blue', 'green', 'black', 'white', 'half', 'full']
        dietary_keywords = ['veg', 'non-veg', 'egg', 'chicken', 'paneer', 'mutton', 'fish', 'prawns', 'soya']
        variant_line_pattern = re.compile(r'variant\\s*[-:]\\s*(.+)', re.IGNORECASE)
        
        def clean_name(text):
            return re.sub(r'\\s+', ' ', text).strip(" -:/|")
        
        def extract_price_list(text):
            match = re.search(r'(\\d{2,}(?:[.,]\\d{1,2})?(?:\\s*/\\s*\\d{2,}(?:[.,]\\d{1,2})?)*)', text)
            if not match:
                return []
            cluster = match.group(1)
            return [p.replace(',', '.').strip() for p in re.split(r'\\s*/\\s*', cluster) if p.strip()]
        
        temp_items = {}
        previous_item_name = None
        skip_next = False

        for i, line in enumerate(lines):
            if skip_next:
                skip_next = False
                continue
            
            var_line_match = variant_line_pattern.search(line)
            if var_line_match:
                base_name = previous_item_name
                if not base_name and i > 0:
                    base_name = clean_name(lines[i-1])
                if not base_name:
                    continue

                variant_text = var_line_match.group(1)
                variant_names = [clean_name(v) for v in re.split(r'[/|]', variant_text) if clean_name(v)]
                prices = extract_price_list(line)

                if not prices and i + 1 < len(lines) and re.fullmatch(r'[\\d\\s/.,]+', lines[i+1]):
                    prices = extract_price_list(lines[i+1])
                    if prices:
                        skip_next = True

                if not variant_names:
                    variant_names = [f"Option {idx+1}" for idx in range(len(prices) or 1)]

                if base_name not in temp_items:
                    temp_items[base_name] = []

                for idx, vname in enumerate(variant_names):
                    price_val = prices[idx] if idx < len(prices) else ""
                    temp_items[base_name].append({
                        "variation": vname,
                        "price": price_val,
                        "line": line
                    })
                previous_item_name = base_name
                continue

            price_match = re.search(price_pattern, line)
            if price_match:
                prices_in_line = extract_price_list(line)
                price = prices_in_line[0].strip() if prices_in_line else price_match.group(1).strip()
                remaining_text = re.sub(re.escape(price_match.group(1)), "", line, count=1).strip()
                
                dietary_prefix = ""
                for diet in dietary_keywords:
                    if re.search(rf'\\b{diet}\\b', remaining_text, re.IGNORECASE):
                        dietary_prefix = diet.capitalize()
                        break

                found_var = ""
                for var in variation_keywords:
                    if re.search(rf'\\b{var}\\b', remaining_text, re.IGNORECASE):
                        found_var = var.capitalize()
                        remaining_text = re.sub(rf'\\b{var}\\b', '', remaining_text, flags=re.IGNORECASE).strip()
                        break
                
                base_name = remaining_text.strip(', ').strip()
                if not base_name and i > 0:
                    prev_line = lines[i-1]
                    if not re.search(price_pattern, prev_line):
                        base_name = prev_line[:50]
                
                base_name = clean_name(base_name)

                if base_name:
                    if dietary_prefix:
                        if dietary_prefix.lower() not in base_name.lower():
                            base_name = f"{dietary_prefix} {base_name}"
                        
                    if base_name not in temp_items:
                        temp_items[base_name] = []
                    temp_items[base_name].append({
                        "variation": found_var,
                        "price": price,
                        "line": line
                    })
                    previous_item_name = base_name
            else:
                if line and not variant_line_pattern.search(line) and re.search(r'[A-Za-z]', line):
                    previous_item_name = clean_name(line)

        for base_name, variations in temp_items.items():
            if len(variations) > 1:
                parent = {col: "" for col in self.columns}
                parent["Name"] = base_name
                parent["Item_Online_DisplayName"] = base_name
                parent["Price"] = "0"
                parent["Goods_Services"] = "Services"
                data.append(parent)
                
                for v in variations:
                    child = {col: "" for col in self.columns}
                    child["Name"] = base_name
                    child["Item_Online_DisplayName"] = base_name
                    child["Variation_Name"] = v["variation"]
                    child["Price"] = v["price"]
                    child["Description"] = v["line"]
                    child["Goods_Services"] = "Services"
                    data.append(child)
            else:
                v = variations[0]
                row = {col: "" for col in self.columns}
                row["Name"] = base_name
                row["Item_Online_DisplayName"] = base_name
                row["Variation_Name"] = v["variation"]
                row["Price"] = v["price"]
                row["Description"] = v["line"]
                row["Goods_Services"] = "Services"
                data.append(row)
                
        return data

    def process_file(self, file_path):
        if not os.path.exists(file_path):
            return f"Error: File {file_path} not found."

        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            text = self.extract_from_pdf(file_path)
        elif ext in ['.jpg', '.jpeg', '.png']:
            text = self.extract_from_image(file_path)
        else:
            return f"Error: Unsupported file format {ext}."
        
        if not text.strip():
            return "Error: No text could be extracted from the file."

        parsed_data = self.parse_text(text)
        if not parsed_data:
            return "No structured data could be identified in the document."
            
        df = pd.DataFrame(parsed_data, columns=self.columns)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"extracted_data_{timestamp}.csv"
        df.to_csv(output_filename, index=False)
        return f"Successfully extracted {len(parsed_data)} items to {output_filename}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python extractor.py <path_to_document>")
    else:
        extractor = DocExtractor()
        result = extractor.process_file(sys.argv[1])
        print(result)
`;
