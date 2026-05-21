// Pure-ish action handlers for building action menus. Each handler takes
// `(state, building)` and returns a new state. Log messages use pushLog.
//
// Building HP / usesLeft live on the placed building instance; static fields
// (cost, refund table) live on BUILDINGS in src/data/buildings.js.

import { BUILDINGS } from '../data/buildings.js';
import { ITEM_INFO } from '../data/loot.js';
import { getRecipe } from '../data/recipes.js';
import { pushLog } from './log.js';

// Refund per building type. Pre-multiplied by HP% for destructible buildings.
const REFUND_TABLE = {
  campfire: { wood: 2, stone: 0, scrap: 0 },
  tent: { wood: 5, stone: 0, scrap: 1 },
  wall: { wood: 1, stone: 0, scrap: 0 },
  stockpile: { wood: 4, stone: 0, scrap: 1 },
  workbench: { wood: 6, stone: 2, scrap: 1 },
  trap: { wood: 2, stone: 0, scrap: 0 },
  barricade: { wood: 3, stone: 1, scrap: 0 },
  reinforced_wall: { wood: 2, stone: 3, scrap: 1 },
  spike_trap: { wood: 1, stone: 1, scrap: 0 },
};

export function getRefund(b) {
  const base = REFUND_TABLE[b.type] || { wood: 0, stone: 0, scrap: 0 };
  if (b.hp !== undefined && b.maxHp) {
    const pct = Math.max(0, b.hp / b.maxHp);
    return {
      wood: Math.floor(base.wood * pct),
      stone: Math.floor(base.stone * pct),
      scrap: Math.floor(base.scrap * pct),
    };
  }
  return base;
}

// Returns the list of action ids relevant for this building, in display order.
export function getMenuActions(b, state) {
  const ids = [];
  if (b.type === 'campfire') {
    if ((state.inventory.wood || 0) > 0) ids.push('add_wood');
    if ((state.inventory.raw_meat || 0) > 0 && (b.fuel || 0) > 0) ids.push('cook_meat');
    if ((b.fuel || 0) > 0) ids.push('rest_here');
  } else if (b.type === 'tent') {
    // Sleep skips through the night — only meaningful in Wilderness Mode.
    // In Outbreak Mode the night IS the threat, so sleeping past it would
    // defeat the purpose of building defenses and engaging the horde.
    if (state.mode !== 'outbreak' && (state.time > 19 || state.time < 6)) ids.push('sleep');
  } else if (b.type === 'trap') {
    ids.push('check_trap');
  } else if (b.type === 'workbench') {
    // The workbench panel renders its own crafting recipe list — no
    // generic action button needed beyond Demolish (added below).
  } else if (b.type === 'barricade' || b.type === 'reinforced_wall') {
    if (b.hp !== undefined && b.maxHp && b.hp < b.maxHp) ids.push('repair');
  }
  ids.push('demolish');
  return ids;
}

export const ACTION_LABELS = {
  add_wood: { label: '🔥 Add Wood', desc: '+4 fuel per wood' },
  cook_meat: { label: '🍳 Cook Raw Meat', desc: '1 raw → 1 cooked' },
  rest_here: { label: '🛌 Rest Here', desc: '(Not yet implemented)' },
  sleep: { label: '😴 Sleep Until Dawn', desc: '+30 warmth, full stamina' },
  check_trap: { label: '🪤 Check Trap', desc: 'Collect catch if any' },
  repair: { label: '🔨 Repair', desc: '+25 HP' },
  demolish: { label: '⛏️ Demolish', desc: 'Refund partial materials' },
};

// === Action handlers ===
// Each handler returns new state.

export function actionAddWood(state, b) {
  if ((state.inventory.wood || 0) < 1) return pushLog(state, 'No wood to add.');
  let s = { ...state, inventory: { ...state.inventory } };
  s.inventory.wood -= 1;
  s.buildings = s.buildings.map(x => x === b ? { ...x, fuel: Math.min(20, (x.fuel || 0) + 4), wentOutLogged: false } : x);
  return pushLog(s, '🔥 Added wood to fire (+4 fuel)');
}

export function actionCookMeat(state, b) {
  if ((state.inventory.raw_meat || 0) < 1) return pushLog(state, 'No raw meat to cook.');
  if ((b.fuel || 0) <= 0) return pushLog(state, 'Fire is out.');
  let s = { ...state, inventory: { ...state.inventory } };
  s.inventory.raw_meat -= 1;
  s.inventory.cooked_meat = (s.inventory.cooked_meat || 0) + 1;
  s.buildings = s.buildings.map(x => x === b ? { ...x, fuel: Math.max(0, x.fuel - 0.5) } : x);
  return pushLog(s, '🍳 Cooked raw meat');
}

export function actionRestHere(state) {
  // Stub — full "rest" loop with click-to-stand deferred.
  return pushLog(state, '🛌 Rest Here: not yet implemented.');
}

export function actionSleep(state, b) {
  if (state.mode === 'outbreak') return pushLog(state, '🧟 No time to sleep — the dead are coming.');
  if (!(state.time > 19 || state.time < 6)) return pushLog(state, 'Too early to sleep.');
  let s = { ...state, player: { ...state.player } };
  // Skip to 7:00 the next day-rollover. If we're past 19:00, advance to 7
  // the next day. If we're before 6:00, advance to 7 today.
  if (s.time >= 19) {
    s.day += 1;
    s.time = 7;
  } else {
    s.time = 7;
  }
  s.player.warmth = Math.min(s.player.maxWarmth ?? 100, s.player.warmth + 30);
  s.player.stamina = s.player.maxStamina ?? 100;
  s = pushLog(s, '😴 Slept until dawn (+30 warmth, full stamina).');
  return s;
}

export function actionCheckTrap(state, b) {
  if (!b.caught) return pushLog(state, 'Trap is empty.');
  let s = { ...state, inventory: { ...state.inventory } };
  s.inventory.raw_meat = (s.inventory.raw_meat || 0) + 1;
  s.buildings = s.buildings.map(x => x === b ? { ...x, caught: false } : x);
  return pushLog(s, '🐰 Trap caught small game (+1 raw meat)');
}

// Deducts a recipe's costs and adds its output to inventory. No-op if the
// recipe is unknown or the player can't afford it (with a log line).
export function applyCraft(state, recipeId) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return state;
  for (const [item, qty] of Object.entries(recipe.costs)) {
    if ((state.inventory[item] || 0) < qty) {
      return pushLog(state, `Not enough materials for ${recipe.name}.`);
    }
  }
  let s = { ...state, inventory: { ...state.inventory } };
  for (const [item, qty] of Object.entries(recipe.costs)) {
    s.inventory[item] = (s.inventory[item] || 0) - qty;
  }
  s.inventory[recipe.output.item] = (s.inventory[recipe.output.item] || 0) + recipe.output.qty;
  const info = ITEM_INFO[recipe.output.item];
  const icon = info?.icon || recipe.icon;
  const label = recipe.output.qty > 1 ? `${recipe.output.qty}× ${recipe.name}` : recipe.name;
  return pushLog(s, `🔨 Crafted ${icon} ${label}.`);
}

export function actionRepair(state, b) {
  const def = BUILDINGS[b.type];
  if (!def || b.hp === undefined) return state;
  if (b.hp >= b.maxHp) return pushLog(state, '🛡️ Already at full HP.');
  const repairCost = b.type === 'barricade'
    ? { wood: 2, stone: 0 }
    : { wood: 1, stone: 2 };
  if ((state.inventory.wood || 0) < repairCost.wood || (state.inventory.stone || 0) < repairCost.stone) {
    return pushLog(state, 'Not enough resources to repair.');
  }
  let s = { ...state, inventory: { ...state.inventory } };
  s.inventory.wood -= repairCost.wood;
  s.inventory.stone -= repairCost.stone;
  const newHp = Math.min(b.maxHp, b.hp + 25);
  s.buildings = s.buildings.map(x => x === b ? { ...x, hp: newHp } : x);
  return pushLog(s, `🔨 Repaired ${def.name.toLowerCase()} (+25 HP)`);
}

export function actionDemolish(state, b) {
  const refund = getRefund(b);
  let s = { ...state, inventory: { ...state.inventory } };
  if (refund.wood > 0) s.inventory.wood = (s.inventory.wood || 0) + refund.wood;
  if (refund.stone > 0) s.inventory.stone = (s.inventory.stone || 0) + refund.stone;
  if (refund.scrap > 0) s.inventory.scrap = (s.inventory.scrap || 0) + refund.scrap;
  s.buildings = s.buildings.filter(x => x !== b);
  const parts = [];
  if (refund.wood > 0) parts.push(`${refund.wood}🪵`);
  if (refund.stone > 0) parts.push(`${refund.stone}🪨`);
  if (refund.scrap > 0) parts.push(`${refund.scrap}🔧`);
  const def = BUILDINGS[b.type];
  const refundMsg = parts.length > 0 ? ` (refund: ${parts.join(' ')})` : ' (no refund)';
  return pushLog(s, `⛏️ Demolished ${def?.name?.toLowerCase() || b.type}${refundMsg}.`);
}

// Dispatch entry point. Returns new state.
export function applyBuildingAction(state, b, actionId) {
  switch (actionId) {
    case 'add_wood':       return actionAddWood(state, b);
    case 'cook_meat':      return actionCookMeat(state, b);
    case 'rest_here':      return actionRestHere(state);
    case 'sleep':          return actionSleep(state, b);
    case 'check_trap':     return actionCheckTrap(state, b);
    case 'repair':         return actionRepair(state, b);
    case 'demolish':       return actionDemolish(state, b);
    default:               return state;
  }
}
