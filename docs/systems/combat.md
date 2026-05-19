# Combat System

## Overview

Click-to-engage auto-attack combat. Player and animal swing on independent timers.

## Engagement

- Click an animal → player walks into range, then engages
- Auto-swings begin on each side
- Combat continues until target dies, target flees, player moves away, or player presses Esc

## Attack speeds (ms between swings)

### Player
- Baseline: 1000ms
- Hatchet: 850ms
- Hunting bow: 750ms
- Rifle: 1300ms
- Veteran profession: -200ms baseline

### Animals
- Wolf: 1000ms
- Boar: 1500ms
- Bear: 1700ms
- Rabbit, deer, seal, raven: no attack

## Damage calculation

```
base = 8 + floor(hunting_skill * 2) + (knife ? 4 : 0)
+ profession bonuses (Hunter +25% vs animals, Veteran +50%, etc.)
+ weapon bonuses (rifle +15, bow +8, hatchet +5)
+ Power stat upgrades (+5% per stack, compounds)
```

Final damage applied per swing.

## Damage taken (player)

- Wolf: 8 base
- Boar: 12 base
- Bear: 20 base
- Reduced 25% if Veteran profession

## Visual feedback per swing

- Brief lunge animation (~4px toward target, 200ms)
- Floating damage number (-N) rises and fades
- Hit flash on target
- Screen shake on heavy hits

## Combat UI

- HP bar appears above engaged target
- ⚔️ icon between player and target
- Target's wander AI pauses during engagement

## Disengagement

- Press Esc → stop attacking, target resumes wandering
- Click another tile → break engagement
- Walk out of range — actually current behavior: target stays locked until you click away. May need iteration.
- Target dies → normal

## Architecture

- **Logic:** `src/data/combat.js` (constants, formulas), `src/logic/combat.js` (applyAttack pure function returns {state, hit})
- **Visual:** `src/components/FloatingDamage.jsx`, `src/components/CombatOverlay.jsx`
- **Engine:** Driven by `useGameLoop` swing timer (shared with harvest system)

## Save behavior

Combat target clears on save/load (combatTarget = null on reload). Animal resumes wandering. Avoids weird mid-fight state on reload.

## Known tuning notes

- Combat feel improves dramatically with sound effects (not yet added)
- Lunge animation is placeholder for real sprite attack animations
- Bear's 100 XP burst can grant 3-4 levels at once — watch in playtest
- Boar permanent aggro might be too punishing — add 5-min timeout if so
