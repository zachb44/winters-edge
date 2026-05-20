# Outbreak Mode Vitals Rebalance

**Phase 1 — Outbreak Mode core. Run AFTER seed 01 (mode selection). Can run independently of seeds 02/03 — no zombie dependency. Just needs `state.mode` to exist.**

Copy this entire block into Claude Code as a single prompt.

---

Wire the mode-dependent hunger and warmth drain rates into the game loop so Outbreak Mode actually feels different from Wilderness Mode. Right now both modes play identically (seed 01 only stored the mode choice). This seed makes the vitals behave differently.

## What this changes

In Outbreak Mode:
- Hunger drain: 0.15/tick → 0.04/tick (~1/4 the rate)
- Warmth drain: 0.3/tick baseline → 0.08/tick baseline (~1/4 the rate)

Hunger and warmth still exist — they're background flavor, not the central threat. Players can still die from starvation or freezing if they completely ignore vitals, but it takes much longer. The zombies are the real enemy.

In Wilderness Mode: no changes. Current drain rates stay exactly as they are.

## Where the drain rates live

Search `useGameLoop.js` for where hunger and warmth are decremented each tick. The current code likely looks something like:

```js
// Hunger drain
state.hunger -= 0.15 * TIME_SCALE;

// Warmth drain (modified by weather, buildings, etc.)
let warmthDrain = 0.3;
if (weather === 'blizzard') warmthDrain *= 1.5;
if (nearCampfire) warmthDrain = -0.5; // warming up
// ... other modifiers
state.warmth -= warmthDrain * TIME_SCALE;
```

The exact code will differ — read the file carefully. The key is finding the **base drain constants** and replacing them with mode-aware values.

## Implementation

Seed 01 already created `src/data/modeConfig.js` with:

```js
export const MODE_CONFIG = {
  wilderness: {
    hungerDrain: 0.15,
    warmthDrain: 0.3,
    // ...
  },
  outbreak: {
    hungerDrain: 0.04,
    warmthDrain: 0.08,
    // ...
  },
};
```

**Step 1:** In `useGameLoop.js`, import `MODE_CONFIG` from `src/data/modeConfig.js`.

**Step 2:** Replace hardcoded hunger drain with:
```js
const hungerRate = MODE_CONFIG[state.mode || 'wilderness'].hungerDrain;
state.hunger -= hungerRate * TIME_SCALE;
```

**Step 3:** Replace hardcoded warmth base drain with:
```js
const warmthBaseRate = MODE_CONFIG[state.mode || 'wilderness'].warmthDrain;
// Apply existing modifiers (weather, campfire, etc.) on top of this base
```

**Important:** Don't break the existing warmth modifier stack. The base rate changes, but all the multipliers and overrides (blizzard bonus, campfire warming, aurora event, tent shelter, etc.) should still apply on top of the new base. Read the warmth calculation carefully and only change the base constant, not the modifier logic.

**Step 4:** Fallback safety — if `state.mode` is undefined (old save without migration), default to `'wilderness'` behavior. The `|| 'wilderness'` fallback handles this.

## What this does NOT change

- HP drain from cold (frostbite damage when warmth hits 0) — stays the same rate in both modes
- HP regen rates — unchanged
- Stamina drain/regen — unchanged
- Food healing amounts — unchanged
- Campfire warming rate — unchanged (you warm up at the same speed, you just cool down slower in Outbreak)
- Any weather effects — still apply their multipliers, just on a lower base

## Verification

**Outbreak Mode test:**
1. Start a new Outbreak Mode game
2. Stand still on snow with no campfire
3. Hunger should drop noticeably slower than Wilderness Mode (~4x slower)
4. Warmth should drop noticeably slower (~4x slower)
5. You should still eventually starve/freeze if you do literally nothing, but it takes much longer
6. Campfire should still warm you up (warming rate unchanged)
7. Eating food should still restore the same hunger amount

**Wilderness Mode test:**
1. Start a new Wilderness Mode game
2. Vitals should drain at exactly the same rate as before this change
3. No gameplay difference whatsoever

## Acceptance criteria

- [ ] Outbreak Mode hunger drains at 0.04/tick (was 0.15)
- [ ] Outbreak Mode warmth drains at 0.08/tick base (was 0.3)
- [ ] Wilderness Mode vitals completely unchanged
- [ ] All warmth modifiers (weather, campfire, aurora, tent) still work correctly in both modes
- [ ] Old saves without `state.mode` default to wilderness drain rates
- [ ] No other vitals affected (HP, stamina)

## Constraints

- This is a pure numbers change in one file. Should be a small, clean diff.
- Don't refactor the entire vitals system — just swap the constants for mode-aware lookups.
- Don't touch any UI — the vitals bars display the same way regardless of drain rate.

Commit message: `feat: outbreak mode vitals rebalance (hunger/warmth drain to 1/4 rate)`

## Plan before executing

1. Read `useGameLoop.js` — find the exact lines where hunger and warmth drain
2. Read `src/data/modeConfig.js` — confirm it exists from seed 01
3. Identify all warmth modifiers to make sure none get broken
4. Show the proposed changes (should be ~5-10 lines)
5. Wait for go-ahead
6. Implement and verify both modes still work
