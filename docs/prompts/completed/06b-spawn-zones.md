# Zombie Spawn Zones (Replace Edge Spawning)

**Run AFTER seed 03 (wave spawner) and seed 06 (map expansion). Requires the wave system and the 120×90 map to exist.**

Copy this entire block into Claude Code as a single prompt.

---

Replace the current "zombies spawn at random map edges" system with named spawn zones placed on the map. Zombies emerge from the nearest zones to the player each night, creating directional threats the player can scout and fortify against.

## Why this change

On the 120×90 map, edge spawning breaks down. A zombie spawning 100+ tiles from the player at shambler speed (~1 tile every 12 ticks) may never reach the player before dawn despawns it. The horde feels absent. Named spawn zones solve this by placing zombie sources at known, discoverable locations within striking distance of any base location.

## What this adds

1. 5 zombie spawn zones placed during map generation
2. Per-night spawn zone selection (nearest 2-3 zones to the player)
3. Zone tile clusters visible on the map (discoverable during day)
4. Replaces `getEdgeSpawnPositions()` with `getZoneSpawnPositions()`
5. Wilderness Mode: spawn zones exist on the map as scenery but never activate

## Spawn zone data

Create `src/data/spawnZones.js`:

```js
export const SPAWN_ZONES = [
  {
    id: 'cemetery',
    name: 'Old Cemetery',
    emoji: '🪦',
    x: 65, y: 40,
    desc: 'Weathered headstones jut from the snow. The ground here is disturbed.',
  },
  {
    id: 'field_hospital',
    name: 'Abandoned Field Hospital',
    emoji: '🏥',
    x: 45, y: 30,
    desc: 'Medical tents collapsed under snow. Something went very wrong here.',
  },
  {
    id: 'mass_grave',
    name: 'Mass Grave',
    emoji: '⚰️',
    x: 80, y: 45,
    desc: 'A long trench, barely covered. The smell of decay lingers even in the cold.',
  },
  {
    id: 'crashed_convoy',
    name: 'Wrecked Convoy',
    emoji: '🚛',
    x: 55, y: 70,
    desc: 'Military trucks overturned on the road. Dried blood on the snow.',
  },
  {
    id: 'overrun_camp',
    name: 'Overrun Survivor Camp',
    emoji: '⛺',
    x: 100, y: 50,
    desc: 'Torn tents and scattered belongings. They didn\'t make it.',
  },
];
```

### Zone placement rationale

The 5 zones are distributed so that from any of the 8 named base locations, at least 2 zones are within ~40 tiles (reachable by shamblers in one night). No zone overlaps with a named location. The rough distribution:

```
       WEST (0-60)                    EAST (60-120)
  ┌─────────────────────────────┬─────────────────────────────┐
  │                             │                             │
N │   Lake(15,15)  Hilltop(50,10) Outpost(90,15) Hangar(110,20)
  │              Field Hosp     │   Cemetery                  │
  │              (45,30)        │   (65,40)                   │
  │─────────────────────────────┼─────────────────────────────│
  │                             │  Mass Grave                 │
  │   Crescent(30,55)           │  (80,45)                    │
S │              Convoy         │           Overrun Camp      │
  │              (55,70)        │           (100,50)          │
  │   Tower(10,80)              │  Cave(100,75) Maze(85,65)   │
  └─────────────────────────────┴─────────────────────────────┘
```

## New tile types

Add to `src/data/tiles.js`:

```js
SPAWN_ZONE: 20,  // next available after HILLTOP=19
```

```js
[T.SPAWN_ZONE]: { color: '#3a2a2a', walkable: true, name: 'Disturbed Ground' },
```

Spawn zone tiles are walkable, dark-colored (dried blood/disturbed earth), and non-interactive. The zone emoji renders as an entity on top, not as a tile emoji.

## Map generation

In `src/logic/mapGen.js`, add a `placeSpawnZones(map)` function called after all named locations are placed but before random scatter (so scatter doesn't overwrite zone centers).

Each spawn zone places a small cluster:
- 3×3 area of `T.SPAWN_ZONE` tiles centered on the zone's (x, y)
- Clear any trees/rocks in that area first
- The zone's emoji renders as a map entity at the center tile (same layer as animals/zombies)

```js
function placeSpawnZones(map) {
  for (const zone of SPAWN_ZONES) {
    // Clear 3×3 area and place SPAWN_ZONE tiles
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
```

Call `placeSpawnZones(map)` in `genMap()` — in both modes. The zones are map scenery in Wilderness (the player walks over disturbed ground and wonders what happened here). Only in Outbreak do they actually spawn zombies.

## Spawn zone rendering

In `MapView.jsx`, render spawn zone emojis on the map:
- For each spawn zone, if the center tile is within the player's revealed fog, show the zone's emoji at its position
- Use the same rendering approach as animal emojis
- Add to the entity rendering section (after buildings, before/alongside animals)

Store the spawn zone positions in `state.spawnZones` (just the coordinates and IDs — copied from `SPAWN_ZONES` at game start). This makes them available to the rendering and spawning systems without re-importing the data module in every file.

## Spawn zone tooltips

In `MapView.jsx`, add tooltip for `T.SPAWN_ZONE` tiles:
- Show zone name + description: "Old Cemetery — Weathered headstones jut from the snow."
- In Outbreak Mode at night, append: "⚠️ Zombies are emerging here"

To look up which zone a tile belongs to, check if the tile's coordinates are within ±1 of any zone's center.

## Replacing edge spawning

In `src/logic/zombies.js`, replace `getEdgeSpawnPositions(map, count)` with `getZoneSpawnPositions(state, map, count)`:

```js
export function getZoneSpawnPositions(state, map, count) {
  const player = state.player;
  const zones = SPAWN_ZONES;
  
  // Calculate distance from player to each zone
  const zonesByDist = zones
    .map(z => ({ ...z, dist: Math.abs(z.x - player.x) + Math.abs(z.y - player.y) }))
    .sort((a, b) => a.dist - b.dist);
  
  // Pick nearest 2-3 zones (2 for nights 1-10, 3 for nights 11+)
  const activeCount = state.wave.nightNumber >= 11 ? 3 : 2;
  const activeZones = zonesByDist.slice(0, activeCount);
  
  // Distribute zombie count across active zones
  const positions = [];
  const perZone = Math.ceil(count / activeZones.length);
  
  for (const zone of activeZones) {
    const needed = Math.min(perZone, count - positions.length);
    for (let i = 0; i < needed; i++) {
      // Spawn on random walkable tiles within 3 tiles of zone center
      const ox = zone.x + Math.floor(Math.random() * 7) - 3;
      const oy = zone.y + Math.floor(Math.random() * 7) - 3;
      const cx = Math.max(0, Math.min(map[0].length - 1, ox));
      const cy = Math.max(0, Math.min(map.length - 1, oy));
      positions.push({ x: cx, y: cy });
    }
  }
  
  return positions;
}
```

### Update spawn call site

In `useGameLoop.js`, find where `getEdgeSpawnPositions(map, count)` is called during sub-wave spawning and replace with `getZoneSpawnPositions(s, map, count)`. The rest of the spawn logic (creating zombie entities, adding to `state.zombies`) stays identical.

### Keep `getEdgeSpawnPositions` as fallback

Don't delete `getEdgeSpawnPositions`. Rename the call site but keep the function. If `state.spawnZones` is empty or undefined (old save without zones), fall back to edge spawning:

```js
const positions = (s.spawnZones && s.spawnZones.length > 0)
  ? getZoneSpawnPositions(s, map, count)
  : getEdgeSpawnPositions(map, count);
```

## Night banner update

In the sundown banner (seed 03's DayBanner night style), add directional info:
- Current: "NIGHT 5 — 8 shamblers approaching"
- New: "NIGHT 5 — 8 shamblers from the Cemetery and Field Hospital"

Get the active zone names from the same nearest-zone calculation used for spawning. Pass them through to the banner via `state.wave.activeZoneNames` (set at sundown when the wave starts).

## State additions

```js
state.spawnZones = SPAWN_ZONES.map(z => ({ id: z.id, x: z.x, y: z.y }))  // set at game start
state.wave.activeZoneNames = []  // set at sundown, cleared at dawn
```

Save migration: backfill `spawnZones: []` and `wave.activeZoneNames: []` for older saves.

## Files to create/modify

**Create:**
- `src/data/spawnZones.js` — zone definitions

**Modify:**
- `src/data/tiles.js` — add `T.SPAWN_ZONE` tile type
- `src/logic/mapGen.js` — add `placeSpawnZones()`, call in `genMap()`
- `src/logic/zombies.js` — add `getZoneSpawnPositions()`, update spawn call site
- `src/hooks/useGameLoop.js` — swap spawn position function, set activeZoneNames at sundown
- `src/components/MapView.jsx` — render zone emojis, add tooltips
- `src/components/DayBanner.jsx` — include zone names in night banner
- `src/App.jsx` — initialize `state.spawnZones` at game start
- `src/logic/saveLoad.js` — backfill spawnZones and activeZoneNames

## Acceptance criteria

- [ ] 5 spawn zones placed on the 120×90 map as 3×3 tile clusters
- [ ] Spawn zones visible in both modes (dark ground tiles + emoji)
- [ ] Tooltips show zone name and description
- [ ] Outbreak Mode: zombies spawn from nearest 2-3 zones (not map edges)
- [ ] Nights 1-10: 2 active zones. Nights 11+: 3 active zones
- [ ] Night banner shows which zones are active
- [ ] Zombies spawn within ~3 tiles of zone center (not exactly on it)
- [ ] Old saves without spawnZones fall back to edge spawning
- [ ] Wilderness Mode: zones exist as scenery, no spawning
- [ ] Zone selection is player-position-dependent (different base = different threat directions)

## Constraints

- Don't break existing wave timing or zombie count formulas — only the spawn LOCATION changes
- Don't break Wilderness Mode
- Don't delete `getEdgeSpawnPositions` — keep as fallback
- Spawn zones are permanent map features, not destructible (future: clearing a zone could reduce wave size)
- Zone positions are fixed per game (same every run, like named locations)

Commit message: `feat: zombie spawn zones replace edge spawning with directional threats`

## Plan before executing

1. Read `src/logic/zombies.js` — find `getEdgeSpawnPositions` and its call site
2. Read `src/hooks/useGameLoop.js` — find where spawn positions are used during sub-wave spawning
3. Read `src/components/DayBanner.jsx` — find night banner text
4. Read `src/logic/mapGen.js` — find placement ordering to slot `placeSpawnZones` correctly
5. Propose integration points
6. Wait for go-ahead
7. Implement: data → tiles → mapGen → zombies spawn logic → game loop swap → banner update → MapView rendering → state init → save migration
8. Verify: start Outbreak game, confirm zombies come from visible zone clusters, not map edges
