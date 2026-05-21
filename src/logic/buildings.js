// Pure-ish action handlers for building action menus. Each handler takes
// `(state, building)` and returns a new state. Log messages use pushLog.
//
// Building HP / usesLeft live on the placed building instance; static fields
// (cost, refund table) live on BUILDINGS in src/data/buildings.js.

import { BUILDINGS } from '../data/buildings.js';
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
    if (state.time > 19 || state.time < 6) ids.push('sleep');
  } else if (b.type === 'trap') {
    ids.push('check_trap');
  } else if (b.type === 'workbench') {
    ids.push('open_crafting');
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
  open_crafting: { label: '🔨 Open Crafting', desc: 'Craft a Hatchet (3w/2s/1k)' },
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

export function actionCraftHatchet(state) {
  const cost = { wood: 3, stone: 2, scrap: 1 };
  if ((state.inventory.wood || 0) < cost.wood
      || (state.inventory.stone || 0) < cost.stone
      || (state.inventory.scrap || 0) < cost.scrap) {
    return pushLog(state, 'Not enough materials for Hatchet (3w/2s/1k).');
  }
  let s = { ...state, inventory: { ...state.inventory } };
  s.inventory.wood -= cost.wood;
  s.inventory.stone -= cost.stone;
  s.inventory.scrap -= cost.scrap;
  s.inventory.hatchet = (s.inventory.hatchet || 0) + 1;
  return pushLog(s, '🔨 Crafted a Hatchet.');
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
    case 'open_crafting':  return actionCraftHatchet(state);
    case 'repair':         return actionRepair(state, b);
    case 'demolish':       return actionDemolish(state, b);
    default:               return state;
  }
}
