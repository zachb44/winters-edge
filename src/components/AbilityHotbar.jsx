import React from 'react';
import { getAbilityDef } from '../data/abilities.js';
import { isCooldownReady, getRemainingCooldown, formatCooldown, getCharges } from '../logic/abilities.js';

// Renders unlocked active abilities. Passives are silently skipped. Click a
// button to activate; the parent decides whether the activation succeeds.
export function AbilityHotbar({ state, onActivate }) {
  const ids = state.player?.abilities || [];
  const active = ids
    .map(id => getAbilityDef(id))
    .filter(d => d && d.kind === 'active');
  if (active.length === 0) return null;

  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {active.map(def => {
        const charges = def.charges ? getCharges(state, def.id) : 0;
        const cdRemaining = getRemainingCooldown(state, def.id);
        const ready = isCooldownReady(state, def.id) && !(def.charges && charges > 0);
        const tip = `${def.name}: ${def.desc}${def.stub ? ' (Not yet implemented)' : ''}`;
        return (
          <button
            key={def.id}
            title={tip}
            onClick={() => onActivate(def.id)}
            disabled={!ready}
            className={`relative w-12 h-12 rounded border ${ready ? 'border-amber-500 bg-slate-800 hover:bg-slate-700' : 'border-slate-700 bg-slate-900/60 cursor-not-allowed'} flex items-center justify-center`}
          >
            <span className={`text-2xl ${ready ? '' : 'opacity-40'}`}>{def.emoji}</span>
            {def.charges && charges > 0 && (
              <span className="absolute bottom-0 right-0 text-[10px] font-bold text-amber-300 bg-slate-900/80 rounded px-1">
                {charges}
              </span>
            )}
            {cdRemaining && (
              <span className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-[10px] text-slate-200 bg-slate-900/70 rounded">
                {formatCooldown(cdRemaining)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
