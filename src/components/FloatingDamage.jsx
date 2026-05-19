import React from 'react';
import { TILE, VIEW_W, VIEW_H } from '../constants.js';

const LIFETIME_MS = 800;

// Stateless presentational component. Renders the rising/fading damage
// numbers for swings the player landed and swings the player took. The
// game logic decides WHEN to spawn; this only handles HOW they look.
export function FloatingDamage({ items, view }) {
  if (!items || items.length === 0) return null;
  const now = Date.now();
  return (
    <>
      {items.map(f => {
        if (f.x < view.x || f.x >= view.x + VIEW_W || f.y < view.y || f.y >= view.y + VIEW_H) return null;
        const age = now - f.ts;
        if (age >= LIFETIME_MS) return null;
        const t = age / LIFETIME_MS;
        const opacity = 1 - t;
        const rise = t * 30;
        return (
          <div key={`dmg-${f.id}`} className="absolute pointer-events-none z-20 font-bold"
            style={{
              left: (f.x - view.x) * TILE + TILE / 2 - 14,
              top: (f.y - view.y) * TILE - 4 - rise,
              width: 28,
              textAlign: 'center',
              fontSize: 13,
              color: f.color === 'red' ? '#ff5555' : '#ffffff',
              textShadow: '0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)',
              opacity,
            }}>
            -{f.value}
          </div>
        );
      })}
    </>
  );
}
