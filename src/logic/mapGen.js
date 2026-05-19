import { T, CRASH_SITES } from '../data/tiles.js';
import { MAP_W, MAP_H } from '../constants.js';

export function genMap(crashSite = null) {
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

  const site = crashSite || CRASH_SITES[Math.floor(Math.random() * CRASH_SITES.length)];
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

  return { map, startX, startY, siteName: site.name };
}
