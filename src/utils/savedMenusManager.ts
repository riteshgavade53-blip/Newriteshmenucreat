import { SavedMenu, SiteStats, MenuItemRow, MenuOutputLanguage } from '../types';
import * as XLSX from 'xlsx';

const STORAGE_SAVED_MENUS_KEY = 'pos_saved_menus_v1';
const STORAGE_STATS_KEY = 'pos_site_stats_v1';
const STORAGE_VISITOR_ID_KEY = 'pos_visitor_uuid_v1';

// Generate or retrieve persistent visitor UUID
export function getOrCreateVisitorId(): { visitorId: string; isNew: boolean } {
  if (typeof window === 'undefined') {
    return { visitorId: 'server', isNew: false };
  }
  let id = localStorage.getItem(STORAGE_VISITOR_ID_KEY);
  let isNew = false;
  if (!id) {
    id = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_VISITOR_ID_KEY, id);
    isNew = true;
  }
  return { visitorId: id, isNew };
}

// Local cache helpers
export function getLocalSavedMenus(): SavedMenu[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_MENUS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local saved menus:', e);
    return [];
  }
}

export function setLocalSavedMenus(menus: SavedMenu[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SAVED_MENUS_KEY, JSON.stringify(menus));
  } catch (e) {
    console.error('Error saving menus locally:', e);
  }
}

export function getLocalSiteStats(): SiteStats {
  if (typeof window === 'undefined') {
    return { totalVisits: 1, uniqueVisitors: 1, totalMenusSaved: 0, totalItemsProcessed: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_STATS_KEY);
    return raw
      ? JSON.parse(raw)
      : { totalVisits: 1, uniqueVisitors: 1, totalMenusSaved: 0, totalItemsProcessed: 0 };
  } catch {
    return { totalVisits: 1, uniqueVisitors: 1, totalMenusSaved: 0, totalItemsProcessed: 0 };
  }
}

export function setLocalSiteStats(stats: SiteStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * Record a visit on page load and return current statistics
 */
export async function trackVisit(): Promise<SiteStats> {
  const { visitorId, isNew } = getOrCreateVisitorId();
  let stats = getLocalSiteStats();

  // Try server sync
  try {
    const res = await fetch('/api/stats/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, isNew }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.stats) {
        setLocalSiteStats(data.stats);
        return data.stats;
      }
    }
  } catch (err) {
    // Fallback offline/static
  }

  // Local fallback increment
  stats = {
    ...stats,
    totalVisits: (stats.totalVisits || 0) + 1,
    uniqueVisitors: isNew ? (stats.uniqueVisitors || 0) + 1 : (stats.uniqueVisitors || 1),
    lastVisitTime: new Date().toISOString(),
  };
  setLocalSiteStats(stats);
  return stats;
}

/**
 * Fetch all saved menus (server + local fallback)
 */
export async function fetchAllSavedMenus(): Promise<SavedMenu[]> {
  const localMenus = getLocalSavedMenus();
  try {
    const res = await fetch('/api/saved-menus');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.menus)) {
        // Merge server and local menus (favor latest updatedAt/createdAt)
        const map = new Map<string, SavedMenu>();
        localMenus.forEach((m) => map.set(m.id, m));
        data.menus.forEach((m: SavedMenu) => map.set(m.id, m));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLocalSavedMenus(merged);
        return merged;
      }
    }
  } catch {
    // Return local
  }
  return localMenus;
}

/**
 * Save or update a menu record
 */
export async function saveMenu(params: {
  id?: string;
  restaurantName: string;
  rows: MenuItemRow[];
  sourceType: SavedMenu['sourceType'];
  sourceFileName?: string;
  currency?: string;
  notes?: string;
  outputLanguage?: MenuOutputLanguage;
}): Promise<SavedMenu> {
  const { id, restaurantName, rows, sourceType, sourceFileName, currency = 'INR', notes, outputLanguage } = params;

  // Compute category count
  const categories = new Set(rows.map((r) => r.Category.trim()).filter(Boolean));

  const newMenu: SavedMenu = {
    id: id || `menu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    restaurantName: restaurantName.trim() || 'Restaurant Menu',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceType,
    sourceFileName,
    itemCount: rows.length,
    categoryCount: categories.size || 1,
    currency,
    rows,
    notes,
    outputLanguage,
  };

  // 1. Update local storage immediately
  const current = getLocalSavedMenus();
  const existingIdx = current.findIndex((m) => m.id === newMenu.id);
  let updatedList: SavedMenu[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = newMenu;
  } else {
    updatedList = [newMenu, ...current];
  }
  setLocalSavedMenus(updatedList);

  // Update local stats
  const stats = getLocalSiteStats();
  stats.totalMenusSaved = updatedList.length;
  stats.totalItemsProcessed = (stats.totalItemsProcessed || 0) + rows.length;
  setLocalSiteStats(stats);

  // 2. Try server sync
  try {
    await fetch('/api/saved-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMenu),
    });
  } catch (e) {
    console.warn('Server sync failed, saved locally:', e);
  }

  return newMenu;
}

/**
 * Delete a saved menu
 */
export async function deleteSavedMenu(menuId: string): Promise<boolean> {
  // Update local storage
  const current = getLocalSavedMenus();
  const filtered = current.filter((m) => m.id !== menuId);
  setLocalSavedMenus(filtered);

  // Try server sync
  try {
    await fetch(`/api/saved-menus/${menuId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Server delete failed, deleted locally:', e);
  }

  return true;
}

/**
 * Export a saved menu directly to Excel (.xlsx)
 */
export function exportSavedMenuToExcel(menu: SavedMenu): void {
  const exportRows = menu.rows.map((r) => ({
    Name: r.Name || '',
    Item_Online_DisplayName: r.Name || r.Item_Online_DisplayName || '',
    Variation_Name: r.Variation_Name || '',
    Price: r.Price || '0',
    Category: r.Category || '',
    Category_Online_DisplayName: r.Category_Online_DisplayName || r.Category || '',
    Short_Code: r.Short_Code || '',
    Short_Code_2: r.Short_Code_2 || '',
    Description: r.Description || '',
    Attributes: r.Attributes || 'Veg',
    Goods_Services: '', // Strictly blank
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows, {
    header: [
      'Name',
      'Item_Online_DisplayName',
      'Variation_Name',
      'Price',
      'Category',
      'Category_Online_DisplayName',
      'Short_Code',
      'Short_Code_2',
      'Description',
      'Attributes',
      'Goods_Services',
    ],
  });

  const colWidths = [
    { wch: 26 }, // Name
    { wch: 26 }, // Item_Online_DisplayName
    { wch: 16 }, // Variation_Name
    { wch: 12 }, // Price
    { wch: 20 }, // Category
    { wch: 22 }, // Category_Online_DisplayName
    { wch: 14 }, // Short_Code
    { wch: 14 }, // Short_Code_2
    { wch: 32 }, // Description
    { wch: 14 }, // Attributes
    { wch: 16 }, // Goods_Services
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'POS_Menu');

  const cleanName = (menu.restaurantName || 'Menu')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  const dateStr = new Date(menu.createdAt).toISOString().split('T')[0];
  XLSX.writeFile(workbook, `menu_${cleanName}_${dateStr}.xlsx`);
}
