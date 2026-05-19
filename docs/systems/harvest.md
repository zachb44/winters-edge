# Harvest System

Multi-hit chopping/mining. Shares the swing engine with combat.

## Overview

Click a tree or rock → walk into range → auto-swing until depleted.

## Tile HP

- Trees: 4 HP base
- Rocks: 5 HP base
- Stored in `state.tileHp` as sparse map: `{ "x,y": currentHp }`
- Only populated when first struck (performance: no tracking 2700 tiles)

## Swing speed

- `HARVEST_SWING_MS = 800ms` (slightly faster than combat — chopping rhythm)
- Single `lastAttackMs` timer drives whichever target is set (combat OR harvest)

## Damage per swing

### Trees
- Bare hands: 1
- Hatchet equipped: +1
- Foraging skill: +1 per 3 levels

### Rocks
- Bare hands: 1
- Hatchet: +0 (hatchet not great for stone)
- Crafting skill: +1 per 3 levels (proxy for Mining — no Mining skill yet)

## Yield

- Full wood/stone amount on completion (no partial yield)
- XP awarded on completion (tree: 3, rock: 2)
- Trees: yield = `2 + floor(foraging/2)` * profession bonuses
- Rocks: yield = 1 (+1 with mining bonus from Prospector)
- Rocks now disappear 100% on completion (was 40% in older version)

## Stamina

- 3 per swing
- Tree takes 4 swings = 12 stamina (bare hands)
- Hatchet user = 2 swings = 6 stamina

## Persistence

- `state.tileHp` saved to localStorage
- Partial chop persists across walk-aways AND save/load
- Walking back resumes from current HP
- HP resets only when tree regrows (existing tree-regrowth system)

## Visual

- Lunge animation (same as combat)
- Floating "-N" number per swing
- Thin red HP bar over struck tiles (only renders for sparse `tileHp` entries)
- HP bar disappears on completion or when player walks away

## Disengagement

- Click elsewhere → clears `harvestTarget`
- Press Esc → clears engagement
- Walking away → breaks engagement but HP persists

## Architecture

- **Logic:** `src/data/harvest.js` (constants, formulas), `src/logic/harvest.js` (applyHarvest pure function)
- **Visual:** `src/components/HarvestHpBars.jsx`
- **Engine:** Same `useGameLoop` swing timer as combat

## Click routing

```
click tree/rock → set harvestTarget, clear combatTarget
click animal → set combatTarget, clear harvestTarget
click plane/cabin → existing single-click loot (unchanged)
click elsewhere → clear both
```
