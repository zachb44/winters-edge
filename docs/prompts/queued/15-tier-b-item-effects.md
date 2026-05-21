# Tier B Item Effects

**Phase 4 — Closing gaps. Run AFTER seed 09 (workbench crafting). The four Tier B items currently sit in inventory with no gameplay effect. This seed gives each one a real hook.**

Copy this entire block into Claude Code as a single prompt.

---

Four items are craftable at the workbench but do nothing when held: sharp knife, torch, lantern, and arrows. This seed adds a gameplay effect to each.

## Current state

In `src/data/recipes.js`, Tier B items are flagged with a comment: "currently sit in inventory with no game-loop effect." They craft and appear in inventory but have zero hooks in combat, movement, or the game loop.

In `src/data/loot.js`, all four have `ITEM_INFO` entries (sharp_knife, torch, lantern, arrows). Lantern already drops from cabin loot tables.

In `src/data/combat.js`, `computePlayerAttackSpeed` checks for rifle, hunting_bow, and hatchet. `computePlayerRange` checks for bow/rifle.

The game loop in `useGameLoop.js` processes warmth drain, vision, animal AI, zombie AI, and combat ticks.

## Item 1: Sharp Knife — faster attack speed + skinning bonus

### Effect
- **Attack speed:** Add sharp_knife to `WEAPON_ATTACK_MS` in `src/data/combat.js` with a value of `600` (fastest melee weapon). Update `computePlayerAttackSpeed` to check `state.inventory.sharp_knife > 0`.
- **Skinning bonus:** In `src/logic/combat.js`, in the `applyAttack` function where animal kill drops are computed, if the player has `state.inventory.sharp_knife > 0`, add +1 raw_meat to the corpse's loot list. This stacks with Skin Master's +1 pelt (different item, both apply).
- **Damage:** The knife is fast but weak. Do NOT add it to any damage bonus — it relies on attack speed, not hit power. The player's base damage (+ Power stat) applies as usual.

### Recipe update
Update the description in `src/data/recipes.js` for sharp_knife:
```js
desc: 'Fast melee weapon. +1 meat from animal kills.',
```

## Item 2: Torch — expanded vision radius + wolf deterrent

### Effect
- **Vision radius:** In `src/constants.js`, `VISION_RADIUS = 5`. When the player holds a torch (`state.inventory.torch > 0`), vision radius increases by 2 (to 7). 
  - Implementation: in `visibilityAt` in `src/logic/visibility.js`, the radius is currently hardcoded as `VISION_RADIUS`. Pass a computed radius instead. Add a helper:
    ```js
    export function getEffectiveVisionRadius(state) {
      return VISION_RADIUS + (state.inventory?.torch > 0 ? 2 : 0);
    }
    ```
  - Update all `visibilityAt` callers to use `getEffectiveVisionRadius(state)` instead of the constant. If seed 14 has already changed the signature, adapt accordingly.
  - **Night only:** The bonus applies at all times for simplicity. A future seed could restrict it to nighttime.

- **Wolf deterrent:** Wolves within 3 tiles of the player will not initiate aggro if the player holds a torch. In `useGameLoop.js`, in the animal AI section where wolves decide to chase the player, add a check: if `state.inventory.torch > 0` and the wolf is within 3 tiles, skip the aggro trigger. Wolves already engaged in combat are NOT affected (the torch doesn't break an active fight).

- **Durability (burn time):** The torch burns. Add `state.torchFuel` (default: 0, set to 100 when torch is first acquired or crafted). Each game-tick, if `state.inventory.torch > 0` and `state.torchFuel > 0`, decrement `state.torchFuel` by `TIME_SCALE * 0.5`. When `torchFuel` hits 0, set `state.inventory.torch = 0` and log `🔥 Your torch burned out.` The torch lasts roughly 2 in-game days at 1x speed.
  - Crafting a new torch resets torchFuel to 100.
  - **Save migration:** `state.torchFuel ??= state.inventory?.torch > 0 ? 100 : 0`

### Recipe update
```js
desc: '+2 vision radius. Deters wolves. Burns over ~2 days.',
```

## Item 3: Lantern — permanent vision radius boost

### Effect
- **Vision radius:** When the player holds a lantern (`state.inventory.lantern > 0`), vision radius increases by 3 (to 8). This stacks with torch if both are held (radius 10), though that's unusual since both occupy the "light source" role.
  - Add to the `getEffectiveVisionRadius` helper:
    ```js
    export function getEffectiveVisionRadius(state) {
      let r = VISION_RADIUS;
      if (state.inventory?.torch > 0) r += 2;
      if (state.inventory?.lantern > 0) r += 3;
      return r;
    }
    ```
- **No burn time:** Lantern is permanent ("sealed flame — never burns out" per the existing description). This is its advantage over torch.
- **No wolf deterrent:** Lantern provides light but not fire — wolves are not deterred.

### Recipe update
```js
desc: '+3 vision radius. Never burns out.',
```

## Item 4: Arrows — ammo for hunting bow

### Effect
- **Ammo consumption:** When the player attacks with a hunting bow and has arrows, consume 1 arrow per shot. In `src/logic/combat.js` or wherever the player's attack swing is processed:
  - Check if the active weapon is the hunting bow (the weapon chosen for this swing — bow is used when `state.inventory.hunting_bow > 0` and the target is at range > 1).
  - If bow attack AND `state.inventory.arrows > 0`: deduct 1 arrow. Attack proceeds normally.
  - If bow attack AND `state.inventory.arrows === 0`: the bow still works but damage is halved (improvised shot with no arrow — keeps the game playable if you run out). Log once per combat engagement: `➳ Out of arrows — bow damage halved.`
- **Rifle stays free for now.** Rifle ammo is a separate future system. This seed only affects the bow.
- **Display:** The existing resource ribbon or HUD should show arrow count. Add arrows to the resource display in the top bar or HUD (wherever wood/stone/scrap/cloth are shown). Use the ➳ icon.

### Recipe update
```js
desc: 'Bow ammo. 1 per shot. No arrows = half bow damage.',
```

## Integration points summary

| File | Changes |
|---|---|
| `src/data/combat.js` | Add sharp_knife to WEAPON_ATTACK_MS (600). Update computePlayerAttackSpeed. |
| `src/logic/combat.js` | Sharp knife +1 raw_meat on animal kill. Bow arrow consumption + half-damage fallback. |
| `src/logic/visibility.js` | Add getEffectiveVisionRadius(state). Update visibilityAt to use computed radius. |
| `src/hooks/useGameLoop.js` | Torch fuel burn tick. Wolf deterrent check in animal AI. Pass computed vision radius. |
| `src/components/MapView.jsx` | Use getEffectiveVisionRadius for rendering. |
| `src/components/GameUI.jsx` or HUD | Show arrow count in resource display. |
| `src/data/recipes.js` | Update all four Tier B descriptions. |
| `src/App.jsx` | Set torchFuel = 100 when crafting a torch. |
| `src/logic/saveLoad.js` | Migrate torchFuel. |

## Acceptance criteria

- [ ] Sharp knife: attack speed 600ms (fastest melee). +1 raw_meat on animal kills.
- [ ] Torch: +2 vision radius while held. Wolves within 3 tiles don't aggro. Burns out after ~2 in-game days. Log on burnout.
- [ ] Lantern: +3 vision radius while held. Permanent (no fuel).
- [ ] Torch + lantern stack vision bonus if both held.
- [ ] Arrows: 1 consumed per bow shot. 0 arrows = half bow damage with a one-time log.
- [ ] Arrow count visible in resource display.
- [ ] Recipe descriptions updated to reflect effects.
- [ ] Torch fuel persists across save/load.
- [ ] `vite build` passes.

## Constraints

- Do NOT add a weapon-switching UI. The game auto-selects the best weapon (lowest attack speed). Sharp knife at 600ms will be auto-selected as melee when held.
- Do NOT add rifle ammo in this seed. Rifle stays free. Arrow ammo for bow only.
- Wolf deterrent only prevents NEW aggro. Does not break active combat.
- Torch fuel ticks use TIME_SCALE for consistency with other drain rates.
- Vision radius changes must propagate to ALL places that use VISION_RADIUS — check MapView rendering, fog update in game loop, and any tooltip/range calculations.

## Plan before executing

1. Read `src/data/combat.js` — understand computePlayerAttackSpeed and WEAPON_ATTACK_MS
2. Read `src/logic/combat.js` — find applyAttack and where kill drops are computed
3. Read `src/logic/visibility.js` — understand visibilityAt signature (may have changed in seed 14)
4. Read `useGameLoop.js` — find wolf aggro logic, player movement, fog update, drain ticks
5. Read `src/components/MapView.jsx` — find vision radius usage in rendering
6. Read `src/App.jsx` — find craft handler for torch fuel reset
7. Propose integration points with line references
8. Wait for go-ahead
9. Implement in order: combat.js data → combat.js logic → visibility.js → useGameLoop.js → MapView → HUD → recipes → save migration
