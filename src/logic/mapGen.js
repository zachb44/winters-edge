import { T, CRASH_SITES, OUTPOST_CRASH_SITE } from '../data/tiles.js';
import { SPAWN_ZONES } from '../data/spawnZones.js';
import { MAP_W, MAP_H } from '../constants.js';

// 3x2 cabin shell: lootable cabin tile at (cx, cy) with cabin floor tiles
// in a row beside it and a row in front, so cabins read as small shelters
// rather than floating emojis.
function placeCabinCluster(map, cx, cy) {
  for (let dy = 0; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx, y = cy + dy;
      if (!map[y] || map[y][x] === undefined) continue;
      map[y][x] = T.CABIN_FLOOR;
    }
  }
  map[cy][cx] = T.CABIN;
}

// Stamps the military outpost onto the map. Bounding box x=84..95, y=10..19
// (shifted from the original 60×45 layout by Δx=+38, Δy=+7).
// The area is cleared to SNOW first; then sandbag perimeter, military floor
// interior, and named structures are placed. Two perimeter gaps — west at
// (86,13) and south at (90,16) — are intentional zombie entry points.
//
// Two supply crates sit on the floor at (89,14) and (91,14); those are
// returned as entity records (state.crates) rather than map tiles, matching
// the existing supply-drop crate system.
function placeOutpost(map) {
  for (let y = 10; y <= 19; y++) {
    for (let x = 84; x <= 95; x++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = T.SNOW;
    }
  }

  const sandbags = [
    [88,10],[89,10],[90,10],[91,10],[92,10],[93,10],
    [87,11],[93,11],
    [86,12],[93,12],
    [93,13],
    [86,14],[93,14],
    [87,15],[93,15],
    [88,16],[89,16],[91,16],[92,16],
  ];
  const floors = [
    [88,11],[89,11],[90,11],[91,11],[92,11],
    [87,12],[88,12],[90,12],[92,12],
    [87,13],[88,13],[89,13],[90,13],[91,13],[92,13],
    [87,14],[88,14],[89,14],[90,14],[91,14],[92,14],
    [88,15],[89,15],[90,15],[91,15],[92,15],
  ];
  for (const [x, y] of floors) map[y][x] = T.MILITARY_FLOOR;
  for (const [x, y] of sandbags) map[y][x] = T.SANDBAG;
  map[12][89] = T.ARMORY;
  map[12][91] = T.BARRACKS;
  map[13][95] = T.WATCHTOWER;

  return [
    { x: 89, y: 14, looted: false },
    { x: 91, y: 14, looted: false },
  ];
}

// Stamps the hangar + cargo plane east of the outpost. 8x5 interior of
// MILITARY_FLOOR at x=104..111, y=18..22 with sandbag walls on N/W/E.
// South side is open (the hangar door). The downed cargo plane (T.PLANE)
// sits at (108, 24), just outside the door. 3 supply crates inside.
function placeHangar(map) {
  for (let y = 18; y <= 22; y++) {
    for (let x = 104; x <= 111; x++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = T.MILITARY_FLOOR;
    }
  }
  // North wall
  for (let x = 104; x <= 111; x++) {
    if (map[17] && map[17][x] !== undefined) map[17][x] = T.SANDBAG;
  }
  // West + East walls
  for (let y = 18; y <= 22; y++) {
    if (map[y] && map[y][104] !== undefined) map[y][104] = T.SANDBAG;
    if (map[y] && map[y][111] !== undefined) map[y][111] = T.SANDBAG;
  }
  // Cargo plane just south of the open door
  if (map[24] && map[24][108] !== undefined) map[24][108] = T.PLANE;

  return [
    { x: 106, y: 20, looted: false },
    { x: 109, y: 20, looted: false },
    { x: 107, y: 21, looted: false },
  ];
}

// Carves the cave system at (100, 75). Cave entrance tile + a horseshoe of
// rocks on three sides; south side stays walkable as the approach. The
// surrounding 12×10 area gets a denser rock scatter to read as a mountain.
function placeCaveSystem(map) {
  for (let y = 70; y < 81; y++) {
    for (let x = 94; x < 107; x++) {
      if (!map[y] || map[y][x] === undefined) continue;
      if (Math.random() > 0.4) map[y][x] = T.ROCK;
    }
  }
  // Carve a deliberate horseshoe around the cave so the entrance is
  // approachable from the south.
  const carve = [
    [99,74,T.ROCK],[100,74,T.ROCK],[101,74,T.ROCK],
    [99,75,T.ROCK],[101,75,T.ROCK],
    [99,76,T.ROCK],[101,76,T.ROCK],
    [100,76,T.SNOW],
    [100,75,T.CAVE],
  ];
  for (const [x, y, t] of carve) {
    if (map[y] && map[y][x] !== undefined) map[y][x] = t;
  }
}

// Stamps each spawn zone as a 3×3 cluster of SPAWN_ZONE tiles. Zones are
// permanent map features visible in both modes; only Outbreak activates
// them for zombie spawning. Called after named structures so scatter never
// overwrites zone centers.
function placeSpawnZones(map) {
  for (const zone of SPAWN_ZONES) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = zone.x + dx;
        const ny = zone.y + dy;
        if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
          map[ny][nx] = T.SPAWN_ZONE;
        }
      }
    }
  }
}

// Hilltop zone: open elevated terrain at (50, 10) with a distinct lighter
// tile color. Cabin at the center. A few scattered rocks for character.
function placeHilltop(map) {
  for (let y = 6; y < 14; y++) {
    for (let x = 45; x < 55; x++) {
      if (map[y] && map[y][x] !== undefined) map[y][x] = T.HILLTOP;
    }
  }
  const rocks = [[47,9],[52,11],[49,7]];
  for (const [x, y] of rocks) if (map[y] && map[y][x] !== undefined) map[y][x] = T.ROCK;
  placeCabinCluster(map, 50, 10);
}

export function genMap(crashSite = null, mode = 'wilderness') {
  const map = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(T.SNOW));

  // Frozen lake — center (15, 15), radius ~10 → ~20×20 footprint.
  for (let y = 5; y < 26; y++) {
    for (let x = 5; x < 26; x++) {
      const dx = x - 15, dy = y - 15;
      if (dx*dx + dy*dy < 100) map[y][x] = T.ICE;
    }
  }

  // Tree crescent — C-shaped arc centered (30, 55), radii 8-14.
  for (let y = 41; y < 70; y++) {
    for (let x = 16; x < 45; x++) {
      const dx = x - 30, dy = y - 55;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > 8 && d < 14 && Math.random() > 0.15) map[y][x] = T.TREE;
    }
  }

  // Boulder maze — dense rock cluster (85, 65), maze-like via random gaps.
  for (let y = 59; y < 72; y++) {
    for (let x = 78; x < 93; x++) {
      const dx = x - 85, dy = y - 65;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > 3 && d < 7 && Math.random() > 0.5) map[y][x] = T.ROCK;
    }
  }

  // NW scatter forest — expanded patch.
  for (let y = 2; y < 30; y++) {
    for (let x = 2; x < 30; x++) {
      if (map[y][x] === T.SNOW && Math.random() > 0.85) map[y][x] = T.TREE;
    }
  }

  // Random scatter scaled 4× for the 4× area.
  for (let i = 0; i < 600; i++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);
    if (map[y][x] === T.SNOW) map[y][x] = T.TREE;
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);
    if (map[y][x] === T.SNOW) map[y][x] = T.ROCK;
  }

  // Cave system stamps after random scatter so its dedicated rocks/cave
  // tile don't get speckled with random trees.
  placeCaveSystem(map);

  // Hilltop stamps last among natural features so its lighter tile and
  // cabin sit cleanly on top of the snow.
  placeHilltop(map);

  // Built structures — placed after natural terrain so they're not eaten by
  // tree/rock scatter passes.
  const outpostCrates = placeOutpost(map);
  const hangarCrates = placeHangar(map);

  // Spawn zones — last so the 3×3 disturbed-ground clusters survive scatter
  // and don't get overwritten by any structure pass.
  placeSpawnZones(map);

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
  // Plane crash cluster — 5x3 centered on crash site. Scorched ground top
  // and bottom, wreckage wings extending left and right, single lootable
  // plane tile in the center. LOOT_BUDGET[T.PLANE] is bumped to compensate
  // for going from 3 plane tiles to 1.
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = startX + dx, y = startY + dy;
      if (!map[y] || map[y][x] === undefined) continue;
      if (dy === 0) {
        map[y][x] = (dx === 0) ? T.PLANE : T.WRECKAGE_METAL;
      } else {
        map[y][x] = T.SCORCHED_GROUND;
      }
    }
  }

  // Lake cabin on the south shore of the frozen lake (just past ice radius).
  placeCabinCluster(map, 15, 25);

  // Radio tower — far SW. Clear surrounding 5×5 patch of trees/rocks so the
  // tower is approachable from any side.
  for (let y = 78; y <= 82; y++) {
    for (let x = 8; x <= 12; x++) {
      if (map[y] && (map[y][x] === T.TREE || map[y][x] === T.ROCK)) map[y][x] = T.SNOW;
    }
  }
  map[80][10] = T.TOWER;

  return {
    map,
    startX,
    startY,
    siteName: site.name,
    outpostCrates: [...outpostCrates, ...hangarCrates],
  };
}
