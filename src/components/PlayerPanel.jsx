import React from 'react';
import { PROFESSIONS } from '../data/professions.js';
import { levelProgress } from '../data/leveling.js';
import { LevelButton } from './LevelButton.jsx';
import { AbilityHotbar } from './AbilityHotbar.jsx';
import { HotbarBelt } from './HotbarBelt.jsx';
import { InventoryBelt } from './InventoryBelt.jsx';

// Default center-zone content when no building is selected. Identity strip
// (portrait, name, profession, level + XP bar + level-up button) sits at
// the top; ability hotbar in the middle; consumables + inventory at the
// bottom.
export function PlayerPanel({ state, onConsume, onActivateAbility, onOpenStatModal }) {
  const prof = PROFESSIONS[state.profession];
  const progress = levelProgress(state);
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[340px]">
      <div className="flex items-center gap-3 w-full">
        <div className="text-5xl leading-none">{prof?.emoji || '🧍'}</div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-200 text-sm leading-tight truncate">{state.player.name}</span>
            <span className="text-[11px] text-amber-300 leading-tight">Lv {state.characterLevel || 1}</span>
            <LevelButton pending={state.unspentStatPoints || 0} onClick={onOpenStatModal} />
          </div>
          <div className="text-[11px] text-slate-300 leading-tight">{prof?.name}</div>
          <div className="mt-0.5 h-1 bg-slate-900 rounded overflow-hidden border border-slate-700" style={{ width: 140 }}>
            <div className="h-full bg-amber-400" style={{ width: `${(progress.pct || 0) * 100}%` }} />
          </div>
        </div>
      </div>
      <AbilityHotbar state={state} onActivate={onActivateAbility} />
      <div className="flex items-center gap-2">
        <HotbarBelt inventory={state.inventory} onConsume={onConsume} />
        <div className="w-px h-12 bg-slate-700" />
        <InventoryBelt />
      </div>
    </div>
  );
}
