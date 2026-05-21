# Zombie Corpse Looting

**Phase 4 — Closing gaps. Run AFTER seed 13 (interaction overhaul, which introduced the corpse system for animals). This seed extends corpses to zombie kills.**

Copy this entire block into Claude Code as a single prompt.

---

Animal kills already drop clickable 💀 corpses with loot (shipped in seed 13). Zombie kills currently auto-loot via the inline `loot` array in `ZOMBIE_TYPES`. This seed converts zombie kills to the same corpse system so loot must be clicked to collect.

## Current state

In `src/data/zombies.js`, the shambler has a `loot` array:
```js
loot: [
  { item: 'cloth', chance: 0.4, qty: 1 },
  { item: 'scrap', chance: 0.25, qty: 1 },
],
```

In `useGameLoop.js` (or `src/logic/zombies.js`), when a zombie dies, find the code that processes zombie death. There should be a TODO comment from seed 13: something like `// TODO: zombie corpses — currently auto-loot`. The current code iterates the loot array, rolls each chance, and adds directly to inventory.

The animal corpse system (from seed 13) uses `state.corpses`:
```js
state.corpses = [{ id, x, y, type, loot, spawnDay, spawnTime }]
```
- Corpses render as 💀 in MapView
- Click within d ≤ 1 transfers loot to inventory and removes the corpse
- Corpses decay after 4 in-game hours
- Tooltip shows loot contents

## Changes

### 1. Zombie death → corpse drop

Find where zombie death is processed (the zombie's HP hits 0). Instead of auto-adding loot to inventory:

1. Roll the zombie's loot table (same chance-based roll as now).
2. Build a loot array: `[{ item, qty }, ...]` for each successful roll.
3. If the loot array is non-empty, push a corpse:
   ```js
   s.corpses.push({
     id: s.nextCorpseId++,
     x: zombie.x,
     y: zombie.y,
     type: 'zombie',
     loot: rolledLoot,
     spawnDay: s.day,
     spawnTime: s.time,
   });
   ```
4. If the loot array is empty (both rolls failed), still drop a corpse but with empty loot. The corpse is still clickable — it just yields nothing (flavor: "Nothing useful on this one."). This keeps the battlefield visually consistent.

### 2. Expanded zombie loot table

The current loot is sparse (cloth 40%, scrap 25%). Expand it to make zombie corpses worth looting, especially in later nights:

Update the shambler's loot in `src/data/zombies.js`:
```js
loot: [
  { item: 'cloth', chance: 0.45, qty: 1 },
  { item: 'scrap', chance: 0.30, qty: 1 },
  { item: 'food', chance: 0.10, qty: 1 },
  { item: 'arrows', chance: 0.05, qty: 2 },
],
```

This gives roughly 90% of corpses at least one item. Arrows at 5% are rare enough to feel like a find but keep the bow supplied over a 30-night run.

### 3. Corpse rendering for zombie type

In `MapView.jsx`, corpses already render as 💀. For zombie corpses, use 🦴 instead to distinguish from animal corpses at a glance.

In the corpse rendering code, check `corpse.type`:
- `type === 'zombie'` → render 🦴
- anything else (animal types) → render 💀 (existing behavior)

### 4. Tooltip for zombie corpses

The existing corpse tooltip shows loot contents. For zombie corpses:
- If loot is non-empty: `"Zombie remains — Cloth ×1, Scrap ×1"` (same format as animal corpses)
- If loot is empty: `"Zombie remains — nothing useful"`

### 5. Click handler

The existing corpse click handler in `App.jsx` should already work for zombie corpses since they use the same `state.corpses` array. Verify that:
- Click within d ≤ 1 transfers loot
- Empty-loot corpses are removed on click with a log: `🦴 Searched zombie remains — nothing useful.`
- Non-empty corpses log: `🦴 Looted zombie remains — Cloth ×1, Scrap ×1`

### 6. Corpse stacking on high-kill nights

On late-game nights (night 25+), ~50 zombies die. That's potentially 50 corpses on the map. To prevent visual clutter and performance drag:

- **Decay time for zombie corpses: 2 in-game hours** (vs 4 hours for animal corpses). Zombie corpses decompose faster.
- In the decay check in `useGameLoop.js`, check `corpse.type === 'zombie'` and use a 2-hour threshold instead of 4.
- **Corpse cap:** if `state.corpses.length > 30`, remove the oldest corpses (lowest spawnDay/spawnTime) until the count is 30. This prevents pathological buildup during long sessions. Add this check in the same decay pass.

### 7. XP stays on kill, not on loot

Zombie kill XP (`xpReward: 15` in ZOMBIE_TYPES) should still be awarded at kill time, NOT when the corpse is looted. The XP call should already be in the zombie death code. Verify it stays there and doesn't move to the corpse click handler.

## Save migration

In `src/logic/saveLoad.js`:
- `state.nextCorpseId ??= (state.corpses?.length || 0) + 1` — if this field doesn't exist yet, it should already be there from seed 13's animal corpse work. Verify.
- No new state fields needed — zombie corpses use the existing `state.corpses` array.

## Acceptance criteria

- [ ] Zombie kills drop 🦴 corpses instead of auto-looting
- [ ] Corpse loot matches the rolled loot table (cloth, scrap, food, arrows)
- [ ] Empty-loot corpses are still clickable with appropriate log
- [ ] Click within d ≤ 1 to loot (same as animal corpses)
- [ ] Zombie corpses render as 🦴, animal corpses stay as 💀
- [ ] Tooltip shows loot contents or "nothing useful"
- [ ] Zombie corpses decay after 2 in-game hours (not 4)
- [ ] Corpse cap of 30 prevents buildup on high-kill nights
- [ ] XP still awarded at kill time, not loot time
- [ ] Kill log messages still fire on zombie death (flavor text preserved)
- [ ] `vite build` passes

## Constraints

- Do NOT change animal corpse behavior — they stay as-is from seed 13
- Do NOT move XP awards from kill to loot
- The corpse click handler should be generic — check if it already handles any `corpse.type` or if it assumes animal. If it assumes animal, generalize it.
- Zombie loot table changes are data-only in `src/data/zombies.js` — don't hardcode loot rolls elsewhere
- Future zombie types (brute, runner, screamer) will have their own loot arrays. The corpse system should read from `ZOMBIE_TYPES[z.type].loot`, not hardcode shambler's table.

## Plan before executing

1. Read `src/data/zombies.js` — confirm loot array structure
2. Read `useGameLoop.js` — find zombie death handling and the TODO comment from seed 13
3. Read `src/App.jsx` — find corpse click handler, check if it's animal-specific
4. Read `src/components/MapView.jsx` — find corpse rendering, check emoji and tooltip
5. Read `src/logic/saveLoad.js` — verify nextCorpseId exists from seed 13
6. Propose the specific code changes with line references
7. Wait for go-ahead
8. Implement: zombie death → corpse push, loot table update, render differentiation, decay timing, corpse cap, click handler generalization
