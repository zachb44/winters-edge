# Defensive Structures

**Phase 2 — Gameplay depth. Run AFTER seeds 02 (shambler zombie) and 03 (wave spawner). Requires zombies and wave system to exist. Also benefits from seed 05 (military outpost) being done so sandbags have context, but not strictly required.**

Copy this entire block into Claude Code as a single prompt.

---

Add defensive structures that players can build to fortify their position against zombie waves. Zombies attack structures, structures have HP and can be repaired. This is the core of the "day = build, night = defend" loop in Outbreak Mode.

## New buildable structures

Add to `src/data/buildings.js`:

```js
barricade: {
  name: 'Barricade',
  emoji: '🧱',
  wood: 6,
  stone: 2,
  scrap: 0,
  desc: 'Blocks enemies. 50 HP. Repairable.',
  hp: 50,
  maxHp: 50,
},
reinforced_wall: {
  name: 'Reinforced Wall',
  emoji: '🧱',
  wood: 4,
  stone: 6,
  scrap: 2,
  desc: 'Strong wall. 100 HP. Repairable.',
  hp: 100,
  maxHp: 100,
},
spike_trap: {
  name: 'Spike Trap',
  emoji: '⚠️',
  wood: 3,
  stone: 3,
  scrap: 1,
  desc: 'Damages zombies that walk over it. 15 dmg, 3 uses.',
  uses: 3,
  damage: 15,
},
```

### How they differ from existing wall

The current `wall` building (`🟤`, 3 wood) is a simple blocker with no HP — it's just an unwalkable tile. The new structures add:
- **HP tracking** — zombies attack them, HP goes down, they break when HP = 0
- **Repair mechanic** — player can restore HP using resources
- **Spike trap** — walkable tile that damages zombies passing through it

The existing `wall` stays as-is — it's the cheap early-game option. The new structures are upgrades.

## Building HP system

### State tracking

Currently, buildings are stored as entries in the map or in `state.buildings` (check how `placeBuilding` works in `App.jsx`). Each placed building needs to track HP.

Extend the building state to include HP:

```js
// Each entry in state.buildings (or however buildings are tracked):
{
  type: 'barricade',
  x: 10,
  y: 20,
  hp: 50,        // current HP
  maxHp: 50,     // max HP (from BUILDINGS definition)
}
```

For existing buildings that don't have HP (campfire, tent, wall, etc.), they're effectively indestructible. Only buildings with an `hp` field in their `BUILDINGS` definition are destructible.

For the spike trap:
```js
{
  type: 'spike_trap',
  x: 10,
  y: 20,
  usesLeft: 3,   // decrements when a zombie walks over it
}
```

### Building HP migration

Old saves have buildings without HP fields. Migration: if a building's `BUILDINGS` definition has `hp`, backfill `hp` and `maxHp` to those values. If no `hp` in definition, leave the building as-is (indestructible).

## Zombie attacks on structures

This is the core mechanic. In the zombie AI tick (seed 02's code in `useGameLoop.js`):

**Current behavior:** Zombies path toward the player. If blocked by an unwalkable tile, they try an adjacent tile.

**New behavior:** When a zombie's path to the player is blocked by a destructible building (barricade, reinforced_wall), instead of rerouting, the zombie attacks the structure:

1. Zombie tries to move toward player
2. Next tile in path has a destructible building
3. Zombie stops and attacks the building instead of moving
4. Attack uses the same throttle system as player attacks: check `(now - zombie.lastAttackMs) >= zombie.attackSpeed`
5. Deal zombie's damage to the building's HP
6. When building HP reaches 0:
   - Remove the building from state
   - Remove the tile blocker (tile becomes walkable `T.SNOW` or whatever was underneath)
   - Log: "🧟 Shamblers destroyed your barricade!"
   - Zombie resumes moving toward player next tick

**Important:** Zombies should NOT attack non-destructible buildings (campfire, tent, workbench, snare trap, basic wall). Only buildings with `hp` in their definition are targets. This means the existing wall is cheap but immune to zombie damage — a deliberate design choice for now. If that feels wrong, we can revisit, but for v1 it simplifies the system.

**Also important:** Zombies only attack structures that are between them and the player. If a barricade is behind the zombie (away from the player), the zombie ignores it and keeps walking toward the player.

### How to detect "between zombie and player"

Simplest approach: when the zombie's pathfinding picks a next tile and that tile has a destructible building, attack it. The zombie doesn't need to understand geometry — it just attacks whatever's blocking its next step toward the player.

## Spike trap behavior

Spike traps are walkable tiles that damage zombies:

1. When a zombie moves onto a tile with a spike trap:
   - Deal `spike_trap.damage` (15) to the zombie
   - Decrement `spike_trap.usesLeft`
   - Log: "⚠️ Spike trap hits shambler! (-15 HP)"
   - Floating damage number over the zombie
2. When `usesLeft` reaches 0:
   - Remove the trap
   - Log: "⚠️ Spike trap destroyed"
3. Spike traps do NOT damage animals or the player — only zombies
4. Spike traps are visible on the map (the player placed them knowingly)

### Implementation

In the zombie movement tick, after a zombie moves to a new tile, check if that tile has a spike trap. If so, apply damage and decrement uses.

## Repair mechanic

The player can repair damaged barricades and reinforced walls:

### Via building interaction menu (seed 13 adds building menus, but we can add a simpler version here)

For now, implement repair as a click interaction:
1. Player clicks a damaged barricade/reinforced wall
2. If HP < maxHp AND player has required materials:
   - Barricade repair cost: 2 wood per 25 HP restored
   - Reinforced wall repair cost: 1 wood + 2 stone per 25 HP restored
3. Restore 25 HP (or to maxHp, whichever is less)
4. Deduct materials
5. Log: "🔨 Repaired barricade (+25 HP)"

If the building interaction menu from seed 13 is already implemented, add "Repair" as a menu option. If not, use the same click-to-interact pattern as cabin looting.

### Visual feedback

Damaged structures should look different:
- HP > 75%: normal appearance
- HP 25-75%: add a "⚠️" indicator next to the building emoji
- HP < 25%: flash/pulse red

Implement this in `MapView.jsx` where buildings render. Check if the building has HP and render the damage indicator accordingly.

## Build menu updates

Add the 3 new structures to the Build menu (`BuildMenu.jsx`):
- Show them after the existing buildings
- Show resource costs as usual
- Spike trap should have a note: "Damages zombies (3 uses)"

Both modes can build these structures, but they're primarily useful in Outbreak Mode. In Wilderness Mode they're just expensive walls (nothing attacks them except potentially animals, which we don't implement here — animals don't attack structures).

## Tooltip updates

In `MapView.jsx`, extend tooltips for placed defensive structures:
- Barricade: "Barricade — HP: 35/50"
- Reinforced Wall: "Reinforced Wall — HP: 80/100"
- Spike Trap: "Spike Trap — 2 uses left"

## Files to create/modify

**Modify:**
- `src/data/buildings.js` — add 3 new structures with HP/uses fields
- `src/hooks/useGameLoop.js` — zombie-attacks-structures logic, spike trap damage on zombie move
- `src/components/MapView.jsx` — damage indicators, updated tooltips
- `src/components/BuildMenu.jsx` — add new structures to menu
- `src/logic/saveLoad.js` — migration for building HP fields
- `App.jsx` — click-to-repair interaction (or extend building menu if it exists)

## Acceptance criteria

- [ ] 3 new buildable structures available in Build menu
- [ ] Barricade: 50 HP, costs 6 wood + 2 stone
- [ ] Reinforced Wall: 100 HP, costs 4 wood + 6 stone + 2 scrap
- [ ] Spike Trap: 3 uses, 15 damage per trigger, costs 3 wood + 3 stone + 1 scrap
- [ ] Zombies attack destructible buildings that block their path
- [ ] Building HP decreases from zombie attacks
- [ ] Buildings are destroyed (removed) when HP reaches 0
- [ ] Spike traps damage zombies that walk over them
- [ ] Spike traps are consumed after 3 uses
- [ ] Player can repair damaged barricades/walls using resources
- [ ] Damaged structures show visual HP indicator
- [ ] Tooltips show current HP/uses
- [ ] Existing buildings (campfire, tent, etc.) are NOT affected by zombie attacks
- [ ] Save/load preserves building HP and spike trap uses

## Constraints

- Don't break existing building placement or interaction
- Don't make animals attack structures — only zombies target them
- Don't add turrets or automated defenses yet (future feature)
- Keep repair costs reasonable — repairing should be cheaper than rebuilding
- Spike traps should feel impactful but not overpowered — 15 damage is half a shambler's 30 HP

Commit message: `feat: defensive structures (barricade, reinforced wall, spike trap) with zombie attacks`

## Plan before executing

1. Read `src/data/buildings.js` — current structure
2. Read `BuildMenu.jsx` — how buildings are listed and placed
3. Read zombie movement in `useGameLoop.js` — find pathfinding/collision logic
4. Read `MapView.jsx` — how buildings render and tooltips work
5. Read building placement in `App.jsx` — how buildings are stored in state
6. Propose the zombie-attacks-structure integration
7. Wait for go-ahead
8. Implement: building data → build menu → zombie attack logic → spike trap → repair → visual indicators → save/load
9. Test: build a barricade line, let zombies attack it, verify HP decreases and building breaks
