# Visual Glow-Up: Canvas Renderer + Pixel Art + Lighting + Camera Smoothing

Copy this entire block into Claude Code as a single prompt.

---

Replace the DOM-based tile renderer with an HTML5 Canvas renderer, integrate a free pixel art tileset, add dynamic lighting, and smooth the camera. This is the single biggest visual upgrade the game can get without leaving the browser.

## Why this matters

The current renderer uses individual `<div>` elements for each visible tile (24×18 = 432 divs), plus overlays for entities, buildings, weather, and fog. It works but looks like a prototype — emoji on colored squares. This seed replaces that with a proper 2D game rendering pipeline while keeping ALL game logic untouched.

## Scope — what changes and what doesn't

### CHANGES (rendering only)
- MapView.jsx gets rewritten to use a `<canvas>` element
- Tiles, entities, buildings render as sprite images instead of emoji
- Dynamic lighting system (darkness + light sources)
- Camera interpolation (smooth scrolling)
- All visual overlays (fog, weather, hit flashes, damage numbers) move to canvas

### DOES NOT CHANGE
- No game logic files touched (combat.js, zombies.js, abilities.js, etc.)
- No data files touched (tiles.js, buildings.js, animals.js, etc.)
- No hooks touched (useGameLoop.js stays identical)
- State shape stays identical
- Save/load stays identical
- Click handling / input stays functionally identical (but coordinates translate through canvas)
- HUD components (BottomHud, GameUI, AbilityHotbar, etc.) stay as React — only the map viewport becomes canvas

## Part 1 — Canvas renderer foundation

### New file: `src/components/MapCanvas.jsx`

Replace the div-grid rendering in MapView with a single `<canvas>` element.

```
Structure:
- Single <canvas> element sized to VIEW_W * TILE × VIEW_H * TILE
- useRef for canvas + 2D context
- useEffect render loop synced to requestAnimationFrame
- All draw calls happen in a single render function called each frame
```

**Render order (back to front):**
1. Terrain tiles (from tileset spritesheet)
2. Fog of war overlay (dark tiles for unexplored, semi-transparent for explored)
3. Buildings
4. Corpses and crates
5. Animals
6. Zombies
7. Player
8. Lighting overlay (see Part 3)
9. Weather effects (snow particles, blizzard overlay)
10. Sky color tint
11. Hit flashes
12. Floating damage numbers
13. Projectiles
14. UI overlays (move target indicator, build preview, hover highlight)

**Click handling:**
- Canvas onClick converts pixel coordinates to tile coordinates: `tx = Math.floor(e.offsetX / TILE) + view.x`, `ty = Math.floor(e.offsetY / TILE) + view.y`
- onMouseMove updates hover state the same way
- Pass the same `onTileClick` callback the current MapView uses

**Performance considerations:**
- Only redraw when state changes or animation is active (damage numbers, projectiles, snow)
- Use `requestAnimationFrame` for smooth 60fps when animating
- Pre-compute the blocking building set once per frame, not per tile
- Sprite images loaded once via `new Image()` and cached

### Sprite loading

Create `src/assets/sprites.js`:
- Export a `loadSprites()` async function that loads the tileset image(s)
- Return a map of sprite keys to `{ image, sx, sy, sw, sh }` (source rectangle in spritesheet)
- MapCanvas waits for sprites to load before first render (show a loading indicator)
- Fallback: if sprites fail to load, render colored rectangles with emoji text (current behavior) so the game never breaks

### Tileset approach

Use a free pixel art tileset. Options (Claude Code should search for and evaluate):
- **Kenney.nl** game assets (CC0 license, excellent quality, multiple terrain packs)
- **OpenGameArt.org** top-down tilesets
- Download a suitable 16×16 or 32×32 winter/snow tileset and place in `src/assets/tilesets/`

Minimum sprites needed:
- **Terrain:** snow, ice, tree, rock, cave, water (6 base tiles)
- **Structures:** plane wreckage, cabin, armory, barracks, watchtower, tower (6 POI tiles)
- **Buildings:** campfire (lit/unlit), tent, wall, stockpile, workbench, snare trap, barricade, reinforced wall, spike trap (9 buildings)
- **Entities:** player (per profession, or generic), rabbit, wolf, boar, bear, deer, seal, raven, zombie shambler (9+ entities)
- **Items:** corpse skull, crate (2 objects)

If a perfect tileset isn't found, use Kenney's generic RPG tiles and recolor for winter. The key constraint is: any tileset used must be CC0 or MIT licensed for commercial use.

**Tile mapping:** Add a `sprite` field to each entry in `src/data/tiles.js` TILE_DATA that maps to the sprite key: `{ ...existing, sprite: 'terrain_snow' }`. Same for BUILDINGS and animal/zombie types. The canvas renderer reads this field; the old DOM renderer (if kept as fallback) ignores it.

## Part 2 — Camera interpolation (smooth scrolling)

### How it works now

The camera (`view.x`, `view.y`) snaps instantly when the player moves. The viewport jumps 1 tile at a time.

### What changes

Add a `cameraX` / `cameraY` float that lerps toward the target `view.x` / `view.y` each frame:

```js
// In the render loop:
const lerpSpeed = 0.12; // Adjust for feel
cameraX += (targetX - cameraX) * lerpSpeed;
cameraY += (targetY - cameraY) * lerpSpeed;

// Snap if very close (avoid sub-pixel jitter)
if (Math.abs(targetX - cameraX) < 0.01) cameraX = targetX;
if (Math.abs(targetY - cameraY) < 0.01) cameraY = targetY;
```

The canvas render uses `cameraX`/`cameraY` for the draw offset, so tiles slide smoothly instead of snapping. This means tiles at the edges may be partially visible (clipped by the canvas boundary) — that's correct and expected.

### Player movement smoothing

The player position also lerps. Track `renderPlayerX`/`renderPlayerY` that chase `state.player.x`/`state.player.y`:

```js
renderPlayerX += (state.player.x - renderPlayerX) * 0.2;
renderPlayerY += (state.player.y - renderPlayerY) * 0.2;
```

This gives the player a gliding feel instead of tile-snapping. Entity positions (animals, zombies) get the same treatment.

## Part 3 — Dynamic lighting

This is the biggest mood upgrade. Instead of flat visibility, the world gets actual darkness with light sources punching through.

### How it works

After rendering all entities and terrain, draw a full-screen dark overlay on top, then "cut" circular light holes into it:

1. Create an offscreen canvas (same size as viewport)
2. Fill it with the darkness color (varies by time of day):
   - Full day (7-17): no overlay (skip entirely)
   - Dawn/dusk (5-7, 17-19): very light overlay, rgba(0,0,20, 0.15-0.35)
   - Night (19-5): heavy overlay, rgba(0,0,20, 0.6-0.75)
3. Set `globalCompositeOperation = 'destination-out'`
4. Draw radial gradients at each light source position to "erase" darkness:
   - **Player:** radius = VISION_RADIUS * TILE (affected by torch/lantern per seed 15 if shipped)
   - **Lit campfires:** radius = 5 * TILE, warm orange tint
   - **Torches held by player:** extends player radius (if seed 15 shipped)
5. Reset composite operation
6. Draw the darkness overlay onto the main canvas

### Light source colors

- Player vision: white/cool blue gradient (moonlight feel)
- Campfire: warm orange gradient with slight flicker (randomize radius ±2px each frame)
- Blizzard: reduce all light radii by 30%

### Fog of war integration

Fog of war (unexplored tiles) is SEPARATE from lighting:
- Unexplored tiles (vis === 0): completely black, no rendering at all
- Previously explored (vis === 1): render terrain at reduced brightness (current behavior), lighting does NOT apply (you can't see into explored-but-distant tiles at night)
- Currently visible (vis === 2): render fully, then apply lighting overlay

## Part 4 — Entity rendering upgrades

### Sprite-based entities

Instead of emoji, entities draw from the spritesheet. If sprites exist:
- Draw the sprite image at the entity's render position (with lerp)
- Scale to TILE size

If sprites don't exist for an entity, fall back to drawing the emoji as text on canvas: `ctx.fillText('🐺', x, y)` — this means the game never breaks even with missing art.

### Animation basics

- **Idle bob:** entities gently bob up/down (1-2px sine wave, different phase per entity)
- **Movement glide:** position lerps between tiles (same as player)
- **Lunge animation:** already exists as pixel offset — port directly to canvas coordinates
- **Hit flash:** draw a white or red semi-transparent rectangle over the entity tile for 200ms (same as current but canvas-native)
- **Damage numbers:** draw as canvas text that floats upward and fades (same behavior as current FloatingDamage component but rendered in canvas)

### Player rendering

- Draw profession sprite (or emoji fallback)
- Add a subtle white glow/outline so the player always stands out from terrain
- Lunge animation ports directly (offset toward target)
- Bob animation during movement (already exists)

## Part 5 — Weather as canvas particles

### Snow particles

The current implementation uses absolutely-positioned divs for snowflakes. Move to canvas:
- Maintain an array of particle objects: `{ x, y, size, speed, opacity, drift }`
- Each frame: update positions (fall + horizontal drift), wrap around edges
- Draw as small white circles or 1-2px dots
- Snow count: clear = 0, snow = 30, blizzard = 100
- Blizzard adds a white overlay tint (same as current `weatherOverlay`)

### Campfire smoke

Port the existing CSS smoke effect to canvas particles:
- Small grey circles that rise and fade from lit campfires
- 3-5 particles per campfire, slow rise, expand and fade over 2-3 seconds

## Part 6 — Tooltip and UI overlay

Tooltips and hover highlights stay as React overlays ON TOP of the canvas (not drawn in canvas). This is intentional:
- Canvas handles the game world
- React handles the UI layer (tooltips, menus, HUD)
- They stack via CSS z-index

The MapCanvas component renders:
```jsx
<div className="relative">
  <canvas ref={canvasRef} ... />
  {/* Tooltip overlay */}
  {hover && <TooltipOverlay ... />}
  {/* Build preview — could be canvas or React */}
  {/* Selected building highlight */}
</div>
```

## Implementation order

This seed is large. Split into sub-commits:

### Commit 1: Canvas foundation
- New MapCanvas.jsx with basic colored-rectangle rendering (no sprites yet)
- Camera lerp
- Player + entity position lerp
- Click handling
- Fog of war rendering
- All overlays ported (hit flashes, damage numbers, projectiles)
- **At this point the game looks identical to before but renders via canvas**

### Commit 2: Lighting system
- Dark overlay with light source cutouts
- Player vision light
- Campfire glow
- Time-of-day darkness scaling
- **This is the biggest mood change — night actually looks dark**

### Commit 3: Sprite integration
- Download and integrate tileset
- Sprite loading system
- Terrain renders as sprites
- Buildings render as sprites
- Entity sprites (with emoji fallback)
- **The game now looks like an actual indie game**

### Commit 4: Polish
- Weather particles in canvas
- Entity idle bob
- Campfire smoke particles
- Final performance pass

## Constraints

- **ZERO game logic changes.** This is purely a rendering swap.
- All existing MapView functionality must be preserved (click targets, tooltips, build preview, combat overlay, harvest HP bars, etc.)
- The game must remain playable at every commit — no intermediate broken state
- Keep the old MapView.jsx as `MapView.legacy.jsx` so it can be swapped back if needed
- Canvas rendering must hit 60fps on a mid-range laptop
- All downloaded art assets must be CC0 or MIT licensed
- If a suitable tileset can't be found or downloaded, commit 3 can use programmatic tile rendering (colored rectangles with texture patterns drawn in canvas) — still better than divs
- Save/load is not affected in any way

## Plan before executing

1. Read `src/components/MapView.jsx` — understand every render path and overlay
2. Read `src/constants.js` — TILE size, view dimensions
3. Read `src/data/tiles.js` — all tile types and their visual properties
4. Read `src/data/buildings.js` — all building types and emojis
5. Read `src/App.jsx` — understand how MapView is mounted, what props it receives, how clicks flow
6. Search for suitable free tilesets (Kenney.nl, OpenGameArt.org)
7. Propose plan with specific tileset choice, wait for go-ahead
8. Implement in 4 sub-commits as described above
9. After each commit, summarize what to playtest

Commit messages:
- `feat: canvas renderer foundation with camera smoothing`
- `feat: dynamic lighting system with campfire glow`
- `feat: pixel art tileset integration`
- `feat: canvas weather particles and entity polish`
