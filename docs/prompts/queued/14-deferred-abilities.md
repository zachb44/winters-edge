# Deferred Abilities: Track, Stim Pack, Earth Sense

**Phase 4 — Closing gaps. Run AFTER seed 12 (profession abilities). These three abilities were stubbed with `stub: true` pending new systems. This seed implements the systems and removes the stubs.**

Copy this entire block into Claude Code as a single prompt.

---

Implement the three profession abilities that were deferred in seed 12 because they needed new infrastructure: a temporary fog-of-war reveal system (Track, Earth Sense) and a timed movement speed buff (Stim Pack).

## Current state

In `src/data/abilities.js`, three abilities have `stub: true`:

- **Track** (Hunter, level 3) — `id: 'track'`, `cooldownHours: 12`. Description: "Reveal animals on the visible map for 30s."
- **Stim Pack** (Medic, level 7) — `id: 'stim_pack'`, `cooldownHours: 24`. Description: "+50 stamina, +50% move speed for 30s."
- **Earth Sense** (Prospector, level 7) — `id: 'earth_sense'`, `cooldownHours: 12`. Description: "Reveal all rocks and caves on map for 30s."

In `src/App.jsx`, the `activateAbility` handler has cases for these three that just log "not yet implemented".

Fog of war lives in `src/logic/visibility.js`. The `visibilityAt(fog, px, py, x, y)` function returns 2 (in sight), 1 (explored), or 0 (unknown). The fog grid `state.fog` is a 2D array where `fog[y][x] = true` means "previously explored." The visible radius is `VISION_RADIUS = 5` from `src/constants.js`.

Movement uses click-to-move pathfinding. There is no "movement speed" multiplier in the current system — the player moves one tile per movement tick. The movement cadence is controlled in `useGameLoop.js`.

## System 1: Temporary reveals (Track + Earth Sense)

### Approach — overlay reveals, not fog mutation

Do NOT permanently write to `state.fog`. Instead, add a `state.temporaryReveals` array that holds timed reveal entries. The visibility system checks these alongside the fog grid.

### State additions

```js
state.temporaryReveals = [];
// Each entry: { x, y, expiresDay, expiresTime }
// Multiple entries can exist (e.g., Track and Earth Sense active simultaneously)
```

### How reveals work

1. **On activation:** scan the map for relevant tiles/entities, push `{ x, y, expiresDay, expiresTime }` entries for each revealed tile into `state.temporaryReveals`. The expiration is 30 game-minutes (0.5 game-hours) from now.

2. **Visibility check:** update `visibilityAt` in `src/logic/visibility.js` to accept `temporaryReveals` as an optional parameter. If a tile has a matching entry that hasn't expired, return `2` (full visibility) even if it's outside VISION_RADIUS and hasn't been explored.

   ```js
   export function visibilityAt(fog, px, py, x, y, temporaryReveals, currentDay, currentTime) {
     const dx = x - px, dy = y - py;
     if (dx * dx + dy * dy <= VISION_RADIUS * VISION_RADIUS) return 2;
     // Check temporary reveals
     if (temporaryReveals && temporaryReveals.length > 0) {
       const now = currentDay * 24 + currentTime;
       for (const r of temporaryReveals) {
         if (r.x === x && r.y === y) {
           const exp = r.expiresDay * 24 + r.expiresTime;
           if (now < exp) return 2;
         }
       }
     }
     return fog[y] && fog[y][x] ? 1 : 0;
   }
   ```

3. **Cleanup:** in `useGameLoop.js`, once per tick (or once per day rollover for efficiency), prune expired entries from `state.temporaryReveals`.

4. **All callers of `visibilityAt` must be updated** to pass the new parameters. Find every call site — it's used in `MapView.jsx` for rendering tiles/entities and possibly in the game loop. Pass `state.temporaryReveals`, `state.day`, `state.time`.

### Track activation (Hunter)

When the player activates Track:

1. Scan `state.animals` for all animals currently alive.
2. For each animal, push `{ x: a.x, y: a.y, expiresDay, expiresTime }` into `state.temporaryReveals`.
3. **Important:** animals move. The reveal shows where they WERE when Track was activated, like a snapshot. The revealed tiles persist for 30 game-minutes but animals may have moved off them. This is intentional — it's "tracking" (finding traces), not "radar."
4. Log: `👣 Track activated — ${count} animal positions revealed for 30 minutes.`
5. Start cooldown via `setCooldown(state, 'track', 12)`.

### Earth Sense activation (Prospector)

When the player activates Earth Sense:

1. Scan `state.map` for all ROCK tiles (`T.ROCK` from `src/data/tiles.js`) and CAVE tiles (`T.CAVE`).
2. For each matching tile, push a reveal entry.
3. Log: `🔮 Earth Sense activated — ${count} rock and cave tiles revealed for 30 minutes.`
4. Start cooldown via `setCooldown(state, 'earth_sense', 12)`.

### Render effect

Temporarily revealed tiles that are outside the player's normal vision radius should render with a subtle highlight to distinguish them from normally visible tiles. In `MapView.jsx`, when a tile's visibility comes from a temporary reveal (vis === 2 but distance > VISION_RADIUS), apply a faint blue-purple tint overlay (e.g., `rgba(120, 100, 255, 0.15)` background overlay).

## System 2: Timed movement speed buff (Stim Pack)

### Approach — movement speed multiplier

Add `state.moveSpeedMultiplier` (default 1.0) and `state.moveSpeedExpires` (null or `{ day, time }`).

### How it works

1. **On activation:** set `state.moveSpeedMultiplier = 1.5` and `state.moveSpeedExpires = { day, time }` where the expiry is 30 game-minutes from now. Also add +50 stamina (capped at max): `state.stamina = Math.min(state.maxStamina, state.stamina + 50)`.

2. **Movement tick:** find where the player's movement cadence is controlled in `useGameLoop.js`. The player currently moves at a fixed rate (likely every N ticks or based on a timer). Divide the movement interval by `state.moveSpeedMultiplier`. If the current system moves the player every X ticks, the player should move every `Math.max(1, Math.round(X / state.moveSpeedMultiplier))` ticks instead.

3. **Expiry check:** in `useGameLoop.js`, once per tick, check if `state.moveSpeedExpires` is set and if `(currentDay * 24 + currentTime) >= (expDay * 24 + expTime)`. If expired, reset `state.moveSpeedMultiplier = 1.0` and clear `state.moveSpeedExpires = null`. Log: `💊 Stim Pack wore off.`

4. **Visual indicator:** while Stim Pack is active, add a subtle green pulse/glow around the player emoji in MapView (CSS animation, similar to the campfire glow approach).

5. Log on activation: `💊 Stim Pack activated — +50 stamina, +50% move speed for 30 minutes.`
6. Start cooldown via `setCooldown(state, 'stim_pack', 24)`.

## Ability definition updates

In `src/data/abilities.js`, remove `stub: true` from all three abilities:

- `track`: remove `stub: true`
- `stim_pack`: remove `stub: true`
- `earth_sense`: remove `stub: true`

## App.jsx activation handler updates

In the `activateAbility` handler in `src/App.jsx`, replace the three stub cases with real implementations:

- `'track'`: scan animals, push reveals, log, setCooldown
- `'earth_sense'`: scan map tiles, push reveals, log, setCooldown
- `'stim_pack'`: set moveSpeedMultiplier + expiry, add stamina, log, setCooldown

## Save migration

In `src/logic/saveLoad.js`:

```js
state.temporaryReveals ??= [];
state.moveSpeedMultiplier ??= 1.0;
state.moveSpeedExpires ??= null;
```

## Acceptance criteria

- [ ] Track reveals all animal positions as temporarily visible tiles for 30 game-minutes
- [ ] Earth Sense reveals all ROCK and CAVE tiles as temporarily visible for 30 game-minutes
- [ ] Temporarily revealed tiles render with a subtle blue-purple tint when outside normal vision
- [ ] Stim Pack grants +50 stamina (capped at max) and +50% move speed for 30 game-minutes
- [ ] Stim Pack movement speed increase is visible — player moves noticeably faster
- [ ] Stim Pack visual indicator (green glow) appears on player while active
- [ ] All three abilities start their cooldowns on activation
- [ ] All three abilities no longer show "not yet implemented" log
- [ ] `stub: true` removed from all three ability definitions
- [ ] Temporary reveals are pruned after expiry
- [ ] Move speed multiplier resets after expiry with a log message
- [ ] All callers of `visibilityAt` updated to pass new parameters
- [ ] Save/load preserves temporaryReveals, moveSpeedMultiplier, moveSpeedExpires
- [ ] `vite build` passes

## Constraints

- Do NOT permanently mutate `state.fog` — temporary reveals are their own system
- Track reveals are snapshots — they show where animals were, not where they are now
- Earth Sense reveals map tiles (static), so those reveals stay accurate for the full duration
- Movement speed changes must respect pause — when the game is paused, no movement happens regardless of multiplier
- The `visibilityAt` function signature change affects all callers — find them all before implementing

## Plan before executing

1. Read `src/logic/visibility.js` — understand current visibilityAt
2. Read `src/components/MapView.jsx` — find all visibilityAt call sites
3. Read `useGameLoop.js` — find player movement cadence and all visibilityAt calls
4. Read `src/App.jsx` — find the activateAbility handler and the three stub cases
5. Read `src/data/tiles.js` — confirm T.ROCK and T.CAVE tile type constants
6. Propose the integration plan with specific line references
7. Wait for go-ahead
8. Implement: visibility.js update → reveal cleanup in game loop → ability activations → MapView render tint → ability def cleanup → save migration
