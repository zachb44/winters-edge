# Military Outpost Map Zone

**Phase 1 — Map and world expansion. Run AFTER seed 01 (mode selection). Can run before or after seeds 02/03/04 — this is map generation, independent of zombie/vitals systems. However, seed 06 (full map expansion) should run AFTER this seed.**

Copy this entire block into Claude Code as a single prompt.

---

Add the military outpost as a distinct zone on the current 60×45 map. This is the first named location from the PIVOT.md design and the thematic centerpiece of Outbreak Mode. This seed works on the CURRENT map size — the full 120×90 expansion happens in seed 06.

## What this adds

A cluster of military-themed tiles in a specific area of the map, creating a recognizable outpost location with:
- Multiple building-like structures (sandbag walls, watchtower footprint, armory)
- Lootable containers (supply crates, weapon caches)
- Environmental storytelling (the outpost is abandoned/overrun)
- A clear visual identity distinct from the rest of the snowy wilderness

## New tile types

Add to `src/data/tiles.js`:

```js
// Add to the T enum (pick the next available numbers after CRATE = 10)
MILITARY_FLOOR: 11,    // Concrete/metal flooring inside outpost
SANDBAG: 12,           // Sandbag wall — walkable on top, provides cover
WATCHTOWER: 13,        // Watchtower structure — not walkable
ARMORY: 14,            // Armory building — lootable like cabin
BARRACKS: 15,          // Barracks building — lootable like cabin
```

Add corresponding `TILE_DATA` entries:
```js
[T.MILITARY_FLOOR]: { color: '#4a4a4a', walkable: true, name: 'Concrete Floor' },
[T.SANDBAG]: { color: '#8b7d5e', walkable: false, name: 'Sandbag Wall', emoji: '🟤' },
[T.WATCHTOWER]: { color: '#3a3a3a', walkable: false, name: 'Watchtower', emoji: '🏗️' },
[T.ARMORY]: { color: '#4a3a2a', walkable: false, name: 'Armory', emoji: '🏚️' },
[T.BARRACKS]: { color: '#5a4a3a', walkable: false, name: 'Barracks', emoji: '🏚️' },
```

## Outpost layout

Place the outpost in the **northeast quadrant** of the current map, roughly centered around tile (48, 8). This area is currently scattered trees (the forest crescent edge) and open snow — clear it for the outpost.

The outpost should be roughly 12×10 tiles:

```
Approximate layout (not exact — adapt to what looks good):

  y=3:  . . . . S S S S S S . .
  y=4:  . . . S F F F F F S . .
  y=5:  . . S F F A F B F S . .
  y=6:  . . S F F F F F F S W .
  y=7:  . . S F F C F C F S . .
  y=8:  . . . S F F F F F S . .
  y=9:  . . . . S S . S S . . .

  S = Sandbag    F = Military Floor    A = Armory
  B = Barracks   C = Supply Crate      W = Watchtower
```

This gives:
- A perimeter of sandbags with gaps (entry points — important for zombie pathing in Outbreak Mode)
- Interior concrete floor
- One armory (lootable — better weapon odds than cabins)
- One barracks (lootable — supplies, cloth, medkits)
- 2 supply crates inside
- A watchtower on the east edge

## Outpost loot tables

The armory and barracks are lootable structures, similar to cabins and plane wreckage. Add loot tables for them in `src/data/loot.js`.

**Armory loot** (higher weapon/ammo odds than cabin):
- Uses: 4 (same finite-use system as cabins)
- Table: weighted toward weapons, scrap, and ammo-adjacent items
  - rifle: 15% chance
  - hunting_bow: 20% chance
  - hatchet: 25% chance
  - scrap: 3-5 quantity, 30% chance
  - cloth: 1-2 quantity, 20% chance

**Barracks loot** (supplies and survival gear):
- Uses: 3
- Table: weighted toward survival items
  - medkit: 30% chance
  - food: 2-3 quantity, 25% chance
  - cloth: 2-3 quantity, 25% chance
  - cooked_meat: 1-2 quantity, 15% chance
  - scrap: 1-2 quantity, 20% chance

Reference how cabin loot is implemented — look at `src/data/loot.js` for `rollFromTable` and the cabin loot table, then follow the same pattern.

## Loot interaction

Armory and barracks should be lootable via the same mechanism as cabins:
- Click the tile → receive loot roll
- Track remaining uses per tile position (same as `state.lootUses` or however cabin uses are tracked)
- Tooltip shows uses remaining: "Armory — 3 searches left"
- When depleted: "Armory — Searched"

Find how cabin loot interaction works in `App.jsx` (click handler) and `MapView.jsx` (tooltip). Extend both to support the new tile types.

## Map generation changes

In `src/logic/mapGen.js`:

1. After the existing map generation (lakes, forests, boulders, etc.), add the outpost placement.
2. Clear the outpost area first (replace any trees/rocks with snow), then place the outpost tiles.
3. The outpost is placed at a fixed position — it's a landmark, not random.

```js
function placeOutpost(map) {
  const ox = 46;  // outpost origin x
  const oy = 3;   // outpost origin y
  
  // Clear the area
  for (let y = oy; y < oy + 10; y++) {
    for (let x = ox; x < ox + 12; x++) {
      if (map[y] && map[y][x] !== undefined) {
        map[y][x] = T.SNOW;
      }
    }
  }
  
  // Place outpost tiles (adapt layout to look good)
  // ... sandbags around perimeter, floor interior, buildings inside
}
```

4. Call `placeOutpost(map)` in the `genMap()` function, after existing terrain generation but before crash site placement.

### Outbreak Mode crash site

In Outbreak Mode, the player's crash site should be near the outpost. Add a new crash site option:

```js
// In src/data/tiles.js, add to CRASH_SITES:
{ x: 44, y: 6, name: 'Near the Outpost' }
```

In `genMap()`, when the game mode is outbreak, force the crash site to this outpost-adjacent position instead of picking randomly. This requires `genMap` to accept a `mode` parameter (or the crash site selection to happen outside `genMap` based on mode).

Look at how `genMap` is called — it's likely in `App.jsx` during `onStartGame`. Pass the mode through so the crash site can be forced.

## Hover tooltips

In `MapView.jsx`, the tile tooltip system should recognize the new tile types:
- Military Floor: "Concrete Floor" (no interaction)
- Sandbag: "Sandbag Wall" (no interaction — future: destructible by zombies)
- Watchtower: "Watchtower" (no interaction yet — future: vision bonus)
- Armory: "Armory — Click to search (N uses left)" (same pattern as cabin)
- Barracks: "Barracks — Click to search (N uses left)" (same pattern as cabin)

## What this does NOT do

- Does NOT expand the map to 120×90 (that's seed 06)
- Does NOT add zombie-specific behavior around the outpost
- Does NOT make sandbags destructible (that's seed 11 — defensive structures)
- Does NOT add the watchtower vision bonus (future feature)
- Does NOT add any of the other 7 named locations (that's seed 06)

This seed adds the outpost to the existing 60×45 map as a proof-of-concept location.

## Acceptance criteria

- [ ] 5 new tile types exist in tiles.js with correct colors and properties
- [ ] Outpost renders on the map as a distinct cluster in the northeast
- [ ] Armory is lootable (4 uses, weapon-heavy loot table)
- [ ] Barracks is lootable (3 uses, supplies-heavy loot table)
- [ ] Tooltips work for all new tile types
- [ ] Outbreak Mode crash site is near the outpost
- [ ] Wilderness Mode crash site is unchanged (random from existing 5 sites)
- [ ] Outpost doesn't overlap with existing terrain features (lake, forest crescent)
- [ ] Save/load works with new tile types on the map

## Constraints

- Don't move or modify existing terrain features (lake, forest crescent, boulder field, cave)
- Don't break any existing loot, tooltip, or interaction systems
- Keep the outpost modest in size — it's a forward operating base, not a city
- The outpost should be visible and recognizable on the map by its darker floor tiles and sandbag border

Commit message: `feat: military outpost zone with armory, barracks, and loot tables`

## Plan before executing

1. Read `src/data/tiles.js` and `src/data/loot.js` — understand tile system and loot tables
2. Read `src/logic/mapGen.js` — understand placement order and crash site logic
3. Read `MapView.jsx` — understand tooltip rendering for lootable tiles
4. Read click handler in `App.jsx` — understand how cabin loot interaction works
5. Propose the outpost layout and loot tables
6. Wait for go-ahead
7. Implement: tiles.js → loot.js → mapGen.js → MapView tooltips → click handler → crash site forcing
8. Screenshot the outpost on the map for visual verification
