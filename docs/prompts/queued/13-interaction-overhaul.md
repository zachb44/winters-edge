# Interaction Overhaul Bundle

**Note:** Review against PIVOT.md before running. Some sub-features (corpse looting, building menus) may need adjustment if Outbreak Mode is already shipped — e.g., zombie corpses should also leave lootable remains. The 5 sub-features here are all still valid but may need minor tweaks for mode-awareness. Flag any conflicts during the planning phase.

Copy this entire block into Claude Code as a single prompt.

---

Five connected gameplay/UX improvements based on playtest feedback. Ship as one commit. These all touch how the player interacts with the world — combat lethality, looting, ranged attacks, building menus, and build mechanics.

## 1. Tone down predator lethality

Wolves and other hostiles kill the player too fast. There's no time to react before dying. Two fixes combined:

### Damage reduction

Reduce base damage per swing:
- Wolf: 8 → 5
- Boar: 12 → 9
- Bear: 20 → 14

(Veteran's 25% damage reduction still applies on top.)

### Engagement charging delay

When a hostile animal first engages the player (transitions from wandering/approaching to attacking), there's a 600ms "charging" delay before their FIRST swing. Subsequent swings happen on normal attack-speed cadence.

This gives the player time to see the threat, react, and start moving away or fighting back.

Implementation: when animal enters combat-attack range, set `animal.engagementChargedAt = now + 600`. Don't allow them to swing until `now >= engagementChargedAt`. Reset this whenever they disengage and re-engage.

Doesn't apply to rabbits, deer, seals, ravens (they don't attack anyway).

## 2. Killed animals leave corpses

Currently, killing an animal auto-transfers loot to inventory. Change this: animals leave a corpse on the tile that the player must click to loot.

### Corpse mechanics

- When an animal dies, spawn a `Corpse` entity at its tile with:
  - `type` (matching the animal type)
  - `loot` (the rolled drops that would have been auto-added)
  - `spawnTime` (game-time timestamp)
- Visual: a small bone/skull icon (💀 emoji is fine for now) on the tile
- Click the corpse → loot transfers to inventory, log message shows what was looted, corpse disappears
- Corpses persist for up to 4 in-game hours, then automatically decay (vanish)
- Save/load: corpses persist in save state

### State additions

```
state.corpses = [{ id, x, y, type, loot, spawnTime }]
```

Render them in MapView similar to how crates render. Stack visually if multiple on same tile.

## 3. Ranged weapon projectile animation

When the player attacks with a ranged weapon (hunting bow or rifle), show a small projectile animating from the player to the target.

### Implementation

- On ranged swing landing, spawn a temporary projectile element
- Animates in a straight line from player position to target position over ~200ms
- Then fades and removes itself
- Hit effect (damage number, hit flash, etc.) only triggers after projectile reaches target

### Visual

- Bow arrow: small white/cream "—" or arrow icon that rotates to point at target
- Rifle: small yellow flash dot that travels faster (~120ms)
- Both have a slight motion trail / fade

### Architecture

- New `state.projectiles = [{ id, fromX, fromY, toX, toY, type, startTime }]`
- Visual effects loop adds/removes them on their timing
- New component: `src/components/Projectile.jsx`

## 4. Building interaction menu

This is the biggest change in this bundle. Replace the current "walk on top of tent and click self to sleep" with proper building menus.

### Behavior

- Click any building on the map → small popup menu appears next to the building
- Menu shows actions specific to that building
- Click an action → action executes (some require resources)
- Click outside the menu → menu closes
- Press Esc → menu closes

### Per-building menus

**Campfire**
- "Add Wood" (if you have wood) — adds 4 fuel per wood
- "Cook Raw Meat" (if you have raw meat AND fire is lit) — converts 1 raw meat → 1 cooked meat
- "Rest Here" (if fire is lit) — pauses player, +1 warmth per real-time second, click anywhere to stand up
- "Demolish" — returns 2 wood, removes campfire

**Tent**
- "Sleep Until Dawn" (only if time is between 19:00 and 6:00) — skip to 7:00 next day, +30 warmth, full stamina, +25 character XP for surviving day
- "Demolish" — returns 5 wood + 1 scrap

**Wall**
- "Demolish" — returns 1 wood

**Stockpile**
- "Demolish" — returns 4 wood + 1 scrap
- (Future: storage interface — for now just a placeholder)

**Workbench**
- "Open Crafting" — opens a basic crafting modal (placeholder for Mission C — for now, just one recipe: Hatchet costing 3 wood + 2 stone + 1 scrap)
- "Demolish" — returns 6 wood + 2 stone + 1 scrap

**Snare Trap**
- "Check Trap" — if caught, +1 raw meat, resets trap
- "Demolish" — returns 2 wood

### Implementation

- New component: `src/components/BuildingActionMenu.jsx` — small floating popup
- State: `state.selectedBuilding = { x, y, type } | null`
- Click building → sets selectedBuilding, menu appears
- Click action → executes action handler
- Menu positions itself near the building's screen coordinates

### Remove old hack

The current "walk on tent tile + click self = sleep" behavior should be removed. Sleep happens via the new tent menu only.

## 5. Building requires adjacency + has a build time

Currently the player can place buildings anywhere on the map by clicking. This is too easy.

### New behavior

1. Player opens Build menu, selects a building (Campfire, Tent, etc.)
2. Valid placement tiles are highlighted green (within 5 tiles of player and meet existing rules — snow/ice tile, not already occupied)
3. Player clicks a target tile
4. If target is not adjacent (within 1 tile), player walks toward it first, then begins building
5. Building site shows a "ghost" / blueprint version of the structure (semi-transparent) while construction is in progress
6. Build time: 2 in-game minutes per wood-cost-tier (Campfire 5 wood = 10 in-game min, Tent 10 wood = 20 in-game min, Workbench 12 wood + others = 30 in-game min)
   - Simpler formula: `buildTimeInGameMinutes = totalCost * 2` where totalCost = wood + stone + scrap
7. Player cannot move during build
8. Pressing Esc cancels the build (resources refunded)
9. When build completes, structure replaces ghost, log message confirms

### Visual feedback

- Ghost building shown at 50% opacity during construction
- Small progress bar above the build site
- Player stays on adjacent tile during build
- "Building Campfire... 30%" type log progress updates (or just the progress bar, no log spam)

### State

```
state.activeBuild = { buildingType, x, y, startTime, totalDuration } | null
```

When a build is active, the game loop tracks progress and completes the structure when `currentTime - startTime >= totalDuration`.

## Constraints

- Don't break existing systems — combat, leveling, harvest, save/load all work identically
- Save migration: backfill `state.corpses = []`, `state.projectiles = []`, `state.selectedBuilding = null`, `state.activeBuild = null` for older saves
- The building action menu should feel native to the rest of the UI — slate background, clear buttons, matches the tooltip aesthetic
- Architecture: keep logic pure where possible. New files likely needed:
  - `src/data/buildings.js` — extend with menu actions
  - `src/data/corpses.js` — corpse decay timing, etc.
  - `src/logic/buildings.js` — handler functions for each menu action
  - `src/components/BuildingActionMenu.jsx`
  - `src/components/Corpse.jsx`
  - `src/components/Projectile.jsx`
  - `src/components/BuildProgress.jsx` (the ghost + progress bar)

Commit message: `feat: reduce predator dmg, add corpses/projectiles/building menus/build time`

## Plan before executing

1. Read combat damage code, attack timing in useGameLoop, placeBuilding/interactBuilding, MapView render
2. Propose how building menus and the new placement flow will integrate
3. Wait for my go-ahead
4. Implement incrementally:
   - Predator damage tuning + charging delay
   - Corpse system (drop + click to loot)
   - Projectile animations
   - Building action menus
   - Build time + adjacency
5. Summarize and list anything specific to playtest
