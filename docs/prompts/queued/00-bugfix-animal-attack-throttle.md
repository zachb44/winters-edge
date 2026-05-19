# Critical Bug Fix: Animal Attack Speed Throttle

Copy this entire block into Claude Code as a single prompt.

---

## The bug

Hostile animals (wolves, boars, bears) are attacking the player on every game tick instead of respecting their `attackSpeed` cadence. Symptoms:

- A boar adjacent to the player at spawn dealt 27+ "A boar gores you!" log entries within seconds, killing the player on Day 1 morning
- A wolf engaging the player produced ~30 red damage numbers within 1 second
- Animals should be swinging every 1000-2000ms (wolf 1000ms, boar 1500ms, bear 1700ms), not every 100ms tick

This is unplayable when it triggers. It needs to be fixed before any other gameplay work.

## What to investigate

The likely root causes (one or more of these):

1. **Animal-side `lastAttackMs` not being set after a swing.** Each animal entity needs its own timestamp that's updated each time it lands a hit. If we're only checking `(now - animal.lastAttackMs) >= attackSpeed` but never updating `animal.lastAttackMs` after a swing, the condition is always true.

2. **Engagement charging delay logic might be inverted.** If `engagementChargedAt` was added and is checked/set incorrectly, it could either always allow swings or never gate them properly.

3. **Aggro state desync.** Permanent boar aggro might be re-entering the "swing now" code path on every tick because the throttle is keyed to engagement state, not time elapsed.

4. **Damage application happening multiple times per tick.** Could be a state-mutation issue where the AI loop applies damage during iteration but the throttle check has already passed.

## Required fix

Look at the animal AI section of `useGameLoop.js` (or wherever the animal swing logic lives). The behavior must be:

- Each animal has a `lastAttackMs` field on its state object (default 0)
- When an animal swings at the player:
  - Read current time `now`
  - Check `(now - animal.lastAttackMs) >= attackSpeed` AND the animal is adjacent to the player (within 1 tile, or 3 for bow-range when we add it for animals later)
  - If both true: apply damage, set `animal.lastAttackMs = now`
  - If either false: skip — no damage, no log entry, no swing
- The same animal should NEVER apply damage twice in a single tick

## Edge cases to handle

- An animal that loses combat (player moves away beyond melee range) should keep its `lastAttackMs` value — so when re-engaged later, the throttle still works
- An animal that just spawned should have `lastAttackMs = 0` so its first swing happens immediately (or 600ms later if charging delay is in)
- Save/load must persist `lastAttackMs` per animal so reloaded combat resumes correctly

## Verification

After the fix:
- Stand adjacent to a wolf at night. You should see exactly one damage entry per second (wolf attackSpeed 1000ms).
- Stand adjacent to a boar. One damage entry per 1.5 seconds.
- Stand adjacent to a bear. One damage entry per 1.7 seconds.
- The log should NOT spam dozens of entries per second.
- A run can survive at least 10 seconds of being adjacent to a single wolf at 100 HP.

## Constraints

- Don't break the auto-attack combat for the player side — only fix the animal-side throttle
- Don't break the existing combat damage values, just the timing
- Don't ship any other feature changes in this commit — just the throttle fix

Commit message: `fix: animal attack speed throttle (was firing every tick instead of per attackSpeed)`

## Plan before executing

1. Read the animal AI section of useGameLoop.js
2. Identify the broken throttle (likely missing or wrongly placed `animal.lastAttackMs` update)
3. Describe what you found and the proposed fix
4. Wait for go-ahead
5. Implement the fix
6. Briefly summarize how the fix verifies against the symptoms described
