import React from 'react';
import { TILE, VIEW_W, VIEW_H } from '../constants.js';

// HP bar above the targeted animal + crossed-swords icon between
// player and target. Stateless: receives combatTarget, animals,
// player position. No game logic here.
export function CombatOverlay({ combatTarget, combatTargetType, animals, zombies = [], player, view }) {
  if (combatTarget == null) return null;
  const target = combatTargetType === 'zombie'
    ? zombies.find(z => z.id === combatTarget && z.hp > 0)
    : animals.find(a => a.id === combatTarget && a.hp > 0);
  if (!target) return null;
  const inView = target.x >= view.x && target.x < view.x + VIEW_W
              && target.y >= view.y && target.y < view.y + VIEW_H;
  if (!inView) return null;
  const maxHp = target.maxHp || 100;
  const pct = Math.max(0, Math.min(1, target.hp / maxHp));
  // Place the crossed-swords roughly midway between player and target tile.
  const swordX = ((target.x + player.x) / 2 - view.x) * TILE + TILE / 2 - 9;
  const swordY = ((target.y + player.y) / 2 - view.y) * TILE - 4;
  return (
    <>
      <div className="absolute pointer-events-none z-20"
        style={{
          left: (target.x - view.x) * TILE,
          top: (target.y - view.y) * TILE - 6,
          width: TILE,
        }}>
        <div className="h-1 bg-black/70 rounded-full overflow-hidden mx-1">
          <div className="h-full bg-red-500 transition-all" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
      <div className="absolute pointer-events-none z-20 text-base"
        style={{ left: swordX, top: swordY, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}>
        ⚔️
      </div>
    </>
  );
}
