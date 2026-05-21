# Outbreak-Specific Events

**Phase 2 — Gameplay depth. Run AFTER seeds 01 (mode selection) and 03 (wave spawner). Requires `state.mode` and the wave/night system to exist.**

Copy this entire block into Claude Code as a single prompt.

---

Replace or supplement the cold-themed daily events with horde-themed events when playing Outbreak Mode. Wilderness Mode events stay completely unchanged.

## Current event system

In `src/data/events.js`, there's an `EVENT_TABLE` array with 12 events. Each has:
- `id`, `weight`, `min_day`, `name`, `desc`

The `rollDailyEvent(day)` function filters by `min_day`, then does a weighted random pick.

The events are applied in `useGameLoop.js` at the start of each new day — find where `rollDailyEvent` is called and where the event effects are processed.

## Design: mode-aware event tables

### Approach

Don't modify the existing `EVENT_TABLE`. Instead, create a second table for Outbreak Mode and select which table to use based on `state.mode`.

### Outbreak event table

Add to `src/data/events.js`:

```js
export const OUTBREAK_EVENT_TABLE = [
  // Shared events (kept from wilderness, still make sense)
  { id: 'calm', weight: 15, min_day: 1, name: 'Quiet Day', desc: 'The dead are silent... for now.' },
  { id: 'aurora', weight: 8, min_day: 1, name: 'Aurora Forecast', desc: '✨ Aurora tonight. Warmth drains less.' },
  { id: 'cold_snap', weight: 6, min_day: 4, name: 'Bitter Cold Snap', desc: '🥶 Warmth drains faster today.' },
  { id: 'thaw', weight: 5, min_day: 6, name: 'Brief Thaw', desc: '☀️ Warm front. Vitals recover faster.' },
  { id: 'blizzard_warning', weight: 4, min_day: 5, name: 'Storm Brewing', desc: '⛈️ Blizzard likely tonight. Zombies may be slowed.' },
  { id: 'crate_signal', weight: 5, min_day: 3, name: 'Distant Engine', desc: '✈️ Plane overhead. Supply crate dropped.' },
  
  // Outbreak-specific events
  { id: 'big_horde', weight: 10, min_day: 5, name: 'Big Horde Tonight', desc: '🧟‍♂️ Scouts report a massive wave gathering. Tonight\'s horde will be 50% larger.' },
  { id: 'fast_zombies', weight: 8, min_day: 7, name: 'Runners Spotted', desc: '🏃 Some of the dead are moving faster today. Zombie move speed +50% tonight.' },
  { id: 'weapon_cache', weight: 7, min_day: 3, name: 'Weapon Cache Found', desc: '🔫 You found a stash. +1 rifle OR +1 hunting bow (random).' },
  { id: 'ammo_cache', weight: 7, min_day: 2, name: 'Ammo Cache', desc: '🎯 Found ammunition. +5 scrap (ammo placeholder).' },
  { id: 'respite', weight: 6, min_day: 8, name: 'Quiet Night', desc: '🌙 The horde seems thin tonight. Wave size reduced by 50%.' },
  { id: 'screamer_spotted', weight: 5, min_day: 10, name: 'Screamer Spotted', desc: '😱 A screamer is in tonight\'s wave. It will call reinforcements. (Future: screamer zombie type. For now: +25% wave size.)' },
  { id: 'survivor_radio', weight: 4, min_day: 6, name: 'Survivor on the Radio', desc: '📻 A voice on the radio. "Hold on... we\'re coming." +50 XP for hope.' },
  { id: 'fortify', weight: 6, min_day: 4, name: 'Time to Fortify', desc: '🛡️ Clear skies, calm winds. Building costs reduced today.' },
];
```

### Events removed from Outbreak Mode

These wilderness events don't fit Outbreak's tone:
- `wolf_pack` — wolves exist but aren't the focus; replaced by horde events
- `deer_migration` — irrelevant when zombies are the concern
- `lost_traveler` — replaced by `survivor_radio`
- `cache_rumor` — replaced by `weapon_cache` and `ammo_cache`
- `frozen_carcass` — replaced by `ammo_cache`
- `bear_roaming` — bear exists but isn't a headline event in Outbreak

### Mode-aware roll function

Update `rollDailyEvent` to accept mode:

```js
export function rollDailyEvent(day, mode = 'wilderness') {
  const table = mode === 'outbreak' ? OUTBREAK_EVENT_TABLE : EVENT_TABLE;
  const valid = table.filter(e => day >= e.min_day);
  const total = valid.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of valid) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return valid[0];
}
```

Then find where `rollDailyEvent` is called in `useGameLoop.js` (currently: `const event = rollDailyEvent(s.day);`) and pass `state.mode`:
```js
const event = rollDailyEvent(s.day, s.mode || 'wilderness');
```

## Event effect implementation

Some of these events need actual gameplay effects beyond the log message. Find where existing events apply their effects (aurora reduces warmth drain, cold snap increases it, etc.) and add handlers for the new events.

### Events with gameplay effects

**`big_horde`** — Tonight's wave is 50% larger
- Store a modifier on state: `waveMultiplier: 1.5`
- In the wave spawner (the `getWaveSize()` call in the wave management section of `useGameLoop.js`), multiply the result by `state.waveMultiplier`
- Reset to 1.0 at dawn

**`fast_zombies`** — Zombie move speed +50% tonight
- Store `zombieSpeedMultiplier: 1.5` on state
- In zombie movement tick, divide the `zombieTicksPerMove()` result by this multiplier (faster = fewer ticks between moves)
- Reset to 1.0 at dawn

**`weapon_cache`** — Instant loot
- On event roll: `Math.random() > 0.5 ? s.inventory.rifle++ : s.inventory.hunting_bow++` (use `s.inventory = { ...s.inventory }` for immutability)
- Log which weapon was found

**`ammo_cache`** — Instant loot
- `s.inventory.scrap += 5`

**`respite`** — Wave size halved
- `waveMultiplier: 0.5`
- Reset at dawn

**`screamer_spotted`** — Wave size +25%
- `waveMultiplier: 1.25`
- Reset at dawn
- Future: when screamer zombie type exists, guarantee one spawns in the wave instead

**`survivor_radio`** — XP bonus
- **Use the existing XP system:** `s = applyXp(s, 50);` (import `applyXp` from `src/data/leveling.js`)
- Do NOT use `state.xp += 50` — that bypasses the level-up threshold check

**`fortify`** — Building cost reduction
- Store `buildingCostReduction: 2` on state
- In the building placement handler in `App.jsx` (wherever `state.inventory.wood >= b.wood` is checked for building placement), subtract `state.buildingCostReduction` from BOTH the `b.wood` cost AND the `b.stone` cost when validating AND deducting. Use `Math.max(1, cost - reduction)` as floor so costs never go below 1.
- Reset to 0 at the start of the next day (when a new event rolls)

**`blizzard_warning` in Outbreak** — Same weather effect as wilderness, plus zombie speed reduction
- When blizzard weather is active (`state.weather === 'blizzard'`), apply zombie speed reduction
- Implementation: in the zombie movement tick, check `state.weather === 'blizzard'` SEPARATELY from the event-based `zombieSpeedMultiplier`. If blizzard is active, multiply the ticks-per-move by 1.33 (i.e., 25% slower). This stacks with `fast_zombies` if both are active.
- This check goes in the zombie movement pass in `useGameLoop.js`, NOT in the event handler

### Events with no new gameplay effect (just flavor/existing effects)

- `calm` / `quiet day` — no effect
- `aurora` — same as wilderness (reduced warmth drain) — already handled by existing `eventEffects.aurora` code
- `cold_snap` — same as wilderness (increased warmth drain) — already handled
- `thaw` — same as wilderness (faster vital recovery) — already handled
- `crate_signal` — same as wilderness (supply crate drops) — already handled

## State additions

Add to game state (with save migration defaults in `saveLoad.js`):

```js
state.waveMultiplier = 1.0;        // modified by events, reset at dawn
state.zombieSpeedMultiplier = 1.0;  // modified by events, reset at dawn
state.buildingCostReduction = 0;    // modified by fortify event, reset next day
```

Migration defaults in `loadGame()`: all = their default values above.

## Where event effects reset

Wave-related modifiers (`waveMultiplier`, `zombieSpeedMultiplier`) reset at dawn. Find the dawn transition in the wave management section of `useGameLoop.js` (the `if (!nightPhase && wasNightPhase)` block) and add resets there:
```js
s.waveMultiplier = 1.0;
s.zombieSpeedMultiplier = 1.0;
```

`buildingCostReduction` resets at the start of the next day. Add `s.buildingCostReduction = 0;` at the top of the day-rollover block (where `s.day += 1` happens), before the new event is rolled.

## Acceptance criteria

- [ ] Outbreak Mode uses `OUTBREAK_EVENT_TABLE` for daily events
- [ ] Wilderness Mode uses original `EVENT_TABLE` unchanged
- [ ] `rollDailyEvent` accepts mode parameter
- [ ] `big_horde` event increases tonight's wave by 50%
- [ ] `fast_zombies` event increases zombie speed by 50% tonight
- [ ] `respite` event halves tonight's wave
- [ ] `weapon_cache` gives a random weapon immediately
- [ ] `ammo_cache` gives 5 scrap immediately
- [ ] `survivor_radio` awards 50 XP via `applyXp()` (NOT direct assignment)
- [ ] `fortify` reduces building wood AND stone cost by 2 (min 1) for the day
- [ ] Blizzard weather slows zombies by 25% independently of event modifiers
- [ ] All modifiers reset at appropriate times (dawn or next day)
- [ ] Day banner shows correct Outbreak event names
- [ ] Save/load preserves event modifiers

## Constraints

- Don't modify the original `EVENT_TABLE` — it stays untouched for Wilderness Mode
- Don't break existing event effects (aurora, cold snap, etc.)
- Event effects that reference zombie systems (wave size, speed) should gracefully no-op if those systems don't exist yet (in case someone runs this seed before 02/03 by mistake)
- Keep event weights balanced — no single event should dominate

Commit message: `feat: outbreak-specific daily events with horde modifiers`

## Plan before executing

1. Read `src/data/events.js` — current table and roll function
2. Read `useGameLoop.js` — find where events are rolled and effects applied
3. Read `src/data/leveling.js` — understand `applyXp` function signature
4. Find where building costs are validated in `App.jsx` (for the fortify discount)
5. Propose the event effect integration points
6. Wait for go-ahead
7. Implement: event table → roll function update → effect handlers → modifier resets → save migration
8. Test: start an Outbreak game, advance through several days, confirm events roll and effects apply
