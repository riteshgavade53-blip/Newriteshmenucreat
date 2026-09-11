import React from 'react';
import { MenuItemRow } from '../types';
import { Layers, Utensils, Sliders, FolderTree, Leaf, Drumstick, Egg as EggIcon } from 'lucide-react';
import { getDietaryCounts } from '../utils/dietaryUtils';

interface StatsCardsProps {
  rows: MenuItemRow[];
  restaurantName?: string;
  currency?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  rows,
  restaurantName,
  currency = 'INR',
}) => {
  if (rows.length === 0) return null;

  const totalRows = rows.length;
  const categories = new Set(rows.map((r) => r.Category).filter(Boolean));
  const uniqueItemNames = new Set(rows.map((r) => r.Name).filter(Boolean));
  const variationRows = rows.filter((r) => r.Variation_Name && r.Variation_Name.trim() !== '');
  const dietaryCounts = getDietaryCounts(rows);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Output Rows */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Excel Rows
          </span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {totalRows}
          </span>
        </div>
      </div>

      {/* Unique Dishes */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Utensils className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Base Dishes
          </span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {uniqueItemNames.size}
          </span>
        </div>
      </div>

      {/* Variations */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Sliders className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Variations (Sizes)
          </span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {variationRows.length}
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <FolderTree className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Categories
          </span>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {categories.size}
          </span>
        </div>
      </div>

      {/* Veg / Non-Veg / Egg Split */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            Veg / Non-Veg / Egg
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded"
              title={`${dietaryCounts.veg} Vegetarian Items`}
            >
              <Leaf className="w-3 h-3 text-emerald-600" /> {dietaryCounts.veg}
            </span>
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded"
              title={`${dietaryCounts.nonVeg} Non-Vegetarian Items`}
            >
              <Drumstick className="w-3 h-3 text-rose-600" /> {dietaryCounts.nonVeg}
            </span>
            {dietaryCounts.egg > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded"
                title={`${dietaryCounts.egg} Egg Items`}
              >
                <EggIcon className="w-3 h-3 text-amber-600" /> {dietaryCounts.egg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
