import React, { useEffect, useRef } from 'react';
import { BUILDINGS } from '../data/buildings.js';
import { getMenuActions, ACTION_LABELS } from '../logic/buildings.js';

// Floating action menu shown next to a clicked building. Click-outside +
// Escape close it.
//
// Props:
//   state, selectedBuilding = { x, y, b }, view, onAction(actionId), onClose()
export function BuildingActionMenu({ state, selectedBuilding, view, onAction, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!selectedBuilding) return null;
  const { b } = selectedBuilding;
  const def = BUILDINGS[b.type];
  if (!def) return null;

  // Tile pixel coords are scaled by mapScale at the MapView wrapper level.
  // We use the same untransformed coordinates here — the menu mounts inside
  // the same scaled container.
  const TILE_PX = 32;
  const left = (b.x - view.x) * TILE_PX + TILE_PX + 6;
  const top = (b.y - view.y) * TILE_PX - 4;

  const actions = getMenuActions(b, state);

  return (
    <div
      ref={ref}
      className="absolute z-40 bg-slate-900/95 border border-slate-600 rounded shadow-xl text-xs text-slate-100"
      style={{ left, top, minWidth: 180 }}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-2 py-1 border-b border-slate-700 font-bold text-sky-300 flex items-center justify-between">
        <span>{def.emoji} {def.name}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white px-1 leading-none">✕</button>
      </div>
      {b.hp !== undefined && b.maxHp && (
        <div className="px-2 py-1 text-slate-300 border-b border-slate-700">
          HP: {b.hp}/{b.maxHp}
        </div>
      )}
      {b.type === 'spike_trap' && (
        <div className="px-2 py-1 text-slate-300 border-b border-slate-700">
          Uses left: {b.usesLeft ?? '?'}
        </div>
      )}
      <div className="py-1">
        {actions.map(id => {
          const lbl = ACTION_LABELS[id];
          if (!lbl) return null;
          return (
            <button
              key={id}
              onClick={() => onAction(id)}
              className="w-full text-left px-2 py-1 hover:bg-slate-700"
            >
              <div className="font-medium">{lbl.label}</div>
              <div className="text-slate-400 text-[10px]">{lbl.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
