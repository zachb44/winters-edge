import { T } from './tiles.js';

export const LOOT_BUDGET = { [T.PLANE]: 3, [T.CABIN]: 4, [T.ARMORY]: 4, [T.BARRACKS]: 3 };

export const LOOT_TABLES = {
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
  armory: {
    common: [['scrap',3,5,40],['cloth',1,2,30],['nothing',0,0,30]],
    uncommon: [['hatchet',1,1,35],['hunting_bow',1,1,30],['scrap',2,4,20],['cloth',1,2,15]],
    rare: [['rifle',1,1,40],['rifle_part',1,1,35],['hunting_bow',1,1,25]],
    weights: { common: 45, uncommon: 40, rare: 15 },
  },
  barracks: {
    common: [['food',2,3,30],['cloth',2,3,25],['scrap',1,2,25],['nothing',0,0,20]],
    uncommon: [['medkit',1,1,35],['cooked_meat',1,2,25],['dried_meat',1,2,20],['cloth',2,3,20]],
    rare: [['medkit',1,2,40],['fur_coat',1,1,30],['lantern',1,1,30]],
    weights: { common: 50, uncommon: 38, rare: 12 },
  },
};

export const ITEM_INFO = {
  wood: { name: 'wood', icon: '🪵' },
  stone: { name: 'stone', icon: '🪨' },
  scrap: { name: 'scrap', icon: '🔧' },
  food: { name: 'ration', icon: '🥫' },
  raw_meat: { name: 'raw meat', icon: '🍖' },
  cooked_meat: { name: 'cooked meat', icon: '🍗' },
  fat: { name: 'fat', icon: '🟡' },
  pelts: { name: 'pelt', icon: '🦊' },
  rare_pelt: { name: 'bear pelt', icon: '🐻' },
  medkit: { name: 'medkit', icon: '🏥' },
  cloth: { name: 'cloth', icon: '🧵' },
  flare: { name: 'flare', icon: '🎆' },
  dried_meat: { name: 'dried meat', icon: '🥓' },
  lantern: { name: 'lantern', icon: '🏮' },
  hatchet: { name: 'hatchet', icon: '🪓' },
  hunting_bow: { name: 'hunting bow', icon: '🏹' },
  rifle: { name: 'rifle', icon: '🎯' },
  rifle_part: { name: 'rifle part', icon: '⚙️' },
  fur_coat: { name: 'fur coat', icon: '🧥' },
  snowshoes: { name: 'snowshoes', icon: '👢' },
  map_fragment: { name: 'map fragment', icon: '🗺️' },
};

export function rollLoot(entries) {
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

export function rollFromTable(name) {
  const table = LOOT_TABLES[name];
  if (!table) return [];
  const results = [];
  if (table.multi) {
    for (const tier of ['common','uncommon','rare']) {
      if (Math.random() * 100 < table.weights[tier] && table[tier]) {
        results.push(rollLoot(table[tier]));
      }
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
