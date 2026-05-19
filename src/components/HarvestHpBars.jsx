import React from 'react';
import { TILE, VIEW_W, VIEW_H } from '../constants.js';
import { TILE_HP } from '../data/harvest.js';

// Renders a thin HP bar above every tile in state.tileHp that's
// currently in view and still a tree/rock on the map. Sparse —
// only iterates tiles the player has actually struck.
export function HarvestHpBars({ tileHp, map, view }) {
  if (!tileHp) return null;
  const entries = Object.entries(tileHp);
  if (entries.length === 0) return null;
  return (
    <>
      {entries.map(([key, hp]) => {
        const parts = key.split(',');
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (x < view.x || x >= view.x + VIEW_W || y < view.y || y >= view.y + VIEW_H) return null;
        const tile = map[y]?.[x];
        const max = TILE_HP[tile];
        if (!max) return null;
        const pct = Math.max(0, Math.min(1, hp / max));
        return (
          <div key={`harv-${key}`} className="absolute pointer-events-none z-20"
            style={{
              left: (x - view.x) * TILE,
              top: (y - view.y) * TILE - 6,
              width: TILE,
            }}>
            <div className="h-1 bg-black/70 rounded-full overflow-hidden mx-1">
              <div className="h-full bg-red-400 transition-all" style={{ width: `${pct * 100}%` }} />
            </div>
          </div>
        );
      })}
    </>
  );
}
