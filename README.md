# Menu File Extractor (Petpooja POS Ready)

A production-ready web application that extracts restaurant menu items from images (JPG, PNG, WebP), PDFs, spreadsheets, and raw text into the standard **11-column Petpooja POS format** with automatic parent-child variation structuring using **Google Gemini 2.5 Flash**.

---

## Features

- **Petpooja 11-Column Format Compliant**:
  1. `Name`
  2. `Item_Online_DisplayName`
  3. `Variation_Name`
  4. `Price` (Parent dishes have `Price = 0`, followed by Child variations)
  5. `Category`
  6. `Category_Online_DisplayName`
  7. `Short_Code`
  8. `Short_Code_2`
  9. `Description`
  10. `Attributes` (`Veg`, `Non-Veg`, `Egg`)
  11. `Goods_Services` (`Goods`)
- **Multi-Format Extraction Support**:
  - **PDF Documents** (`.pdf`): High-resolution scanned or digital menu booklets.
  - **Menu Images** (`.jpg`, `.png`, `.webp`, `.tiff`): Photos of physical paper menus, rate cards, and board menus.
  - **Word Documents** (`.docx`, `.doc`): Restaurant menu drafts, rate lists, and typed documents parsed via Mammoth.
  - **Excel & Spreadsheets** (`.xlsx`, `.xls`, `.csv`): Multi-sheet workbooks, price lists, and POS exports parsed via SheetJS.
  - **Raw Text / WhatsApp**: Paste unformatted chat text or messages directly.
- **Variation Parent-Child Engine**: Automatically parses portions like "Half / Full", "Small / Medium / Large", and slash-separated prices (e.g., `120/220`).
- **Interactive Editing**: Inline editable cells, row duplication, deletion, search, category & dietary filters.
- **One-Click Export**: Download Petpooja-ready `.xlsx` (Excel), `.csv`, or copy TSV to clipboard for direct paste into Google Sheets.

---

## Deploying on Vercel (Live Website)

This repository is pre-configured with `vercel.json` for instant deployment on Vercel.

### Option 1: Direct GitHub Import (Recommended)

1. Push or export this repository to GitHub:
   ```bash
   git add .
   git commit -m "Add full menu extractor app"
   git push origin main
   ```
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Select your GitHub repository (`Riteshnewmenucreat`) and click **Import**.
4. Leave settings as detected:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

Your website will be live in under 60 seconds!

### Gemini API Key Configuration on Vercel

The app gives users two convenient ways to use Gemini:
- **In-App Key Input**: Any user can click the **API Key** button in the header and enter their free Google Gemini API key. It is saved securely in their browser's `localStorage`.
- **Server Environment Variable**: In your Vercel Project Settings &gt; **Environment Variables**, you can add `GEMINI_API_KEY`.

---

## Local Development

Prerequisite: Node.js 20 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Credits

© 2026 Menu Intelligence Platform • Crafted for Petpooja POS Menu Digitization.
