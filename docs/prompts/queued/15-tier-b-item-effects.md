# Tier B Item Effects

Copy this entire block into Claude Code as a single prompt.

---

Give gameplay effects to the four Tier B items that currently sit inert in inventory after crafting at the workbench. Each item gets a distinct mechanical hook.

## Context

Seed 09 added 8 workbench recipes. The 4 Tier A items (hatchet, hunting_bow, dried_meat, fur_coat) already have effects. The 4 Tier B items (sharp_knife, torch, arrows, lantern) craft successfully and appear in inventory but do nothing. This seed gives each one a real gameplay effect.

## Item effects

### Sharp Knife 🔪

**Effect:** +3 bonus damage on all melee attacks (stacks with hatchet). Does NOT affect ranged attacks (bow/rifle).

**Implementation:**
- In `src/logic/combat.js` (`computePlayerDamage`): after the existing weapon damage adds, check `state.inventory.sharp_knife > 0`. If yes, add +3 to `dmg`.
- In `src/logic/zombies.js` (`computeZombieDamage`): same check, same +3.
- Only applies when the attack is melee — if the player has a rifle or bow equipped (checked by `state.inventory.rifle > 0 || state.inventory.hunting_bow > 0`), the knife bonus does NOT apply. The knife is a sidearm for close combat.
- The sharp_knife is consumed on use? **No.** It's a permanent passive buff while in inventory. It doesn't degrade.

### Torch 🔥

**Effect:** Wolves will not engage the player while a torch is held. Extends visible light radius by +2 tiles at night.

**Implementation — wolf deterrent:**
- In `src/hooks/useGameLoop.js`, in the animal AI aggro section: when a wolf would normally enter its aggro/charge state toward the player, check `state.inventory.torch > 0`. If yes, the wolf treats the player as neutral (skips aggro). Wolves already adjacent do NOT disengage — the torch prevents new aggro, not ongoing combat.
- Log on first wolf deterrence per game session: "🔥 The torch keeps the wolves at bay."

**Implementation — light radius:**
- In `src/logic/visibility.js` (`visibilityAt`): the current check uses `VISION_RADIUS`. Add a parameter or check: if `state.inventory.torch > 0` AND it's nighttime (time < 6 || time >= 18), use `VISION_RADIUS + 2` instead.
- This means the torch extends vision at night but has no effect during the day (you already have full daylight vision).
- The torch is NOT consumed. It's a permanent item. (Future seed could add fuel/durability.)

### Arrows ➳

**Effect:** Ammo for the hunting bow. Each bow attack consumes 1 arrow. No arrows = bow does not fire (falls back to melee).

**Implementation:**
- Crafting the "arrows" recipe at the workbench produces `arrows: 5` (check seed 09's recipe — adjust if the recipe already specifies a quantity).
- In `src/logic/combat.js` (`computePlayerDamage`): the existing bow damage check (`state.inventory.hunting_bow > 0`) must now ALSO check `state.inventory.arrows > 0`. If bow is present but arrows are 0, the bow damage bonus does not apply (player swings melee instead).
- In `src/logic/zombies.js` (`computeZombieDamage`): same dual check.
- **Arrow consumption:** In `combat.js` (`applyAttack`) and `zombies.js` (`applyZombieAttack`): after computing damage, if the attack used bow damage (bow present AND arrows > 0), decrement `state.inventory.arrows` by 1.
- **Projectile check:** The projectile animation system (seed 13a) fires for ranged weapons. It should now also gate on arrows > 0 for the bow. If no arrows, no projectile spawns (melee swing instead).
- **HUD indicator:** The existing resource ribbon or hotbar should show arrow count when arrows > 0. Check where the consumable belt renders in `BottomHud` — arrows could appear as a belt item or as a resource count.
- **Rifle ammo is NOT added in this seed.** Rifle remains unlimited for now. A future seed can add bullets.
- Log when arrows run out mid-combat: "➳ Out of arrows — switching to melee."

### Lantern 🏮

**Effect:** Permanent +3 vision radius (day and night). Stacks with torch's +2 night bonus.

**Implementation:**
- In `src/logic/visibility.js` (`visibilityAt`): check `state.inventory.lantern > 0`. If yes, use `VISION_RADIUS + 3`.
- This stacks with the torch night bonus: at night with both items, effective radius = `VISION_RADIUS + 3 + 2 = VISION_RADIUS + 5`.
- The lantern already exists as a loot drop from cabins and crates. This seed just adds the mechanical effect — the item already enters inventory.

## Visibility function refactor

The `visibilityAt` function in `src/logic/visibility.js` currently takes `(fog, px, py, x, y)` and uses the imported `VISION_RADIUS` constant. To support torch and lantern bonuses, it needs access to inventory and time-of-day.

Options (pick the cleanest):
- **Option A:** Add `state` as a parameter and compute effective radius inside the function.
- **Option B:** Add an `effectiveRadius` parameter that the caller pre-computes.
- **Option C:** Export a helper `getEffectiveVisionRadius(state)` and have the caller pass the result.

Option C is probably cleanest — one helper that all callers use, and `visibilityAt` just takes the radius as a number. Check how many places call `visibilityAt` before deciding.

## Save migration

No new state fields needed — all items already exist in the inventory system. Arrow consumption is just decrementing an existing inventory count.

However: if `state.inventory.arrows` is undefined on old saves, the checks should treat it as 0 (which they will via `state.inventory.arrows > 0` being falsy for undefined). Confirm this is safe.

## Constraints

- Don't break existing combat — weapons that currently work must still work identically when these items aren't present
- Arrow consumption must work in BOTH animal combat (`combat.js`) and zombie combat (`zombies.js`)
- Torch wolf deterrent only prevents NEW aggro, not ongoing combat
- Vision radius changes must work with the existing fog-of-war permanent reveal system (fog tiles that have been explored stay explored)
- Don't add item durability/fuel in this seed — all items are permanent

## Plan before executing

1. Read `src/logic/combat.js` — understand `computePlayerDamage` and `applyAttack`
2. Read `src/logic/zombies.js` — understand `computeZombieDamage` and `applyZombieAttack`
3. Read `src/logic/visibility.js` — understand `visibilityAt` and its callers
4. Read `src/hooks/useGameLoop.js` — find wolf aggro logic
5. Read `src/components/MapView.jsx` — find where `visibilityAt` is called
6. Read `src/data/recipes.js` — confirm arrow recipe quantity
7. Propose plan, wait for go-ahead
8. Implement: visibility refactor → knife damage → torch (wolf deterrent + vision) → arrows (consumption + gating) → lantern (vision) → logs
9. Summarize and call out what to playtest

Commit message: `feat: tier B item effects (knife dmg, torch deterrent, arrows ammo, lantern vision)`
