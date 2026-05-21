# Deferred Abilities: Track, Stim Pack, Earth Sense

Copy this entire block into Claude Code as a single prompt.

---

Implement the three abilities that were stubbed in seed 12 because they needed new systems. Each ability now gets the system it requires.

## Context

Seed 12 shipped 15 of 18 profession abilities. Three were marked `stub: true` in `src/data/abilities.js` because they needed infrastructure that didn't exist:

- **Track** (Hunter lv3) — needs temporary fog-of-war reveal for animals
- **Stim Pack** (Medic lv7) — needs a timed movement speed buff
- **Earth Sense** (Prospector lv7) — needs temporary fog-of-war reveal for resources

This seed builds the two small systems (temporary reveal + speed buff) and wires the three abilities into them.

## System 1 — Temporary entity reveal

This system lets abilities temporarily show entities (animals, tiles) through fog of war without permanently revealing the fog.

### State additions

```js
state.player.activeReveals = [
  { type: 'animals', expiresDay: 2, expiresTime: 14.5 },
  { type: 'resources', expiresDay: 2, expiresTime: 14.5 },
]
```

### How it works

1. **Track activation:** Push `{ type: 'animals', expiresDay, expiresTime }` to `activeReveals`. Duration = 30 game-seconds (0.5 game-minutes = 0.00833 game-hours).
2. **Earth Sense activation:** Push `{ type: 'resources', expiresDay, expiresTime }`. Same duration.
3. **Render in MapView:** During the render pass, check `state.player.activeReveals` for unexpired entries.
   - If an `animals` reveal is active: render ALL animals on the map regardless of fog visibility. Use a distinct visual — add a pulsing glow or a faint outline to revealed animals so the player knows they're seeing through fog. Animals in normal vision range render normally.
   - If a `resources` reveal is active: render stone/rock tiles and cave tiles through fog with a similar pulsing indicator. The tiles themselves stay fogged (dark overlay) but the resource icon shows through.
4. **Expiry in useGameLoop:** Each tick, filter `activeReveals` to remove entries where current game-time >= expires game-time.
5. **Log on activation:** "👣 Track activated — animals revealed for 30 seconds" / "🔮 Earth Sense activated — resources revealed for 30 seconds"
6. **Log on expiry:** "👣 Track faded" / "🔮 Earth Sense faded"

### Important constraints

- Do NOT permanently reveal fog tiles. The reveal is a rendering overlay only — `state.fog` is not modified.
- Animals revealed by Track are NOT clickable for combat engagement if they're outside normal vision range. Track is scouting, not targeting.
- The pulsing visual should be subtle — a soft glow, not a strobe.

## System 2 — Timed movement speed buff

This system lets abilities temporarily increase the player's movement speed.

### State additions

```js
state.player.speedBuff = { multiplier: 1.5, expiresDay: 2, expiresTime: 14.5 } | null
```

### How it works

1. **Stim Pack activation:** Set `speedBuff = { multiplier: 1.5, expiresDay, expiresTime }`. Also heal +50 stamina (capped at max). Duration = 30 game-seconds.
2. **Movement speed hook:** Find where movement tick cadence is computed for the player in `useGameLoop.js`. When `speedBuff` is active and not expired, divide the movement delay by `speedBuff.multiplier` (faster movement = shorter delay between moves).
3. **Expiry in useGameLoop:** Each tick, if `speedBuff` exists and current game-time >= expires, set to null and log.
4. **Visual indicator:** While speed buff is active, add a small ⚡ indicator near the player sprite in MapView. Keep it simple.
5. **Log on activation:** "💊 Stim Pack — +50 stamina, moving faster for 30 seconds"
6. **Log on expiry:** "💊 Stim Pack wore off"

### Important constraints

- Speed buff stacks with nothing — only one speedBuff can be active. Reactivating while active resets the timer.
- The multiplier affects ONLY player movement speed, not attack speed.

## Ability wiring

### Track (Hunter lv3)

In `src/data/abilities.js`:
- Remove `stub: true` from the track entry

In `src/App.jsx` (or wherever `activateAbility` is handled):
- Replace the "not yet implemented" log with:
  - Check `isCooldownReady(state, 'track')`
  - Push `{ type: 'animals', expiresDay, expiresTime }` to `state.player.activeReveals`
  - Set cooldown (12 game-hours)
  - Log activation message

### Earth Sense (Prospector lv7)

Same pattern as Track:
- Remove `stub: true`
- Activation pushes `{ type: 'resources', expiresDay, expiresTime }`
- Cooldown: 12 game-hours
- Log: "🔮 Earth Sense activated — resources revealed for 30 seconds"

### Stim Pack (Medic lv7)

- Remove `stub: true`
- Activation sets `state.player.speedBuff` + heals stamina
- Cooldown: 24 game-hours
- Log activation message

## Save migration

In `src/logic/saveLoad.js`:
```js
state.player.activeReveals = state.player.activeReveals ?? [];
state.player.speedBuff = state.player.speedBuff ?? null;
```

## Constraints

- Don't break existing ability system — all 15 working abilities must still function
- Don't modify fog permanently — reveals are render-only overlays
- Cooldowns use existing game-time model from seed 12
- Active reveals and speed buff pause automatically when the game pauses (they use game-time expiry)
- Remove ALL `stub: true` flags from the three abilities in `src/data/abilities.js`

## Plan before executing

1. Read `src/data/abilities.js` — confirm the three stubs
2. Read `src/logic/abilities.js` — understand the existing activation helpers
3. Read `src/logic/visibility.js` — understand current fog system
4. Read `src/components/MapView.jsx` — understand where animals/tiles render and how fog gates them
5. Read `src/hooks/useGameLoop.js` — find player movement cadence and the tick loop
6. Read `src/App.jsx` — find `activateAbility` handler
7. Propose plan, wait for go-ahead
8. Implement: data changes → logic (reveal system + speed buff) → render hooks → activation wiring → save migration
9. Summarize and call out what to playtest

Commit message: `feat: implement Track, Stim Pack, Earth Sense (deferred abilities)`
