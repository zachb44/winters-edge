// A* pathfinding on the 4-directional tile grid. Pure: no React, no game state.
//
// Treats unwalkable tiles (per TILE_DATA[tile].walkable) and tiles holding a
// blocking building (walls/barricades/reinforced walls) as obstacles. The
// caller is responsible for assembling `blockingBuildingKeys` (Set of "x,y").
//
// Returns the path as an array of {x, y} steps NOT including the start tile.
// Returns null when no path exists, the target is unwalkable, or the cap is
// exceeded.

import { TILE_DATA } from '../data/tiles.js';

function heuristic(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function isPassable(map, blockingBuildingKeys, x, y) {
  const row = map[y];
  if (!row) return false;
  const tile = row[x];
  if (tile === undefined) return false;
  if (!TILE_DATA[tile] || !TILE_DATA[tile].walkable) return false;
  if (blockingBuildingKeys && blockingBuildingKeys.has(`${x},${y}`)) return false;
  return true;
}

export function findPath(map, blockingBuildingKeys, sx, sy, tx, ty, maxNodes = 8000) {
  if (sx === tx && sy === ty) return [];
  const H = map.length;
  const W = map[0]?.length ?? 0;
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
  if (!isPassable(map, blockingBuildingKeys, tx, ty)) return null;

  const startKey = `${sx},${sy}`;
  const start = { x: sx, y: sy, g: 0, f: heuristic(sx, sy, tx, ty), parent: null };
  const open = [start];
  const best = new Map();
  best.set(startKey, 0);
  let nodes = 0;

  while (open.length > 0 && nodes < maxNodes) {
    nodes++;
    // Linear scan for lowest f — fine for 60x45 / 120x90 grids.
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const cur = open.splice(bestIdx, 1)[0];
    if (cur.x === tx && cur.y === ty) {
      const path = [];
      let n = cur;
      while (n.parent) {
        path.unshift({ x: n.x, y: n.y });
        n = n.parent;
      }
      return path;
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!isPassable(map, blockingBuildingKeys, nx, ny)) continue;
      const ng = cur.g + 1;
      const key = `${nx},${ny}`;
      const prevBest = best.get(key);
      if (prevBest !== undefined && prevBest <= ng) continue;
      best.set(key, ng);
      open.push({
        x: nx,
        y: ny,
        g: ng,
        f: ng + heuristic(nx, ny, tx, ty),
        parent: cur,
      });
    }
  }
  return null;
}

// Find a path to the nearest passable tile adjacent to (tx, ty). Used when
// the target tile itself is an obstacle the player wants to interact with
// (a tree to chop, a building to operate, a future-build site etc.).
//
// Returns the best path among the 4 neighbors, or null if none reachable.
export function findPathToAdjacent(map, blockingBuildingKeys, sx, sy, tx, ty) {
  const candidates = [
    { x: tx + 1, y: ty },
    { x: tx - 1, y: ty },
    { x: tx, y: ty + 1 },
    { x: tx, y: ty - 1 },
  ];
  let best = null;
  for (const c of candidates) {
    const path = findPath(map, blockingBuildingKeys, sx, sy, c.x, c.y);
    if (path && (!best || path.length < best.length)) best = path;
  }
  return best;
}

export function buildBlockingKeysFromBuildings(buildings, BUILDINGS) {
  const s = new Set();
  for (const b of buildings) {
    if (BUILDINGS[b.type]?.walkable === false) s.add(`${b.x},${b.y}`);
  }
  return s;
}
