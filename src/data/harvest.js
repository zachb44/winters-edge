// Harvest tuning constants. Trees and rocks now take multiple swings
// to fell — same auto-swing engine as combat, just a different
// target type and damage table.
//
// Pure data — no React.

import { T } from './tiles.js';

export const HARVEST_SWING_MS = 800;
export const STAMINA_PER_HARVEST_SWING = 3;
export const HARVEST_STAMINA_FLOOR = 3;
export const HARVEST_RANGE = 1; // adjacency

// Max HP per harvest-able tile. Looked up by tile id (T.TREE / T.ROCK).
export const TILE_HP = {
  [T.TREE]: 4,
  [T.ROCK]: 5,
};

// Compute outgoing damage for one harvest swing. Pure.
// - Trees: 1 base, +1 if hatchet equipped, +1 per 3 Foraging levels.
// - Rocks: 1 base, +1 per 3 Crafting levels (no Mining skill yet).
export function computeHarvestDamage(state, tile) {
  let dmg = 1;
  if (tile === T.TREE) {
    if (state.inventory.hatchet > 0) dmg += 1;
    dmg += Math.floor((state.skills?.foraging || 1) / 3);
  } else if (tile === T.ROCK) {
    dmg += Math.floor((state.skills?.crafting || 1) / 3);
  }
  return Math.max(1, dmg);
}
