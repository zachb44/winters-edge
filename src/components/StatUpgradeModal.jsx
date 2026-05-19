import React from 'react';
import { STAT_UPGRADES } from '../data/leveling.js';

// Modal that lets the player spend a single stat point. The parent owns
// state and applies the upgrade via STAT_UPGRADES[key].apply(state).
// This component is purely presentational.
export function StatUpgradeModal({ open, state, onPick, onClose }) {
  if (!open) return null;
  const pending = state.unspentStatPoints || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800/95 rounded-lg border-2 border-amber-600/60 shadow-2xl max-w-lg w-[90%]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-3 border-b border-slate-700">
          <div className="font-bold text-amber-300 text-sm">⭐ Choose Your Upgrade ({pending} unspent)</div>
          <button onClick={onClose} className="text-slate-400 hover:text-white px-2 leading-none text-lg">✕</button>
        </div>
        <div className="p-3 space-y-2 text-xs">
          {Object.entries(STAT_UPGRADES).map(([key, def]) => {
            const count = state.statUpgrades?.[key] || 0;
            return (
              <button key={key} onClick={() => onPick(key)}
                className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{def.icon}</span>
                  <span className="font-bold text-base">{def.name}</span>
                  <span className="ml-auto text-slate-400 text-xs">Times upgraded: {count}</span>
                </div>
                <div className="text-slate-300">{def.desc}</div>
                <div className="text-amber-300 mt-1">{def.preview(state)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
