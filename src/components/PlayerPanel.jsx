import React from 'react';
import { PROFESSIONS } from '../data/professions.js';
import { AbilityHotbar } from './AbilityHotbar.jsx';
import { HotbarBelt } from './HotbarBelt.jsx';

// Default center-zone content when no building is selected. Big profession
// portrait, name, level, ability hotbar, consumables belt.
export function PlayerPanel({ state, onConsume, onActivateAbility }) {
  const prof = PROFESSIONS[state.profession];
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[260px]">
      <div className="flex items-center gap-3">
        <div className="text-5xl leading-none">{prof?.emoji || '🧍'}</div>
        <div className="flex flex-col">
          <div className="font-bold text-sky-200 text-sm leading-tight">{state.player.name}</div>
          <div className="text-[11px] text-slate-300 leading-tight">{prof?.name}</div>
          <div className="text-[11px] text-amber-300 leading-tight">Lv {state.characterLevel || 1}</div>
        </div>
      </div>
      <AbilityHotbar state={state} onActivate={onActivateAbility} />
      <HotbarBelt inventory={state.inventory} onConsume={onConsume} />
    </div>
  );
}
