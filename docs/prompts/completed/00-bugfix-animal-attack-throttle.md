# Critical Bug Fix: Animal Attack Speed Throttle

**STATUS: COMPLETED** — Fixed in commit 829095e.

---

## The bug

Hostile animals (wolves, boars, bears) were attacking the player on every game tick instead of respecting their `attackSpeed` cadence. Symptoms:

- A boar adjacent to the player at spawn dealt 27+ "A boar gores you!" log entries within seconds, killing the player on Day 1 morning
- A wolf engaging the player produced ~30 red damage numbers within 1 second
- Animals should be swinging every 1000-2000ms (wolf 1000ms, boar 1500ms, bear 1700ms), not every 100ms tick

This was unplayable when it triggered.

## What was fixed

The animal AI section of the game loop was not properly updating `animal.lastAttackMs` after a swing. The condition `(now - animal.lastAttackMs) >= attackSpeed` was always true because `lastAttackMs` was never being set.

Fix: Each animal now has a `lastAttackMs` field on its state object. After applying damage, `animal.lastAttackMs = now` is set. The same animal can never apply damage twice in a single tick.

Commit: `fix: animal attack speed throttle (was firing every tick instead of per attackSpeed)` — 829095e
