import React from 'react';
import { TILE } from '../constants.js';
import { BUILDINGS } from '../data/buildings.js';

// Ghost preview + progress bar for an in-flight build.
//
// Props:
//   activeBuild = { buildingType, x, y, durationMinutes, accumulatedHours, ... }
//   playerX, playerY  (to indicate paused state when player walks away)
//   view = { x, y }
export function BuildProgress({ activeBuild, playerX, playerY, view }) {
  if (!activeBuild) return null;
  const def = BUILDINGS[activeBuild.buildingType];
  if (!def) return null;
  const totalHours = activeBuild.durationMinutes / 60;
  const accumulated = activeBuild.accumulatedHours || 0;
  const pct = Math.max(0, Math.min(1, totalHours > 0 ? accumulated / totalHours : 1));
  const dist = Math.abs(playerX - activeBuild.x) + Math.abs(playerY - activeBuild.y);
  const paused = dist > 1;

  const left = (activeBuild.x - view.x) * TILE;
  const top = (activeBuild.y - view.y) * TILE;

  return (
    <div className="absolute pointer-events-none" style={{ left, top, width: TILE, height: TILE }}>
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 24, opacity: paused ? 0.3 : 0.55 }}>
        {def.emoji}
      </div>
      {paused && (
        <div className="absolute top-0 right-0 text-[10px] font-bold text-slate-200 bg-slate-900/80 rounded px-1">
          ⏸
        </div>
      )}
      <div className="absolute left-0 right-0 bg-slate-900/70" style={{ bottom: -6, height: 4 }}>
        <div className={paused ? 'bg-slate-500 h-full' : 'bg-amber-400 h-full'} style={{ width: `${Math.floor(pct * 100)}%` }} />
      </div>
    </div>
  );
}
