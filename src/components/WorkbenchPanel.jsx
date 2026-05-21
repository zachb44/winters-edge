import React from 'react';
import { RECIPES } from '../data/recipes.js';
import { ITEM_INFO } from '../data/loot.js';

// Workbench crafting list. Renders inside the BuildingPanel when the
// selected building is a workbench. Scroll-capped so it doesn't blow up
// the HUD when more recipes get added later.
export function WorkbenchPanel({ inventory, onCraft }) {
  return (
    <div className="w-[420px] max-w-full flex flex-col gap-1">
      <div className="text-[11px] text-slate-300 italic">Craft items here.</div>
      <div className="overflow-y-auto pr-1" style={{ maxHeight: 160 }}>
        {RECIPES.map(r => {
          const costEntries = Object.entries(r.costs);
          const canAfford = costEntries.every(([k, q]) => (inventory[k] || 0) >= q);
          return (
            <div
              key={r.id}
              className="flex items-center gap-2 px-1.5 py-1 border-b border-slate-800 last:border-b-0"
            >
              <div className="text-2xl leading-none">{r.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sky-200 text-[12px] leading-tight">{r.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight truncate">{r.desc}</div>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {costEntries.map(([item, qty]) => {
                    const have = inventory[item] || 0;
                    const ok = have >= qty;
                    const icon = ITEM_INFO[item]?.icon || '';
                    return (
                      <span
                        key={item}
                        className={`text-[10px] ${ok ? 'text-emerald-300' : 'text-red-400'}`}
                      >
                        {icon} {have}/{qty}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => canAfford && onCraft(r.id)}
                disabled={!canAfford}
                className={`text-[11px] px-2 py-1 rounded border ${canAfford
                  ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                Craft
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
