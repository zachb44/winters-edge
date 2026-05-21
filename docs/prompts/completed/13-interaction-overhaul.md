# Interaction Overhaul Bundle

**Note:** Review against PIVOT.md before running. Some sub-features may need minor tweaks for mode-awareness. Flag any conflicts during the planning phase.

Copy this entire block into Claude Code as a single prompt.

---

Five connected gameplay/UX improvements based on playtest feedback. Ship as one commit. These all touch how the player interacts with the world — combat lethality, looting, ranged attacks, building menus, and build mechanics.

## 1. Tone down predator lethality

Wolves and other hostiles kill the player too fast. There's no time to react before dying. Two fixes combined:

### Damage reduction

Animal damage values are currently hardcoded in `useGameLoop.js` (search for `const baseDmg = a.type === 'wolf' ? 8`). Move them to a data constant in `src/data/combat.js`:

```js
export const ANIMAL_DAMAGE = {
  wolf: 5,   // was 8
  boar: 9,   // was 12
  bear: 14,  // was 20
};
```

Then in `useGameLoop.js`, replace the inline ternary chain with:
```js
const baseDmg = ANIMAL_DAMAGE[a.type] || 8;
```

This also benefits seed 12 (profession abilities that modify damage taken) by making damage values centralized and importable.

### Engagement charging delay

When a hostile animal first engages the player (transitions from wandering/approaching to attacking), there's a 600ms "charging" delay before their FIRST swing. Subsequent swings happen on normal attack-speed cadence.

This gives the player time to see the threat, react, and start moving away or fighting back.

Implementation: when animal enters combat-attack range (distance ≤ 1 for the first time), set `animal.engagementChargedAt = now + 600`. Don't allow them to swing until `now >= engagementChargedAt`. Reset `engagementChargedAt` to `null` whenever they move out of attack range (distance > 1), so the delay applies again on re-engagement.

Doesn't apply to rabbits, deer, seals, ravens (they don't attack anyway).

## 2. Killed animals leave corpses

Currently, killing an animal auto-transfers loot to inventory. Change this: animals leave a corpse on the tile that the player must click to loot.

### Corpse mechanics

- When an animal dies, spawn a `Corpse` entity at its tile with:
  - `type` (matching the animal type)
  - `loot` (the rolled drops that would have been auto-added)
  - `spawnTime` (game-time: `{ day: state.day, time: state.time }`)
- Visual: a small bone/skull icon (💀 emoji is fine for now) on the tile
- Click the corpse → loot transfers to inventory, log message shows what was looted, corpse disappears
- Corpses persist for up to 4 in-game hours, then automatically decay (vanish). Check in game loop: `(currentDay * 24 + currentTime) - (spawnDay * 24 + spawnTime) >= 4`
- Save/load: corpses persist in save state

### Zombie corpses

Zombie kills: for now, zombies continue to auto-drop loot on kill (existing behavior in `applyZombieAttack` in `src/logic/zombies.js`). Zombie corpse support is deferred. Add a TODO comment in `applyZombieAttack` at the loot drop section: `// TODO: spawn corpse instead of auto-loot (deferred — see seed 13 corpse system)`

### State additions

```
state.corpses = [{ id, x, y, type, loot, spawnDay, spawnTime }]
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

### UI approach — depends on seed 07 status

**If seed 07 (D2 HUD) HAS shipped:** Building menus display in the center HUD zone. Seed 07 already established this as the canonical building interaction UI. This sub-feature adds the per-building action buttons (Add Wood, Cook, Sleep, Demolish, etc.) to that center zone's building panel. Do NOT create a separate floating popup component.

**If seed 07 has NOT shipped:** Create a `BuildingActionMenu.jsx` component — a small floating popup that appears near the building on the map when clicked. Same actions, different container.

### Behavior

- Click any building on the map → menu appears (in center zone or as popup)
- Menu shows actions specific to that building
- Click an action → action executes (some require resources)
- Click outside / press Esc → menu closes

### Per-building menus

**Campfire**
- "Add Wood" (if you have wood) — adds 4 fuel per wood
- "Cook Raw Meat" (if you have raw meat AND fire is lit) — converts 1 raw meat → 1 cooked meat
- "Rest Here" (if fire is lit) — pauses player, +1 warmth per real-time second, click anywhere to stand up
- "Demolish" — returns 2 wood, removes campfire

**Tent**
- "Sleep Until Dawn" (only if time is between 19:00 and 6:00) — skip to 7:00 next day, +30 warmth, full stamina, +25 character XP for surviving day (use `applyXp(s, 25)`)
- "Demolish" — returns 5 wood + 1 scrap

**Wall**
- "Demolish" — returns 1 wood

**Stockpile**
- "Demolish" — returns 4 wood + 1 scrap
- (Future: storage interface — for now just a placeholder)

**Workbench**
- "Open Crafting" — if seed 09 (workbench crafting) has shipped, opens the full crafting menu. If not, opens a basic crafting modal with one recipe: Hatchet costing 3 wood + 2 stone + 1 scrap.
- "Demolish" — returns 6 wood + 2 stone + 1 scrap

**Snare Trap**
- "Check Trap" — if caught, +1 raw meat, resets trap
- "Demolish" — returns 2 wood

**Barricade / Reinforced Wall** (if seed 11 has shipped)
- "Repair" — if HP < maxHp and player has materials (see seed 11 for costs)
- "Demolish" — returns partial materials

### Implementation

- State: `state.selectedBuilding = { x, y, type } | null`
- Click building → sets selectedBuilding, menu appears
- Click action → executes action handler
- Action handlers as pure functions in `src/logic/buildings.js`

### Remove old hack

The current "walk on tent tile + click self = sleep" behavior should be removed. Sleep happens via the new tent menu only.

## 5. Building placement improvements: adjacency + build time

Currently the player can place buildings anywhere on the map instantly. Two changes:

### Adjacency requirement

Player must be within 5 tiles (Manhattan distance) of the target tile to place a building. Valid tiles highlighted green when Build mode is active.

If the player clicks a tile that's in range but not adjacent (distance > 1), the player walks toward it first, then begins building when adjacent.

### Build time

Buildings aren't instant. A brief build time adds weight to the decision.

**Formula:** `buildTimeMinutes = Math.min(5, Math.ceil(totalCost / 4))` where `totalCost = wood + stone + scrap` from the building definition.

This caps at 5 in-game minutes (~100 seconds real-time at 1x speed). Examples:
- Campfire (5 total) = 2 in-game minutes (~40 sec at 1x)
- Tent (12 total) = 3 in-game minutes (~60 sec at 1x)
- Workbench (19 total) = 5 in-game minutes (~100 sec at 1x)
- Wall (3 total) = 1 in-game minute (~20 sec at 1x)

These feel meaningful without being tedious. At 3x speed, the longest build is ~33 seconds.

### Build time mechanics

1. Player selects a building from Build menu
2. Valid placement tiles highlighted within 5 tiles of player
3. Player clicks target tile
4. Resources deducted immediately
5. Ghost building (50% opacity) appears at the tile with a small progress bar
6. Player stays at their current position (no movement lock — they can walk away, but the build continues from where they placed it)
7. Game loop advances progress: `state.activeBuild.progress += timeElapsed`
8. When progress reaches duration, ghost becomes real building, log confirms
9. Pressing Esc during build cancels it — resources refunded, ghost removed

### State

```
state.activeBuild = { buildingType, x, y, startDay, startTime, durationMinutes } | null
```

Check completion in game loop: if `(currentDay * 24 + currentTime) - (startDay * 24 + startTime) >= durationMinutes / 60`, complete the build.

Only one active build at a time.

## Constraints

- Don't break existing systems — combat, leveling, harvest, save/load all work identically
- Save migration: backfill `state.corpses = []`, `state.projectiles = []`, `state.selectedBuilding = null`, `state.activeBuild = null` for older saves
- The building action menu should feel native to the rest of the UI — slate background, clear buttons, matches the tooltip aesthetic
- Architecture: keep logic pure where possible. New files likely needed:
  - `src/logic/buildings.js` — handler functions for each menu action
  - `src/components/Corpse.jsx` or render inline in MapView
  - `src/components/Projectile.jsx`
  - `src/components/BuildProgress.jsx` (the ghost + progress bar)
  - `src/components/BuildingActionMenu.jsx` (only if seed 07 has NOT shipped)

Commit message: `feat: reduce predator dmg, add corpses/projectiles/building menus/build time`

## Plan before executing

1. Read combat damage code in `useGameLoop.js`, attack timing, `App.jsx` building placement/interaction, `MapView.jsx` render
2. Check if seed 07 has shipped (look for D2-style bottom HUD / center zone in the UI)
3. Propose how building menus and the new placement flow will integrate
4. Wait for my go-ahead
5. Implement incrementally:
   - Predator damage tuning (move to data constant) + charging delay
   - Corpse system (drop + click to loot + decay)
   - Projectile animations
   - Building action menus (center zone or popup depending on 07 status)
   - Build time + adjacency
6. Summarize and list anything specific to playtest
