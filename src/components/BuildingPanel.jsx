import React from 'react';
import { BUILDINGS } from '../data/buildings.js';
import { getMenuActions, ACTION_LABELS } from '../logic/buildings.js';
import { WorkbenchPanel } from './WorkbenchPanel.jsx';

// In-HUD building action panel. Shown in the bottom-HUD center zone when a
// building is selected. Replaces the old floating BuildingActionMenu popup.
export function BuildingPanel({ state, selectedBuilding, onAction, onCraft, onClose }) {
  if (!selectedBuilding) return null;
  const { b } = selectedBuilding;
  const def = BUILDINGS[b.type];
  if (!def) return null;
  const actions = getMenuActions(b, state);

  const statusLine = (() => {
    if (b.type === 'campfire') return `Fuel: ${Math.floor(b.fuel || 0)}/20`;
    if (b.type === 'spike_trap') return `Uses left: ${b.usesLeft ?? '?'}`;
    if (b.hp !== undefined && b.maxHp) return `HP: ${b.hp}/${b.maxHp}`;
    if (b.type === 'trap') return b.caught ? 'Caught: small game' : 'Empty';
    if (b.type === 'workbench') return 'Craft items here';
    return null;
  })();

  const isWorkbench = b.type === 'workbench';

  return (
    <div className={`${isWorkbench ? 'min-w-[420px] max-w-[460px]' : 'min-w-[280px] max-w-[360px]'} flex flex-col gap-1.5 px-2`}>
      <div className="flex items-center gap-2">
        <div className="text-3xl leading-none">{def.emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-sky-200 text-sm leading-tight">{def.name}</div>
          {statusLine && <div className="text-[11px] text-slate-300 leading-tight">{statusLine}</div>}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2 leading-none text-lg"
          title="Deselect"
        >
          ✕
        </button>
      </div>
      {isWorkbench && (
        <WorkbenchPanel inventory={state.inventory} onCraft={onCraft} />
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {actions.map(id => {
            const lbl = ACTION_LABELS[id];
            if (!lbl) return null;
            return (
              <button
                key={id}
                onClick={() => onAction(id)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] px-2 py-1 rounded border border-slate-600"
                title={lbl.desc}
              >
                {lbl.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
