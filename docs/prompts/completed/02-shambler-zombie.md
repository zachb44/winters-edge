# Basic Zombie Enemy (Shambler)

**Phase 1 — Outbreak Mode core. Run AFTER seed 01 (mode selection). Can run alongside seed 03 (wave spawner) in the same session if desired, but 01 must be done first.**

Copy this entire block into Claude Code as a single prompt.

---

Add the first zombie type to Winter's Edge: the shambler. A slow, predictable, moderate-HP undead enemy that spawns in Outbreak Mode. Uses the existing auto-attack combat system.

## What this adds

A new enemy entity type (`zombie_shambler`) that:
- Looks and behaves distinctly from animals
- Uses the same combat engine (auto-attack, attack speed timer, damage numbers)
- Only exists in Outbreak Mode (`state.mode === 'outbreak'`)
- Spawns at map edges at sundown (spawning logic is in seed 03 — this seed creates the entity and its AI)

## Zombie data

Create `src/data/zombies.js`:

```js
export const ZOMBIE_TYPES = {
  shambler: {
    name: 'Shambler',
    emoji: '🧟',
    hp: 30,
    damage: 6,
    attackSpeed: 1800,   // ms between swings — slower than wolves
    moveSpeed: 2.5,      // tiles per in-game minute — slower than animals
    xpReward: 15,
    aggroRange: 6,       // tiles — how far they detect the player
    loot: [
      { item: 'cloth', chance: 0.4, qty: 1 },
      { item: 'scrap', chance: 0.25, qty: 1 },
    ],
    desc: 'Slow but relentless. They never stop coming.',
  },
};
```

## Zombie entity structure

Zombies live in a new `state.zombies` array (separate from `state.animals`). Each zombie object:

```js
{
  id: number,           // unique ID (use a separate counter from animals)
  type: 'shambler',     // key into ZOMBIE_TYPES
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  lastAttackMs: 0,      // attack throttle (same pattern as animal fix in 829095e)
  targetX: number|null, // pathfinding target
  targetY: number|null,
  spawnNight: number,   // which night this zombie spawned on
}
```

### ID system

Create a separate ID counter for zombies in `src/logic/zombies.js`:
```js
let _nextZombieId = 1;
export function newZombieId() { return _nextZombieId++; }
export function resetZombieIds() { _nextZombieId = 1; }
```

This keeps zombie IDs from colliding with animal IDs in the combat system.

## Zombie AI — movement

Zombie AI runs in the game loop tick (same place animal AI runs in `useGameLoop.js`). Only processes if `state.mode === 'outbreak'`.

**Movement behavior:**
1. Zombies always path toward the player. No wandering, no fleeing, no territorial behavior. They are single-minded.
2. Movement is tile-based, same as animal movement.
3. Movement speed: zombies move every N ticks based on `moveSpeed`. At 2.5 tiles/in-game-minute with the current TIME_SCALE of 0.025, calculate the real-time interval between moves. Use a `lastMoveTick` timestamp per zombie, similar to how animal movement is throttled.
4. Zombies respect collision — they can't walk through trees, rocks, buildings, or other zombies. If blocked, they pick an adjacent tile that's closer to the player. If completely surrounded, they wait.
5. Zombies DO walk through animals (they ignore wildlife).
6. Multiple zombies can occupy the same tile (they stack — this keeps hordes from gridlocking).

**Key difference from animals:** Animals have varied behaviors (flee, wander, territorial, aggro-range). Zombies have ONE behavior: move toward player, attack when adjacent.

## Zombie AI — combat

When a zombie is adjacent to the player (within 1 tile):
1. Check attack throttle: `(now - zombie.lastAttackMs) >= zombie.attackSpeed`
2. If ready: deal `ZOMBIE_TYPES[zombie.type].damage` to the player
3. Update `zombie.lastAttackMs = now`
4. Log message: "🧟 A shambler claws at you! (-6 HP)"
5. Show floating damage number (red, same as animal attacks)
6. Apply hit flash on player

**This uses the exact same patterns as the animal attack system.** Reference the fix from commit 829095e — the throttle pattern is correct there.

## Player attacks zombies

The player can click a zombie to target it, same as clicking an animal:
1. Player auto-attacks on their weapon's attack speed timer
2. Damage applies normally (base + weapon + Power stat)
3. Floating damage numbers appear over the zombie
4. When zombie HP reaches 0:
   - Remove from `state.zombies`
   - Roll loot from `ZOMBIE_TYPES[zombie.type].loot`
   - Add loot directly to player inventory (corpse system comes in seed 13)
   - Award XP: `ZOMBIE_TYPES[zombie.type].xpReward`
   - Log message: "🧟 Shambler destroyed! +15 XP"

### ⚠️ Combat target tracking — HIGH-RISK REFACTOR

The existing `state.combatTarget` system tracks the player's current attack target. **Before modifying it, read how `combatTarget` is currently stored and used.** It may be a plain number (animal ID), an object, or something else.

**Read these files first and confirm the current shape:**
- `App.jsx` — wherever click-to-attack sets `combatTarget`
- `useGameLoop.js` — the auto-attack loop that reads `combatTarget`
- `CombatOverlay.jsx` — HP bar display that reads `combatTarget`

**Recommended approach (least-invasive):** Rather than changing `combatTarget` from a number to an object `{ id, type }` (which would break every existing reference), add a SEPARATE field:

```js
state.combatTarget      // keep as-is (animal ID or zombie ID — just a number)
state.combatTargetType  // NEW: 'animal' | 'zombie' | null
```

This way existing animal combat code continues to work unchanged — it reads `combatTarget` as a number and looks up the animal. Zombie combat sets `combatTargetType = 'zombie'` so the lookup goes to `state.zombies` instead of `state.animals`. The auto-attack loop checks `combatTargetType` to decide which array to search.

**If `combatTarget` is already an object**, adapt accordingly — but verify first. Don't assume the shape.

## Rendering

In `MapView.jsx`, render zombies on the map the same way animals are rendered:
- Show the zombie emoji (🧟) at its tile position
- Only render if the tile is within the player's vision/fog-of-war reveal
- Zombies should render ON TOP of the terrain layer but below the player
- When multiple zombies occupy the same tile, show a count badge: "🧟 x3"

## State initialization

- `state.zombies = []` — initialized empty at game start for both modes
- In Wilderness Mode, the zombies array stays empty forever (no spawning logic runs)
- Zombie spawning happens in seed 03 (wave spawner) — this seed only creates the entity system and AI

## Save/load

In `src/logic/saveLoad.js`:
- Add `zombies: []` to save state
- Add `combatTargetType: null` to save state
- Migration: backfill `zombies: []` and `combatTargetType: null` for older saves
- Persist all zombie fields including `lastAttackMs`
- On load, call `resetZombieIds()` and set counter to `max(existing IDs) + 1`

## Files to create/modify

**Create:**
- `src/data/zombies.js` — zombie type definitions
- `src/logic/zombies.js` — zombie AI (movement + combat), ID counter, spawn helper

**Modify:**
- `src/hooks/useGameLoop.js` — add zombie AI tick (after animal AI section)
- `src/components/MapView.jsx` — render zombies
- `src/components/CombatOverlay.jsx` — show HP bar over targeted zombie (check `combatTargetType`)
- `src/logic/saveLoad.js` — persist zombies + combatTargetType
- `App.jsx` — extend click-to-attack to support zombie targets (set `combatTargetType`)
- Combat target state — add `combatTargetType` field (NOT restructure `combatTarget`)

## Acceptance criteria

- [ ] `ZOMBIE_TYPES.shambler` exists with correct stats
- [ ] `state.zombies` array exists in game state
- [ ] Zombie AI moves toward player every tick (respecting moveSpeed throttle)
- [ ] Zombie attacks player when adjacent (respecting attackSpeed throttle — NO repeat of the every-tick bug)
- [ ] Player can click zombie to auto-attack it
- [ ] Zombie death: removed from state, loot awarded, XP granted
- [ ] Zombies render on map with correct emoji
- [ ] Combat overlay (HP bar) works on zombies
- [ ] Save/load preserves zombie state
- [ ] Wilderness Mode: zombies array stays empty, no zombie code runs
- [ ] Existing animal combat is completely unchanged

## Constraints

- Don't break animal combat or any existing systems
- Zombie combat uses the SAME damage/attack-speed patterns as animals — don't reinvent the wheel
- No zombie spawning logic in this seed (that's seed 03)
- For testing: you can temporarily add 2-3 test zombies to `state.zombies` at game start in Outbreak Mode, then remove that test code before committing. Or just note in the commit that spawning comes in seed 03.

Commit message: `feat: shambler zombie entity with AI movement and combat`

## Plan before executing

1. Read `useGameLoop.js` — understand the animal AI tick and combat loop
2. Read `MapView.jsx` — understand how animals render
3. **Read combat target tracking in `App.jsx` and `CombatOverlay.jsx` — confirm the current shape of `combatTarget` before modifying anything**
4. Propose the zombie AI integration points, including whether `combatTarget` is a number or object
5. Wait for go-ahead
6. Implement: data → logic → game loop integration → rendering → combat targeting → save/load
7. Note what to playtest
