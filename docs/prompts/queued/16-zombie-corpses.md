# Zombie Corpse Looting

Copy this entire block into Claude Code as a single prompt.

---

Convert zombie kills from auto-loot to the corpse system that animal kills already use. This was deferred in seed 13 with a TODO comment.

## Context

Seed 13a added a corpse system for animal kills: animals drop a 💀 corpse entity on death that the player clicks to loot (within adjacency range). Corpses decay after 4 in-game hours. The system uses `state.corpses` array with entries like `{ id, x, y, type, loot, spawnDay, spawnTime }`.

Zombie kills currently auto-loot — drops go straight to inventory on the kill hit. There's a TODO in `src/logic/zombies.js` (`applyZombieAttack`) marking this for conversion.

## What to change

### 1. `src/logic/zombies.js` — `applyZombieAttack`

Find the lethal hit branch (where `newHp <= 0`). Currently it:
- Rolls loot from `ZOMBIE_TYPES[z.type].loot`
- Adds drops directly to `state.inventory`
- Logs the kill with drop icons

Change to:
- Roll loot the same way (same drop chances, same quantities)
- Instead of adding to inventory, create a corpse: `{ id: newCorpseId(), x: z.x, y: z.y, type: 'zombie_' + z.type, loot: rolledDrops, spawnDay: state.day, spawnTime: state.time }`
- Push the corpse to `state.corpses`
- The kill log message stays but remove the drop icons from it (drops are now on the corpse, not in inventory yet). Change to: "🧟 Shambler destroyed! (+15 XP) — loot the remains"
- Remove the TODO comment

### 2. Corpse ID generation

Check how animal corpse IDs are generated (likely a counter in `combat.js` or wherever `applyAttack` creates corpses). Use the same ID generator for zombie corpses. Import it into `zombies.js`.

### 3. Corpse rendering

Zombie corpses should already render via the existing corpse rendering in `MapView.jsx` since they use the same `state.corpses` array. Verify that:
- The 💀 emoji renders for zombie corpses (check if the render code filters by type)
- Tooltips work (should show "Zombie Shambler remains — click to loot")
- The count badge works when multiple corpses stack on the same tile

If the render code uses `type` to determine the emoji or tooltip text, add handling for `zombie_shambler` (and future zombie types).

### 4. Corpse click/loot

The existing corpse click handler in `App.jsx` should already work — it transfers `corpse.loot` to inventory and removes the corpse. Verify it doesn't filter by animal-only types.

### 5. Corpse decay

Zombie corpses use the same 4-hour decay as animal corpses. No change needed if the decay logic in `useGameLoop.js` processes all entries in `state.corpses` regardless of type.

### 6. Loot table for zombie corpses

Keep the existing shambler loot table as-is:
- cloth: 40% chance, qty 1
- scrap: 25% chance, qty 1

This is intentionally low-value. Zombies are abundant — if every zombie dropped good loot, the economy breaks. The value is in XP, not drops.

### 7. Night combat flow consideration

During Outbreak night waves, the player may kill 20-50 zombies. That's potentially 20-50 corpses on the ground. This is fine — corpses are small state objects and they decay after 4 hours. But consider:
- Many corpses will stack on tiles near the player's defensive position. The count badge handles this.
- The player will likely loot between waves or in the morning. Corpses from early night should still be there at dawn (4 hours covers a full night).
- If performance becomes an issue with 50+ corpse entities, that's a future optimization — don't pre-optimize.

## What NOT to change

- Animal corpse system — leave it exactly as shipped
- Zombie loot tables — same drops, same chances
- XP awards — still immediate on kill (XP is not loot)
- Kill log messages — still fire immediately (just without the drop icons)
- Corpse decay timer — same 4 hours

## Save migration

No migration needed — `state.corpses` already exists from seed 13a. Zombie corpses are just new entries in the same array.

## Constraints

- Don't break animal corpse system
- Don't break existing zombie combat
- Corpse click adjacency check (d ≤ 1) must work the same as animal corpses
- Zombie XP is still awarded immediately on kill, NOT on corpse loot

## Plan before executing

1. Read `src/logic/zombies.js` — find the TODO and the lethal hit branch in `applyZombieAttack`
2. Read `src/logic/combat.js` — find how animal corpses are created and the corpse ID generator
3. Read `src/components/MapView.jsx` — confirm corpse rendering handles arbitrary types
4. Read `src/App.jsx` — confirm corpse click handler is type-agnostic
5. Read `src/hooks/useGameLoop.js` — confirm corpse decay is type-agnostic
6. Propose plan, wait for go-ahead
7. Implement: modify `applyZombieAttack` → verify render/click/decay paths → remove TODO
8. Summarize and call out what to playtest

Commit message: `feat: zombie kills drop lootable corpses instead of auto-looting`
