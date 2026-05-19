import React, { useState, useEffect, useRef, useCallback } from 'react';

const TILE = 32;
const MAP_W = 60;
const MAP_H = 45;
const VIEW_W = 20;
const VIEW_H = 15;
const VISION_RADIUS = 5;

const T = {
  SNOW: 0, TREE: 1, ROCK: 2, ICE: 3, WATER: 4,
  PLANE: 5, CABIN: 6, CAVE: 7, SAPLING: 8, TOWER: 9, CRATE: 10,
};

const CRASH_SITES = [
  { x: 28, y: 22, name: 'Central Tundra' },
  { x: 18, y: 24, name: 'Near the Lake' },
  { x: 36, y: 20, name: 'Eastern Plains' },
  { x: 22, y: 35, name: 'South Tundra' },
  { x: 32, y: 12, name: 'Northern Reach' },
];

function genMap(crashSite = null) {
  const map = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(T.SNOW));
  for (let y = 8; y < 20; y++) {
    for (let x = 4; x < 18; x++) {
      const dx = x - 11, dy = y - 14;
      if (dx*dx + dy*dy < 32) map[y][x] = T.ICE;
    }
  }
  for (let x = 16; x < 32; x++) { map[13][x] = T.ICE; map[14][x] = T.ICE; map[15][x] = T.ICE; }
  for (let y = 3; y < 16; y++) {
    for (let x = 38; x < 58; x++) {
      const dx = x - 48, dy = y - 9;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > 4 && d < 8 && Math.random() > 0.15) map[y][x] = T.TREE;
    }
  }
  for (let y = 30; y < 42; y++) {
    for (let x = 14; x < 32; x++) {
      const dx = x - 23, dy = y - 36;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > 3 && d < 6.5 && Math.random() > 0.35) map[y][x] = T.ROCK;
    }
  }
  for (let y = 33; y < 43; y++) {
    for (let x = 44; x < 56; x++) {
      if (Math.random() > 0.55) map[y][x] = T.ROCK;
    }
  }
  map[38][50] = T.CAVE;
  for (let y = 2; y < 12; y++) {
    for (let x = 2; x < 14; x++) {
      if (Math.random() > 0.6) map[y][x] = T.TREE;
    }
  }
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);
    if (map[y][x] === T.SNOW) map[y][x] = T.TREE;
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);
    if (map[y][x] === T.SNOW) map[y][x] = T.ROCK;
  }
  const site = crashSite || CRASH_SITES[Math.floor(Math.random() * CRASH_SITES.length)];
  const startX = site.x, startY = site.y;
  for (let y = startY - 2; y <= startY + 2; y++) {
    for (let x = startX - 2; x <= startX + 3; x++) {
      if (map[y] && (map[y][x] === T.TREE || map[y][x] === T.ROCK || map[y][x] === T.ICE)) map[y][x] = T.SNOW;
    }
  }
  map[startY][startX] = T.PLANE;
  if (map[startY] && map[startY][startX + 1] !== undefined) map[startY][startX + 1] = T.PLANE;
  if (map[startY - 1] && map[startY - 1][startX] !== undefined) map[startY - 1][startX] = T.PLANE;
  map[6][35] = T.CABIN;
  map[5][7] = T.CABIN;
  map[40][3] = T.TOWER;
  for (let y = 38; y <= 42; y++) {
    for (let x = 1; x <= 5; x++) {
      if (map[y] && (map[y][x] === T.TREE || map[y][x] === T.ROCK)) map[y][x] = T.SNOW;
    }
  }
  map[40][3] = T.TOWER;
  return { map, startX, startY, siteName: site.name };
}

const TILE_DATA = {
  [T.SNOW]: { color: '#e8eef5', walkable: true, name: 'Snow' },
  [T.TREE]: { color: '#2d4a3e', walkable: false, name: 'Tree', emoji: '🌲' },
  [T.ROCK]: { color: '#6b6b75', walkable: false, name: 'Rock', emoji: '🪨' },
  [T.ICE]: { color: '#bcd9e8', walkable: true, name: 'Ice' },
  [T.WATER]: { color: '#4a6b85', walkable: false, name: 'Water' },
  [T.PLANE]: { color: '#8b4a3a', walkable: false, name: 'Plane Wreckage', emoji: '✈️' },
  [T.CABIN]: { color: '#5a3a28', walkable: false, name: 'Abandoned Cabin', emoji: '🏚️' },
  [T.CAVE]: { color: '#2a2a35', walkable: true, name: 'Cave', emoji: '🕳️' },
  [T.SAPLING]: { color: '#5a7a5a', walkable: false, name: 'Sapling', emoji: '🌱' },
  [T.TOWER]: { color: '#3a3a4a', walkable: true, name: 'Radio Tower', emoji: '📡' },
  [T.CRATE]: { color: '#a87830', walkable: false, name: 'Supply Crate', emoji: '📦' },
};

const BUILDINGS = {
  campfire: { name: 'Campfire', emoji: '🔥', wood: 5, stone: 0, scrap: 0, desc: 'Provides warmth. Cook meat. Burns wood.' },
  tent: { name: 'Tent', emoji: '⛺', wood: 10, stone: 0, scrap: 2, desc: 'Shelter. Sleep at night.' },
  wall: { name: 'Wood Wall', emoji: '🟫', wood: 3, stone: 0, scrap: 0, desc: 'Blocks enemies.' },
  stockpile: { name: 'Stockpile', emoji: '📦', wood: 8, stone: 0, scrap: 1, desc: 'Increases storage.' },
  workbench: { name: 'Workbench', emoji: '🔨', wood: 12, stone: 4, scrap: 3, desc: 'Unlocks crafting.' },
  trap: { name: 'Snare Trap', emoji: '🪤', wood: 4, stone: 0, scrap: 1, desc: 'Catches small game.' },
};

const SCENARIOS = {
  rescue: { name: 'Wait for Rescue', desc: 'Survive 30 days. A rescue chopper is coming.', difficulty: 'Medium', icon: '🚁' },
  tower: { name: 'Reach the Radio Tower', desc: 'Bring 10 food, 5 wood, and your coat to the radio tower.', difficulty: 'Medium-Hard', icon: '📡' },
};

const LOOT_TABLES = {
  plane: {
    common: [['scrap',1,2,30],['food',1,1,25],['wood',1,3,20],['nothing',0,0,15]],
    uncommon: [['medkit',1,1,40],['cloth',1,2,35],['flare',1,1,25]],
    rare: [['rifle_part',1,1,60],['map_fragment',1,1,40]],
    weights: { common: 75, uncommon: 22, rare: 3 },
  },
  cabin: {
    common: [['wood',3,6,25],['food',1,2,25],['scrap',1,2,20],['cloth',1,2,15],['nothing',0,0,15]],
    uncommon: [['medkit',1,1,30],['fur_coat',1,1,20],['hatchet',1,1,20],['lantern',1,1,15],['dried_meat',2,3,15]],
    rare: [['hunting_bow',1,1,35],['snowshoes',1,1,30],['map_fragment',1,1,20],['rifle_part',1,1,15]],
    weights: { common: 60, uncommon: 32, rare: 8 },
  },
  crate: {
    common: [['food',2,4,35],['scrap',1,3,30],['wood',4,8,25],['cloth',1,2,10]],
    uncommon: [['medkit',1,2,35],['dried_meat',2,4,25],['flare',1,2,20],['lantern',1,1,20]],
    rare: [['rifle',1,1,30],['fur_coat',1,1,25],['hunting_bow',1,1,25],['snowshoes',1,1,20]],
    weights: { common: 50, uncommon: 38, rare: 12 },
  },
  bear: {
    common: [['raw_meat',6,10,100]],
    uncommon: [['pelts',1,3,60],['fat',2,4,40]],
    rare: [['rare_pelt',1,1,100]],
    weights: { common: 100, uncommon: 100, rare: 30 },
    multi: true,
  },
};

function rollLoot(entries) {
  const total = entries.reduce((s, e) => s + e[3], 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e[3];
    if (r <= 0) {
      const qty = e[1] + Math.floor(Math.random() * (e[2] - e[1] + 1));
      return { item: e[0], qty };
    }
  }
  return { item: 'nothing', qty: 0 };
}

function rollFromTable(name) {
  const table = LOOT_TABLES[name];
  if (!table) return [];
  const results = [];
  if (table.multi) {
    for (const tier of ['common','uncommon','rare']) {
      if (Math.random() * 100 < table.weights[tier] && table[tier]) results.push(rollLoot(table[tier]));
    }
  } else {
    const total = table.weights.common + table.weights.uncommon + table.weights.rare;
    let r = Math.random() * total;
    let tier = 'common';
    if (r < table.weights.common) tier = 'common';
    else if (r < table.weights.common + table.weights.uncommon) tier = 'uncommon';
    else tier = 'rare';
    results.push(rollLoot(table[tier]));
  }
  return results.filter(r => r.item !== 'nothing' && r.qty > 0);
}

const ITEM_INFO = {
  wood: { name: 'wood', icon: '🪵' }, stone: { name: 'stone', icon: '🪨' }, scrap: { name: 'scrap', icon: '🔧' },
  food: { name: 'ration', icon: '🥫' }, raw_meat: { name: 'raw meat', icon: '🍖' }, cooked_meat: { name: 'cooked meat', icon: '🍗' },
  fat: { name: 'fat', icon: '🟡' }, pelts: { name: 'pelt', icon: '🦊' }, rare_pelt: { name: 'bear pelt', icon: '🐻' },
  medkit: { name: 'medkit', icon: '🏥' }, cloth: { name: 'cloth', icon: '🧵' }, flare: { name: 'flare', icon: '🎆' },
  dried_meat: { name: 'dried meat', icon: '🥓' }, lantern: { name: 'lantern', icon: '🏮' }, hatchet: { name: 'hatchet', icon: '🪓' },
  hunting_bow: { name: 'hunting bow', icon: '🏹' }, rifle: { name: 'rifle', icon: '🎯' }, rifle_part: { name: 'rifle part', icon: '⚙️' },
  fur_coat: { name: 'fur coat', icon: '🧥' }, snowshoes: { name: 'snowshoes', icon: '👢' }, map_fragment: { name: 'map fragment', icon: '🗺️' },
};

const EVENT_TABLE = [
  { id: 'calm', weight: 25, min_day: 1, name: 'Calm Day', desc: 'The wilderness is quiet today.' },
  { id: 'wolf_pack', weight: 12, min_day: 3, name: 'Wolves Hunting Nearby', desc: '🐺 Wolf pack spotted. Aggressive tonight.' },
  { id: 'aurora', weight: 10, min_day: 1, name: 'Aurora Forecast', desc: '✨ Aurora tonight. Warmth drains less.' },
  { id: 'cold_snap', weight: 10, min_day: 4, name: 'Bitter Cold Snap', desc: '🥶 Warmth drains faster today.' },
  { id: 'deer_migration', weight: 9, min_day: 2, name: 'Deer Migration', desc: '🦌 Deer are moving through.' },
  { id: 'lost_traveler', weight: 7, min_day: 5, name: 'Lost Traveler', desc: '👤 A traveler approaches. Meet at your campfire.' },
  { id: 'cache_rumor', weight: 7, min_day: 3, name: 'Old Cache Rumor', desc: '📜 Hidden cache nearby. Supply crate dropping.' },
  { id: 'frozen_carcass', weight: 6, min_day: 2, name: 'Frozen Carcass', desc: '💀 You spot a carcass — free meat.' },
  { id: 'thaw', weight: 5, min_day: 6, name: 'Brief Thaw', desc: '☀️ Warm front. Vitals recover faster.' },
  { id: 'bear_roaming', weight: 5, min_day: 8, name: 'Bear on the Move', desc: '🐻 The bear has left its territory.' },
  { id: 'crate_signal', weight: 5, min_day: 4, name: 'Distant Engine', desc: '✈️ Plane overhead. Crate dropped.' },
  { id: 'blizzard_warning', weight: 4, min_day: 5, name: 'Storm Brewing', desc: '⛈️ Blizzard likely tonight.' },
];

function rollDailyEvent(day) {
  const valid = EVENT_TABLE.filter(e => day >= e.min_day);
  const total = valid.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of valid) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return valid[0];
}

const PROFESSIONS = {
  lumberjack: { name: 'Lumberjack', emoji: '🪓', playerEmoji: '🧔', desc: 'Spent years in timber camps. Cold doesn\u0027t bother you.',
    bonuses: ['+50% wood per chop', '+15% start warmth', 'Extra wood'], tradeoffs: ['-1 starting food'],
    startInv: { wood: 10, hatchet: 1, food: 2 }, mods: { woodBonus: 1.5, startWarmth: 95 } },
  hunter: { name: 'Hunter', emoji: '🏹', playerEmoji: '👨\u200d🌾', desc: 'A patient tracker who can read tracks and shoot straight.',
    bonuses: ['+25% damage vs animals', 'Deer flee less', 'Starts with bow'], tradeoffs: ['Worse at building'],
    startInv: { hunting_bow: 1, dried_meat: 3, food: 2 }, mods: { huntingDmgBonus: 1.25, deerFleeRange: 3 } },
  mechanic: { name: 'Mechanic', emoji: '🔧', playerEmoji: '👷', desc: 'A scavenger\u0027s eye. You see value in every scrap.',
    bonuses: ['Loot rolls twice, keep better', 'Extra scrap'], tradeoffs: ['-15% combat damage'],
    startInv: { scrap: 5, food: 3, wood: 3 }, mods: { lootReroll: true, combatPenalty: 0.85 } },
  medic: { name: 'Medic', emoji: '🏥', playerEmoji: '🧑\u200d⚕️', desc: 'Field medic. You\u0027ve patched yourself up worse than this.',
    bonuses: ['2 medkits', 'Medkits heal +75', '+30% HP regen'], tradeoffs: ['Less starting wood/food'],
    startInv: { medkit: 2, cloth: 2, food: 2 }, mods: { medkitBonus: 25, hpRegenBonus: 1.3 } },
  prospector: { name: 'Prospector', emoji: '⛏️', playerEmoji: '🧓', desc: 'Lived in the hills for decades. Used to harsh weather.',
    bonuses: ['+30% warmth retention', 'Faster mining', 'Extra stone'], tradeoffs: ['Slightly slower movement'],
    startInv: { stone: 5, wood: 3, food: 3 }, mods: { warmthRetention: 0.7, miningBonus: true } },
  veteran: { name: 'Veteran', emoji: '🎖️', playerEmoji: '🪖', desc: 'You\u0027ve seen worse. Tough as nails, but you eat a lot.',
    bonuses: ['+50% combat damage', '-25% damage taken', 'Starts with rifle'], tradeoffs: ['Hunger drains 30% faster'],
    startInv: { rifle: 1, food: 4, wood: 2 }, mods: { combatBonus: 1.5, dmgReduction: 0.75, hungerDrain: 1.3 } },
};

// ============================================================================
// NOTE: This file truncated for repo commit. The full game runtime continues
// with initialState, the WintersEdge component, and all helper components.
// The full version is preserved in the Claude artifact and will be synced here
// in incremental commits. For the playable build, see CHANGELOG.md.
// ============================================================================

export default function App() {
  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
      <div className="max-w-2xl text-center">
        <div className="text-5xl mb-4">❄️</div>
        <h1 className="text-3xl font-bold text-sky-300 mb-2">Winter\u0027s Edge</h1>
        <p className="text-slate-400 mb-6">Game data structures committed. Full runtime sync in progress.</p>
        <p className="text-xs text-slate-500">See DESIGN.md and CHANGELOG.md for details.</p>
      </div>
    </div>
  );
}
