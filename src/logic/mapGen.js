import { T, CRASH_SITES, OUTPOST_CRASH_SITE } from '../data/tiles.js';
import { MAP_W, MAP_H } from '../constants.js';

// Stamps the military outpost onto the map. Bounding box x=46..57, y=3..12.
// The area is cleared to SNOW first (this overwrites part of the existing
// tree-crescent ring around (48,9)); then sandbag perimeter, military floor
// interior, and named structures are placed. Two perimeter gaps — west at
// (48,6) and south at (52,9) — are intentional zombie entry points.
//
// Two supply crates sit on the floor at (51,7) and (53,7); those are
// returned as entity records (state.crates) rather than map tiles, matching
// the existing supply-drop crate system.
function placeOutpost(map) {
  for (let y = 3; y <= 12; y++) {
    for (let x = 46; x <= 57; x++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = T.SNOW;
    }
  }

  const sandbags = [
    [50,3],[51,3],[52,3],[53,3],[54,3],[55,3],
    [49,4],[55,4],
    [48,5],[55,5],
    [55,6],
    [48,7],[55,7],
    [49,8],[55,8],
    [50,9],[51,9],[53,9],[54,9],
  ];
  const floors = [
    [50,4],[51,4],[52,4],[53,4],[54,4],
    [49,5],[50,5],[52,5],[54,5],
    [49,6],[50,6],[51,6],[52,6],[53,6],[54,6],
    [49,7],[50,7],[51,7],[52,7],[53,7],[54,7],
    [50,8],[51,8],[52,8],[53,8],[54,8],
  ];
  for (const [x, y] of floors) map[y][x] = T.MILITARY_FLOOR;
  for (const [x, y] of sandbags) map[y][x] = T.SANDBAG;
  map[5][51] = T.ARMORY;
  map[5][53] = T.BARRACKS;
  map[6][57] = T.WATCHTOWER;

  return [
    { x: 51, y: 7, looted: false },
    { x: 53, y: 7, looted: false },
  ];
}

export function genMap(crashSite = null, mode = 'wilderness') {
  const map = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(T.SNOW));

  for (let y = 8; y < 20; y++) {
    for (let x = 4; x < 18; x++) {
      const dx = x - 11, dy = y - 14;
      if (dx*dx + dy*dy < 32) map[y][x] = T.ICE;
    }
  }
  for (let x = 16; x < 32; x++) {
    map[13][x] = T.ICE; map[14][x] = T.ICE; map[15][x] = T.ICE;
  }
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

  // Outpost stamps after random scatter so it doesn't get speckled with
  // trees/rocks. Runs in both modes — it's a discoverable landmark.
  const outpostCrates = placeOutpost(map);

  const site = crashSite
    || (mode === 'outbreak' ? OUTPOST_CRASH_SITE : CRASH_SITES[Math.floor(Math.random() * CRASH_SITES.length)]);
  const startX = site.x, startY = site.y;

  for (let y = startY - 2; y <= startY + 2; y++) {
    for (let x = startX - 2; x <= startX + 3; x++) {
      if (map[y] && (map[y][x] === T.TREE || map[y][x] === T.ROCK || map[y][x] === T.ICE)) {
        map[y][x] = T.SNOW;
      }
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

  return { map, startX, startY, siteName: site.name, outpostCrates };
}
