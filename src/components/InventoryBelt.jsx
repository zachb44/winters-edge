import React from 'react';

// 6 placeholder inventory slots — future home for items the player picks up
// off the ground (or stashes from corpses/loot). For now they're empty,
// disabled, and only there visually to reserve the layout.
const SLOT_COUNT = 6;

export function InventoryBelt() {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: SLOT_COUNT }).map((_, i) => (
        <div
          key={i}
          title="Inventory slot (pickup coming soon)"
          className="w-12 h-12 rounded border border-slate-800 bg-slate-900/40 flex items-center justify-center"
        >
          <span className="text-slate-700 text-lg select-none">·</span>
        </div>
      ))}
    </div>
  );
}
