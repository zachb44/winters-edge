export const T = {
  SNOW: 0, TREE: 1, ROCK: 2, ICE: 3, WATER: 4,
  PLANE: 5, CABIN: 6, CAVE: 7, SAPLING: 8, TOWER: 9, CRATE: 10,
  MILITARY_FLOOR: 11, SANDBAG: 12, WATCHTOWER: 13, ARMORY: 14, BARRACKS: 15,
  WRECKAGE_METAL: 16, SCORCHED_GROUND: 17, CABIN_FLOOR: 18,
  HILLTOP: 19,
};

export const CRASH_SITES = [
  { x: 55, y: 45, name: 'Central Tundra' },
  { x: 25, y: 20, name: 'Near the Lake' },
  { x: 70, y: 35, name: 'Eastern Plains' },
  { x: 40, y: 70, name: 'Southern Wilderness' },
  { x: 60, y: 15, name: 'Northern Reach' },
];

// Held separately from CRASH_SITES so the wilderness random roll can't
// accidentally pick the outpost spawn. genMap forces this site only when
// mode === 'outbreak'. Lands the player ~2 tiles inside the outpost
// south interior at (87, 18).
export const OUTPOST_CRASH_SITE = { x: 85, y: 18, name: 'Near the Outpost' };

export const TILE_DATA = {
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
  [T.MILITARY_FLOOR]: { color: '#4a4a4a', walkable: true, name: 'Concrete Floor' },
  [T.SANDBAG]: { color: '#8b7d5e', walkable: false, name: 'Sandbag Wall', emoji: '🟤' },
  [T.WATCHTOWER]: { color: '#3a3a3a', walkable: false, name: 'Watchtower', emoji: '🏗️' },
  [T.ARMORY]: { color: '#4a3a2a', walkable: false, name: 'Armory', emoji: '🏚️' },
  [T.BARRACKS]: { color: '#5a4a3a', walkable: false, name: 'Barracks', emoji: '🏚️' },
  [T.WRECKAGE_METAL]: { color: '#7a7a7a', walkable: true, name: 'Wreckage' },
  [T.SCORCHED_GROUND]: { color: '#3a2820', walkable: true, name: 'Scorched Ground' },
  [T.CABIN_FLOOR]: { color: '#6b4a32', walkable: true, name: 'Cabin Floor' },
  [T.HILLTOP]: { color: '#f4f8fc', walkable: true, name: 'Hilltop' },
};
