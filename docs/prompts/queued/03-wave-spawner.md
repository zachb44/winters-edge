# Night Wave Spawner + Night Counter

**Phase 1 — Outbreak Mode core. Run AFTER seed 01 (mode selection) AND seed 02 (shambler zombie). Seeds 01 and 02 must both be complete before this runs.**

Copy this entire block into Claude Code as a single prompt.

---

Add the wave spawning system that makes Outbreak Mode work: zombies spawn at map edges when the sun goes down, scaling in number with each passing night. Also adds the night counter UI and the Outbreak Mode win condition.

## What this adds

1. Zombie wave spawning at sundown
2. Night counter tracking
3. Day banner changes for Outbreak Mode
4. Outbreak Mode win condition (survive 30 nights)
5. Zombie despawn at dawn

## Night detection

The game already tracks time of day via the game clock. Night is defined as:
- **Sundown:** 18:00 (6 PM) — zombies begin spawning
- **Dawn:** 06:00 (6 AM) — surviving zombies despawn (fade away)

Look at how the day/night cycle currently works in `useGameLoop.js` — there's likely a `timeOfDay` or `hour` calculation from the game clock. Find the existing day/night boundary logic (used for wolf aggro, vision radius changes, etc.) and hook into it.

## Wave spawning logic

Create the spawning system in `src/logic/zombies.js` (extending the file created in seed 02).

### Wave size formula

```js
function getWaveSize(nightNumber) {
  // Night 1: 3 zombies. Night 30: ~45 zombies.
  // Linear scaling with a small floor.
  const base = 3;
  const perNight = 1.4;
  return Math.floor(base + (nightNumber - 1) * perNight);
}
```

So:
- Night 1: 3
- Night 5: 8
- Night 10: 15
- Night 15: 22
- Night 20: 29
- Night 25: 36
- Night 30: 43

This can be tuned later. The important thing is it scales linearly and feels like escalating pressure.

### Spawn timing

Don't dump all zombies at once. Stagger spawns across the first ~2 in-game hours of night:

1. At sundown (18:00), calculate wave size for current night
2. Divide wave into 3-4 sub-waves, each spawning ~30 in-game minutes apart
3. Sub-wave 1 at 18:00, sub-wave 2 at 18:30, sub-wave 3 at 19:00, sub-wave 4 at 19:30
4. Each sub-wave spawns `Math.ceil(waveSize / 4)` zombies (last sub-wave gets the remainder)

Track this with state:
```js
state.wave = {
  nightNumber: 0,       // current night (increments at first sundown)
  totalToSpawn: 0,      // total zombies for this wave
  spawned: 0,           // how many have spawned so far
  subWaveIndex: 0,      // which sub-wave we're on (0-3)
  nextSubWaveTime: null, // game-time timestamp for next sub-wave
  active: false,        // is a wave currently in progress?
}
```

### Spawn positions

Zombies spawn at map edges — random walkable tiles along the border of the map:

```js
function getEdgeSpawnPositions(map, count) {
  const positions = [];
  const edges = [];
  
  // Collect all walkable edge tiles
  for (let x = 0; x < MAP_W; x++) {
    if (isWalkable(map[0][x])) edges.push({ x, y: 0 });
    if (isWalkable(map[MAP_H - 1][x])) edges.push({ x, y: MAP_H - 1 });
  }
  for (let y = 1; y < MAP_H - 1; y++) {
    if (isWalkable(map[y][0])) edges.push({ x: 0, y });
    if (isWalkable(map[y][MAP_W - 1])) edges.push({ x: MAP_W - 1, y });
  }
  
  // Pick random edge tiles
  for (let i = 0; i < count && edges.length > 0; i++) {
    const idx = Math.floor(Math.random() * edges.length);
    positions.push(edges[idx]);
    // Don't remove — multiple zombies can spawn on same tile
  }
  return positions;
}
```

Use `MAP_W` and `MAP_H` from `src/constants.js` (currently 60 and 45). Check walkability against the tile types in `src/data/tiles.js` — `TILE_DATA[tileType].walkable`.

### Spawn function

Use the `newZombieId()` function from seed 02's `src/logic/zombies.js`. Each spawned zombie:

```js
{
  id: newZombieId(),
  type: 'shambler',
  x: spawnPos.x,
  y: spawnPos.y,
  hp: ZOMBIE_TYPES.shambler.hp,
  maxHp: ZOMBIE_TYPES.shambler.hp,
  lastAttackMs: 0,
  targetX: null,
  targetY: null,
  spawnNight: state.wave.nightNumber,
}
```

## Dawn behavior

At dawn (06:00):
1. All remaining zombies despawn (remove from `state.zombies`)
2. Log message: "☀️ Dawn breaks. The dead retreat... for now."
3. Set `state.wave.active = false`
4. **Clear combat target if it references a despawning zombie.** If `state.combatTargetType === 'zombie'`, set `state.combatTarget = null` and `state.combatTargetType = null`. This prevents the auto-attack loop from trying to look up a deleted zombie entity. Find how animal death already clears combat state (when a targeted animal dies) and replicate that same cleanup pattern for zombie despawn.
5. Do NOT award XP or loot for despawned zombies — only kills count

This keeps nights as the tension phase and days as the safe/build phase. Players can't just kite zombies until morning for free XP.

## Night counter + day banner

### Night counter

`state.wave.nightNumber` increments by 1 at the first sundown of each day. So:
- Day 1 evening → Night 1
- Day 2 evening → Night 2
- etc.

The night counter is the primary progress metric in Outbreak Mode.

### Day banner changes

The `DayBanner.jsx` component currently shows "Day N — [Event Name]" at the start of each day.

In Outbreak Mode:
- **At dawn:** "DAY {day} — Prepare your defenses" (or the daily event name)
- **At sundown:** "NIGHT {nightNumber} — They're coming..." (replaces the normal day banner temporarily)

The sundown banner should:
- Show in a more alarming style (red text instead of the normal color)
- Include the wave size: "NIGHT 5 — 8 shamblers approaching"
- Auto-dismiss after 3 seconds (same as normal day banner)

In Wilderness Mode, the day banner behavior is completely unchanged.

### Top bar night indicator

In the top bar (where day count currently shows), add the night number for Outbreak Mode:
- During day: "Day 5 / 30"
- During night: "Night 5 / 30" (text color shifts to a red/orange)

Look at where the day counter renders in `GameUI.jsx` or the top bar section of `App.jsx`. Add a mode check.

## Win condition

In Outbreak Mode with the "rescue" scenario (renamed "Hold the Line" in seed 01):
- Win condition: survive until dawn of Night 30 (i.e., when the Night 30 wave despawns at dawn)
- When Night 30's dawn arrives and zombies despawn, trigger the win screen
- The existing win/victory screen should work — just change the message to "You held the line for 30 nights. Extraction is here."

Find the existing win condition check (likely in `useGameLoop.js` — checks `state.day >= 30` for rescue scenario). Add a parallel check for Outbreak Mode:
- `state.mode === 'outbreak' && state.wave.nightNumber >= 30 && isDawn`

The "tower" scenario win condition stays the same in both modes (reach the tower with supplies).

## Game loop integration

In `useGameLoop.js`, add a new section (after animal AI, after zombie AI from seed 02) that handles wave management:

```
// Wave spawner tick (Outbreak Mode only)
if (state.mode === 'outbreak') {
  // 1. Detect sundown transition → start new wave
  // 2. Check if it's time for next sub-wave → spawn zombies
  // 3. Detect dawn transition → despawn all zombies + clear combat target
  // 4. Check win condition
}
```

The sundown/dawn detection needs to fire exactly once per transition. Use a flag like `state.isNightPhase` (boolean) that flips at 18:00 and 06:00. Check `previous tick's isNightPhase vs current` to detect transitions.

## Save/load

Persist `state.wave` and `state.isNightPhase` in save state. Migration for older saves:
```js
wave: { nightNumber: 0, totalToSpawn: 0, spawned: 0, subWaveIndex: 0, nextSubWaveTime: null, active: false }
isNightPhase: false
```

## Files to create/modify

**Modify:**
- `src/logic/zombies.js` — add `getWaveSize()`, `getEdgeSpawnPositions()`, `spawnSubWave()`, `despawnAllZombies()`
- `src/hooks/useGameLoop.js` — add wave spawner tick section
- `src/components/DayBanner.jsx` — add sundown banner for Outbreak Mode
- `src/components/GameUI.jsx` or top bar in `App.jsx` — night counter display
- `src/logic/saveLoad.js` — persist wave state

## Acceptance criteria

- [ ] Outbreak Mode: zombies spawn at map edges at 18:00
- [ ] Wave size scales with night number (Night 1 = 3, Night 30 = ~43)
- [ ] Spawns staggered into 3-4 sub-waves across first 2 hours of night
- [ ] All zombies despawn at dawn (06:00) with log message
- [ ] **Combat target cleared when zombies despawn (no dangling reference)**
- [ ] Night counter increments correctly
- [ ] Day banner shows "NIGHT N" at sundown with wave info
- [ ] Top bar shows night count during night phase
- [ ] Win condition triggers at dawn after Night 30
- [ ] Wilderness Mode: no wave spawning, no night banner changes, no zombies
- [ ] Save/load preserves wave state and mid-night zombie positions

## Constraints

- Don't break Wilderness Mode — it should be completely unaffected
- Don't break existing day/night mechanics (wolf aggro, vision, weather)
- Wave spawning must be gated behind `state.mode === 'outbreak'` checks
- Zombie AI (from seed 02) handles the actual movement/combat — this seed only handles spawning/despawning

Commit message: `feat: night wave spawner with escalating zombie counts and win condition`

## Plan before executing

1. Read `useGameLoop.js` — find the day/night transition detection and the existing win condition check
2. Read `DayBanner.jsx` — understand how banners trigger and dismiss
3. Read the top bar rendering to find where day count displays
4. **Read how animal death clears `combatTarget` — replicate that pattern for zombie despawn**
5. Propose integration points for the wave tick
6. Wait for go-ahead
7. Implement: wave logic functions → game loop integration → dawn/sundown detection → banner updates → win condition → combat cleanup → save/load
8. Test Night 1 manually (temporarily set wave size to 2-3 for quick testing)
