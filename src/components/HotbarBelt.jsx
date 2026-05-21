import React from 'react';

// Fixed-slot consumables belt. Hotkeys 1-6 map to these slots in order.
// Each slot is locked to one item type so the hotkey under your finger
// always means the same thing — even after you eat your last cooked meat.
export const BELT_SLOTS = [
  { key: 'cooked_meat', icon: '🍗', label: 'Cooked Meat' },
  { key: 'food',        icon: '🥫', label: 'Ration' },
  { key: 'dried_meat',  icon: '🥓', label: 'Dried Meat' },
  { key: 'raw_meat',    icon: '🍖', label: 'Raw Meat' },
  { key: 'fat',         icon: '🟡', label: 'Fat' },
  { key: 'medkit',      icon: '🏥', label: 'Medkit' },
];

export function HotbarBelt({ inventory, onConsume }) {
  return (
    <div className="flex gap-1.5">
      {BELT_SLOTS.map((slot, i) => {
        const count = inventory?.[slot.key] || 0;
        const empty = count <= 0;
        return (
          <button
            key={slot.key}
            onClick={() => !empty && onConsume(slot.key)}
            disabled={empty}
            title={`${slot.label}${empty ? ' (empty)' : ` — press ${i + 1}`}`}
            className={`relative w-12 h-12 rounded border ${empty
              ? 'border-slate-800 bg-slate-900/60 cursor-not-allowed'
              : 'border-amber-700 bg-slate-800 hover:bg-slate-700 cursor-pointer'} flex items-center justify-center`}
          >
            <span className={`text-2xl ${empty ? 'opacity-25' : ''}`}>{slot.icon}</span>
            <span className="absolute top-0 left-0.5 text-[9px] text-slate-400 leading-none">
              {i + 1}
            </span>
            {!empty && (
              <span className="absolute bottom-0 right-0.5 text-[10px] font-bold text-amber-200 bg-slate-900/70 rounded px-0.5">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
