# Map Expansion to 120×90 with Named Locations

**Phase 1 — Map and world expansion. Run AFTER seed 05 (military outpost). The outpost placement code from seed 05 will be adapted to the new coordinates.**

Copy this entire block into Claude Code as a single prompt.

---

Expand the map from 60×45 to 120×90 (4× the area) and place all 8 named base locations from PIVOT.md. This creates the full world that both modes play on.

## Why this is safe

The render system in `MapView.jsx` already only draws visible tiles (a viewport of `VIEW_W × VIEW_H` tiles centered on the player). The camera follows the player. Larger maps don't hurt performance because off-screen tiles aren't rendered. Verify this by reading `MapView.jsx` — the render loop should already be using `camX`/`camY` offsets to only draw the visible window.

## Step 1: Update constants

In `src/constants.js`:
```js
export const MAP_W = 120;  // was 60
export const MAP_H = 90;   // was 45
```

Also consider bumping the viewport if there's room:
```js
export const VIEW_W = 24;  // was 20 — more visible area
export const VIEW_H = 18;  // was 15
```

Test this — if the viewport change causes layout issues with the current UI, keep it at 20×15 for now. The HUD overhaul (seed 07) will handle layout properly.

## Step 2: Scale up terrain generation

In `src/logic/mapGen.js`, the current terrain features are hardcoded to the 60×45 map:

- **Frozen lake** — centered around (11, 14), roughly 14×12 tiles of ice
- **Forest crescent** — arc of trees from (38,3) to (58,16)
- **Boulder field 1** — cluster at (14-32, 30-42)
- **Boulder field 2** — cluster at (44-56, 33-43) with cave at (50,38)
- **Scatter forest** — random trees at (2-14, 2-12)
- **Random trees** — 150 scattered
- **Random rocks** — 40 scattered
- **Cabins** — at (35,6) and (7,5)
- **Radio tower** — at (3,40)

The new 120×90 map needs these features repositioned and expanded, plus 8 named locations added. Here's the target layout:

### Map zones (approximate quadrants)

```
       WEST (0-60)                    EAST (60-120)
  ┌─────────────────────────────┬─────────────────────────────┐
  │                             │                             │
N │   Frozen Lake    Hilltop    │   Military     Hangar       │
O │   + Cabin        (high      │   Outpost      + Cargo      │
R │   (15,15)        ground)    │   (90,15)      Plane        │
T │                  (50,10)    │                (110,20)     │
H │                             │                             │
  │─────────────────────────────┼─────────────────────────────│
  │                             │                             │
  │   Tree           Open       │   Boulder      Cave         │
S │   Crescent       Tundra     │   Maze         System       │
O │   (30,55)        (center)   │   (85,65)      (100,75)     │
U │                             │                             │
T │   Radio          Crash      │                             │
H │   Tower          Sites      │                             │
  │   (10,80)        (various)  │                             │
  └─────────────────────────────┴─────────────────────────────┘
```

### The 8 named locations

Each location should be a recognizable cluster of tiles. Here are the specs:

**1. Military Outpost — (~90, 15)**
Already built in seed 05. Move it from (46,3) to approximately (90,15) in the expanded map. Adapt the `placeOutpost()` function to use the new coordinates.

**2. Hangar + Cargo Plane — (~110, 20)**
- Large enclosed rectangle (~8×6 tiles) of `MILITARY_FLOOR` with walls on 3 sides
- One open side (the hangar door)
- A `PLANE` wreckage tile (reuse existing type) outside the hangar — this is the downed cargo plane
- Interior has 2-3 supply crates
- Good fortress location: limited access points

**3. Tree Crescent — (~30, 55)**
Scale up the existing forest crescent concept. A C-shaped arc of dense trees enclosing a natural clearing:
- Outer ring: dense trees (radius 12-16 from center)
- Inner clearing: snow (radius 6-10)
- The clearing is a natural base location — build inside the tree wall
- A few rocks inside for mining

**4. Cave System — (~100, 75)**
The cave entrance tile stays as-is for now (single `T.CAVE` tile). The interior expansion to 5×4 is a separate future task. For this seed:
- Place the cave entrance at the base of a rock cluster
- Surround with boulders/rocks to create a mountain-like feel
- The bear spawns near here (move bear spawn to new cave coordinates)
- 2-3 rocks nearby for stone gathering

**5. Frozen Lake Cabin — (~15, 15)**
Expand the existing lake + cabin:
- Larger frozen lake (~20×16 tiles of ice)
- Cabin on the shore (reuse `T.CABIN`)
- Seals spawn on/near the ice (move seal spawns to new coordinates)
- Good fishing/hunting access, mediocre defenses

**6. Boulder Maze — (~85, 65)**
A dense cluster of rocks arranged in maze-like corridors:
- ~15×12 area of rocks with walkable paths between them
- Stone-rich — lots of minable rocks
- Natural defensive corridors (zombies can only approach through narrow paths)
- A few supply crates hidden inside

**7. Hilltop — (~50, 10)**
An elevated area represented by a distinct tile color (lighter snow or a subtle visual difference):
- Open area (~10×8) with scattered rocks
- Good visibility (future: extended vision radius when standing here)
- Exposed on all sides — risk/reward base location
- 1 cabin placed here

**8. Crash Site — (varies)**
Not a fixed location — it's wherever the player's plane crashes. Update the crash site list for the larger map.

### Updated crash sites

Replace `CRASH_SITES` in `src/data/tiles.js` with positions spread across the larger map:

```js
export const CRASH_SITES = [
  { x: 55, y: 45, name: 'Central Tundra' },
  { x: 25, y: 20, name: 'Near the Lake' },
  { x: 70, y: 35, name: 'Eastern Plains' },
  { x: 40, y: 70, name: 'Southern Wilderness' },
  { x: 60, y: 15, name: 'Northern Reach' },
];

// Outbreak Mode forces this crash site (near outpost)
export const OUTBREAK_CRASH_SITE = { x: 85, y: 18, name: 'Near the Outpost' };
```

### Updated animal spawns

In `src/logic/animals.js`, update `spawnInitialAnimals()` to distribute animals across the larger map:
- Rabbits: scattered across all quadrants (10-12 total)
- Deer: near the tree crescent and open tundra (4-5 total)
- Wolves: distributed in pairs, favoring the wilderness areas (4-5 total)
- Boars: southern half of the map (2-3 total)
- Bear: near the cave system at (~100, 75) — one bear, territorial
- Seals: on/near the frozen lake at (~15, 15) (3-4 total)
- Ravens: scattered, mostly decorative (3-4 total)

## Hardcoded coordinates to update — COMPLETE INVENTORY

⚠️ This is the most coordinate-heavy refactor in the project. Every hardcoded position must be updated. Here is the complete inventory:

### `src/logic/mapGen.js` — terrain feature coordinates
| Feature | Current coords | New coords |
|---|---|---|
| Frozen lake center | (~11, 14) | (~15, 15) |
| Lake ice loops | x=4-18, y=8-20 | scale to ~20×16 at new center |
| Ice river extension | x=16-32, y=13-15 | remove or reposition |
| Forest crescent | x=38-58, y=3-16, center (48,9) | (~30, 55), radius 12-16 |
| Boulder field 1 | x=14-32, y=30-42, center (23,36) | part of boulder maze (~85, 65) |
| Boulder field 2 | x=44-56, y=33-43 | part of cave mountain (~100, 75) |
| Cave entrance | (50, 38) | (~100, 75) |
| Scatter forest | x=2-14, y=2-12 | redistribute across larger map |
| Cabin 1 | (35, 6) | (~50, 10) — hilltop cabin |
| Cabin 2 | (7, 5) | (~15, 20) — lake cabin (shore of frozen lake) |
| Radio tower | (3, 40) | (~10, 80) |
| Tower clearing zone | x=1-5, y=38-42 | adjust to new tower position |
| Random trees | 150 count | ~600 count (4× area) |
| Random rocks | 40 count | ~160 count (4× area) |

### `src/logic/animals.js` — every spawn position
| Animal | Current (x, y) | New target area |
|---|---|---|
| rabbit (7 total) | (42,8), (20,28), (50,18), (35,25), (25,15), (15,32), (45,22) | scatter across all 4 quadrants |
| deer (3 total) | (48,6), (52,11), (44,14) | near tree crescent (~30, 55) and open tundra |
| wolf (3 total) | (52,25), (10,30), (8,38) | wilderness areas, avoid outpost zone |
| boar (2 total) | (22,35), (28,38) | southern half |
| bear (1) | (50,38) homeX/homeY | (~100, 75) near cave — update homeX/homeY too |
| seal (3 total) | (11,14), (9,17), (13,11) | on/near frozen lake (~15, 15) |
| raven (3 total) | (30,10), (40,30), (5,5) | scatter across map |

### `src/data/tiles.js` — crash sites
Replace entire `CRASH_SITES` array (5 entries) with new positions as specified above.

### `src/constants.js`
- `MAP_W`: 60 → 120
- `MAP_H`: 45 → 90

### After implementation, verify:
- No entity spawns outside the 120×90 bounds
- No terrain feature overlaps with another named location
- The radio tower is reachable by walking from any crash site
- The cave has adjacent rocks
- The bear's `homeX`/`homeY` matches the new cave position
- Every cabin is on a walkable-adjacent tile
- The outpost crash site puts the player within ~5 tiles of the outpost

## Step 3: Terrain generation rewrite

The `genMap()` function needs a significant rewrite to place features on the larger map. The approach:

1. Fill entire 120×90 with `T.SNOW`
2. Place the frozen lake (larger, at new coords)
3. Place the tree crescent (larger arc, at new coords)
4. Place boulder clusters (boulder maze + cave mountain)
5. Place scattered terrain (random trees, random rocks — scale up counts proportionally: ~600 trees, ~160 rocks)
6. Place the hilltop area
7. Place the military outpost (call existing `placeOutpost()` with new coords)
8. Place the hangar
9. Place cabins (lake cabin, hilltop cabin)
10. Place the radio tower (move to new coords ~10, 80)
11. Place the cave entrance
12. Place the crash site (clear area around it, place plane wreckage)

Keep terrain generation deterministic for a given crash site — the world layout is the same every run, only the crash position varies.

## Step 4: Verify rendering

After the map expansion:
- The viewport camera should still follow the player correctly
- Edge-of-map camera clamping should use the new `MAP_W` and `MAP_H`
- Fog of war should initialize to the larger map size (check `src/logic/visibility.js` and wherever `revealed` is initialized)
- Animals should spawn at their new positions

Search for any hardcoded references to `60` or `45` in the codebase that might break:
- `MapView.jsx` — camera clamping
- `useGameLoop.js` — animal respawning at map edges, boundary checks
- `visibility.js` — fog of war grid size
- `saveLoad.js` — map serialization

## Runtime references to MAP_W/MAP_H — SAVE COMPATIBILITY

⚠️ These files may use `MAP_W` or `MAP_H` at runtime (not just during map generation). For save compatibility with old 60×45 maps, **any runtime usage must read from the actual map dimensions** (`state.map[0].length` / `state.map.length`) instead of the constants. Check each one:

- `src/components/MapView.jsx` — camera clamping, viewport edge detection
- `src/logic/visibility.js` — fog of war grid initialization and bounds checking
- `src/hooks/useGameLoop.js` — animal respawn at map edges, boundary collision checks, any edge-of-map logic
- `src/logic/animals.js` — if respawn positions reference MAP_W/MAP_H
- `src/logic/zombies.js` — edge spawn positions (seed 03's `getEdgeSpawnPositions` uses MAP_W/MAP_H)

**Generation-time usage in `mapGen.js` is fine** — new games use the new constants. **Runtime usage must be dynamic** — read from the actual map array, not the constants.

After fixing, test: load an old 60×45 save → camera should clamp correctly, fog of war should render at 60×45, no out-of-bounds errors. Then start a new game → map generates at 120×90.

## Acceptance criteria

- [ ] Map generates at 120×90 tiles
- [ ] All 8 named locations are placed and recognizable
- [ ] Frozen lake, tree crescent, boulder maze, cave, outpost, hangar, hilltop all render correctly
- [ ] Camera follows player and clamps at map edges
- [ ] Fog of war initializes to correct size
- [ ] Animals spawn at appropriate locations on the larger map
- [ ] Crash sites updated for larger map
- [ ] Outbreak crash site near outpost
- [ ] Radio tower moved to new position
- [ ] Old saves still load (60×45 maps render correctly)
- [ ] Performance unchanged (viewport-only rendering confirmed)
- [ ] Random terrain (scattered trees/rocks) fills the larger map proportionally
- [ ] No hardcoded 60/45 references remain in runtime code

## Constraints

- Don't break old saves — camera and rendering must handle both 60×45 and 120×90 maps
- Don't add any new game mechanics — this is purely map/world generation
- Keep terrain generation in `mapGen.js` — don't scatter it across files
- The outpost placement from seed 05 should be moved to the new coordinates, not duplicated

Commit message: `feat: expand map to 120×90 with 8 named base locations`

## Plan before executing

1. Read `src/logic/mapGen.js` — full current generation
2. Read `src/components/MapView.jsx` — camera clamping, viewport rendering, fog init
3. Read `src/logic/visibility.js` — fog grid size
4. Read `src/logic/animals.js` — current spawn positions
5. **Search for ALL hardcoded 60/45 references AND all MAP_W/MAP_H imports across `src/` files — list every hit**
6. **Cross-reference the hardcoded coordinate inventory table above — confirm every entry is accounted for**
7. Propose the rewritten `genMap()` function structure
8. Wait for go-ahead
9. Implement: constants → mapGen rewrite → animal spawns → camera fixes → fog fixes → crash sites → runtime MAP_W/MAP_H fixes
10. Walk through the map visually to confirm all locations render
11. **Test old save load to verify no out-of-bounds crashes**
