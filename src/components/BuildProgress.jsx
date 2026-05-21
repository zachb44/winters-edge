import React from 'react';
import { TILE } from '../constants.js';
import { BUILDINGS } from '../data/buildings.js';

// Ghost preview + progress bar for an in-flight build.
//
// Props:
//   activeBuild = { buildingType, x, y, startDay, startTime, durationMinutes }
//   currentDay, currentTime  (game-time)
//   view = { x, y }
export function BuildProgress({ activeBuild, currentDay, currentTime, view }) {
  if (!activeBuild) return null;
  const def = BUILDINGS[activeBuild.buildingType];
  if (!def) return null;
  const elapsedHours = (currentDay * 24 + currentTime) - (activeBuild.startDay * 24 + activeBuild.startTime);
  const totalHours = activeBuild.durationMinutes / 60;
  const pct = Math.max(0, Math.min(1, totalHours > 0 ? elapsedHours / totalHours : 1));

  const left = (activeBuild.x - view.x) * TILE;
  const top = (activeBuild.y - view.y) * TILE;

  return (
    <div className="absolute pointer-events-none" style={{ left, top, width: TILE, height: TILE }}>
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 24, opacity: 0.5 }}>
        {def.emoji}
      </div>
      <div className="absolute left-0 right-0 bg-slate-900/70" style={{ bottom: -6, height: 4 }}>
        <div className="bg-amber-400 h-full" style={{ width: `${Math.floor(pct * 100)}%` }} />
      </div>
    </div>
  );
}
