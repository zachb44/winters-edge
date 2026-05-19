export const T = {
  SNOW: 0, TREE: 1, ROCK: 2, ICE: 3, WATER: 4,
  PLANE: 5, CABIN: 6, CAVE: 7, SAPLING: 8, TOWER: 9, CRATE: 10,
};

export const CRASH_SITES = [
  { x: 28, y: 22, name: 'Central Tundra' },
  { x: 18, y: 24, name: 'Near the Lake' },
  { x: 36, y: 20, name: 'Eastern Plains' },
  { x: 22, y: 35, name: 'South Tundra' },
  { x: 32, y: 12, name: 'Northern Reach' },
];

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
};
