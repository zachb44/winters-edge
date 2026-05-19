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

// Note: This file contains the full v5 game code.
// See DESIGN.md for the full design doc and roadmap.

export default function App() {
  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
      <div className="max-w-2xl text-center">
        <div className="text-5xl mb-4">❄️</div>
        <h1 className="text-3xl font-bold text-sky-300 mb-2">Winter's Edge</h1>
        <p className="text-slate-400 mb-6">
          Placeholder App.jsx — the full v5 game code is being added in the next commit.
        </p>
        <p className="text-xs text-slate-500">
          If you're seeing this, the project scaffolding is set up correctly.
          Run <code className="bg-slate-800 px-2 py-1 rounded">npm install</code> then <code className="bg-slate-800 px-2 py-1 rounded">npm run dev</code> to test.
        </p>
      </div>
    </div>
  );
}
