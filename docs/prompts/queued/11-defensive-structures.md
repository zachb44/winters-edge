# Defensive Structures

**Phase 2 — Gameplay depth. Run AFTER seeds 02 (shambler zombie) and 03 (wave spawner). Requires zombies and wave system to exist. Also benefits from seed 05 (military outpost) being done so sandbags have context, but not strictly required.**

Copy this entire block into Claude Code as a single prompt.

---

Add defensive structures that players can build to fortify their position against zombie waves. Zombies attack structures, structures have HP and can be repaired. This is the core of the "day = build, night = defend" loop in Outbreak Mode.

## CRITICAL PREREQUISITE: Buildings must block zombie movement

The zombie movement code in `useGameLoop.js` currently only checks `TILE_DATA[map[ny][nx]].walkable` for obstacles. It does **NOT** check `state.buildings` for placed structures. This means the existing `wall` building type (and ALL buildings) are invisible to zombie movement — zombies walk right through them.

Before defensive structures can work, the zombie movement pass must be updated to also reject moves onto tiles containing a blocking building from `state.buildings`. Steps:

1. Add a `walkable` field to building definitions in `src/data/buildings.js`: set `walkable: false` for `wall`, `barricade`, and `reinforced_wall`. All other buildings (campfire, tent, stockpile, workbench, trap) default to `walkable: true` (or undefined = walkable).
2. In the zombie movement pass in `useGameLoop.js`, after checking `TILE_DATA[map[ny][nx]].walkable`, also check: `const blockingBuilding = s.buildings.find(b => b.x === nx && b.y === ny && BUILDINGS[b.type]?.walkable === false);` If a blocking building exists, treat the tile as unwalkable.
3. **Performance note:** The building lookup is O(n) per zombie per move attempt. For the current scale (50-60 zombies, ~20 buildings) this is fine. If it becomes a bottleneck later, build a Set of `"x,y"` keys for blocking buildings at the start of each tick.

**Also apply this blocking check to animal movement** in the same section of `useGameLoop.js`. Animals currently also walk through buildings. Same fix: check `state.buildings` for blocking structures. This is a two-line addition to the animal movement block.

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
  walkable: false,
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
  walkable: false,
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
  // walkable: true (default) — zombies walk ONTO this tile and take damage
},
```

Also update the existing `wall` definition to add `walkable: false`:
```js
wall: { name: 'Wood Wall', emoji: '🟤', wood: 3, stone: 0, scrap: 0, desc: 'Blocks enemies.', walkable: false },
```

### How they differ from existing wall

The current `wall` building is a simple blocker with no HP — it's effectively indestructible. The new structures add:
- **HP tracking** — zombies attack them, HP goes down, they break when HP = 0
- **Repair mechanic** — player can restore HP using resources
- **Spike trap** — walkable tile that damages zombies passing through it

The existing `wall` stays as-is — it's the cheap early-game option. Indestructible but cheap. The new structures are upgrades with HP tracking.

## Building HP system

### State tracking

Buildings are stored in `state.buildings` as an array of objects: `{ type, x, y, fuel?, caught?, wentOutLogged? }`. Extend each placed building to include HP when the building definition has an `hp` field:

```js
// When placing a barricade or reinforced_wall:
{
  type: 'barricade',
  x: 10,
  y: 20,
  hp: 50,        // current HP (from BUILDINGS[type].hp)
  maxHp: 50,     // max HP (from BUILDINGS[type].maxHp)
}
```

For existing buildings that don't have HP (campfire, tent, wall, etc.), they remain as-is. Only buildings with an `hp` field in their `BUILDINGS` definition are destructible.

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

Old saves have buildings without HP fields. Migration in `loadGame()`: iterate `state.buildings`, and for each building whose `BUILDINGS` definition has `hp`, backfill `hp` and `maxHp` to those values. If the definition has `uses`, backfill `usesLeft` to that value. If no `hp`/`uses` in definition, leave the building as-is.

## Zombie attacks on structures

This is the core mechanic. In the zombie movement pass in `useGameLoop.js`:

**Current behavior:** Zombies move toward the player on their cadence. If blocked by an unwalkable tile, they try the secondary axis.

**New behavior:** When a zombie tries to move onto a tile with a destructible building (a building with `hp > 0`), instead of skipping that move, the zombie attacks the structure:

1. Zombie's movement picks a next tile toward the player
2. Next tile has a building with `hp > 0` (barricade or reinforced_wall)
3. Zombie stops moving and attacks the building instead
4. Attack uses the same throttle: check `(now - zombie.lastAttackMs) >= ZOMBIE_TYPES[z.type].attackSpeed`
5. Deal zombie's damage to the building's HP
6. When building HP reaches 0:
   - Remove the building from `state.buildings`
   - Log: "🧟 Shamblers destroyed your barricade!"
   - Zombie resumes moving toward player next tick

**Important:** Zombies should NOT attack non-destructible buildings (campfire, tent, workbench, snare trap, basic wall). Only buildings with an `hp` field in their definition are targets. The existing `wall` is cheap but immune to zombie damage — a deliberate design choice for v1.

**Implementation detail:** In the zombie movement loop, where it checks if the next tile is walkable, add an additional branch:
```js
// After determining nx, ny:
const blockingBuilding = s.buildings.find(b => b.x === nx && b.y === ny && BUILDINGS[b.type]?.walkable === false);
if (blockingBuilding) {
  // Is it destructible?
  if (blockingBuilding.hp > 0) {
    // Attack it instead of moving
    if (now - (z.lastAttackMs || 0) >= ZOMBIE_TYPES[z.type].attackSpeed) {
      blockingBuilding.hp -= ZOMBIE_TYPES[z.type].damage;
      if (blockingBuilding.hp <= 0) {
        s.buildings = s.buildings.filter(b => !(b.x === nx && b.y === ny && b.type === blockingBuilding.type));
        s = addLog(s, `🧟 Shamblers destroyed your ${BUILDINGS[blockingBuilding.type].name.toLowerCase()}!`);
      }
      return { ...z, lastAttackMs: now, lungeUntil: now + 200, lastMoveTick: tick };
    }
    return { ...z, lastMoveTick: tick }; // waiting for attack cooldown
  }
  // Indestructible blocker (wall) — try secondary axis
  continue; // or try next move option
}
```

**Note:** The zombie movement currently uses `.map()` which returns new zombie objects but doesn't mutate buildings. Since buildings need to take damage, you'll need to handle building HP updates outside the `.map()` or switch to a loop that can mutate `s.buildings`. The cleanest approach: collect building damage events during the zombie map pass, then apply them after.

## Spike trap behavior

Spike traps are walkable tiles that damage zombies:

1. When a zombie moves onto a tile with a spike trap:
   - Deal `spike_trap.damage` (15) to the zombie
   - Decrement `spike_trap.usesLeft`
   - Log: "⚠️ Spike trap hits shambler! (-15 HP)"
   - Floating damage number over the zombie
2. When `usesLeft` reaches 0:
   - Remove the trap from `state.buildings`
   - Log: "⚠️ Spike trap destroyed"
3. Spike traps do NOT damage animals or the player — only zombies
4. Spike traps are visible on the map (the player placed them knowingly)

### Spike trap consumption model — per-zombie, not per-tick

Spike traps trigger **once per zombie** that enters the tile, not once per tick. If 5 zombies move onto a spike trap tile in the same tick, the trap triggers 5 times: it deals 15 damage to each of the first 3 zombies (consuming all 3 uses), then the trap is destroyed and the remaining 2 zombies pass through unharmed.

Process zombie movement in order — first zombie to enter the tile takes damage, uses decrement, next zombie checks if uses remain. This means:
- 1 zombie walks in → 15 damage, 2 uses left
- 3 zombies walk in same tick → 15 damage each to all 3, 0 uses left, trap destroyed
- 10 zombies walk in same tick → 15 damage to first 3, trap destroyed, remaining 7 pass through

### Implementation

In the zombie movement pass, after a zombie moves to a new tile, check if that tile has a spike trap with `usesLeft > 0`. If so, apply damage and decrement uses. If uses reach 0, remove the trap. Process zombies sequentially so uses decrement correctly across multiple zombies in the same tick — this may require converting the `.map()` to a `for` loop or collecting trap triggers in order.

## Repair mechanic

The player can repair damaged barricades and reinforced walls from an adjacent tile (Manhattan distance ≤ 1).

### Interaction model

**If seed 07 (D2 HUD) has shipped:** Add "Repair" as an action button in the center HUD zone when a damaged barricade/reinforced_wall is selected.

**If seed 13 sub-feature #4 (building menus) has shipped:** Add "Repair" as a menu option in the building action menu.

**If neither has shipped (fallback):** Implement repair as a click interaction — click a damaged barricade/reinforced_wall from an adjacent tile. Show a confirmation or just execute if resources are available.

Regardless of UI approach:
1. Player must be adjacent (Manhattan distance ≤ 1) to the building
2. If HP < maxHp AND player has required materials:
   - Barricade repair cost: 2 wood per 25 HP restored
   - Reinforced wall repair cost: 1 wood + 2 stone per 25 HP restored
3. Restore 25 HP (or to maxHp, whichever is less)
4. Deduct materials
5. Log: "🔨 Repaired barricade (+25 HP)"

### Visual feedback

Damaged structures should look different in `MapView.jsx`:
- HP > 75%: normal appearance
- HP 25-75%: add a "⚠️" indicator next to the building emoji
- HP < 25%: flash/pulse red

## Build menu updates

Add the 3 new structures to the Build menu (`BuildMenu.jsx`):
- Show them after the existing buildings
- Show resource costs as usual
- Spike trap should have a note: "Damages zombies (3 uses)"

Both modes can build these structures, but they're primarily useful in Outbreak Mode. In Wilderness Mode they're just expensive walls (nothing attacks them).

## Tooltip updates

In `MapView.jsx`, extend tooltips for placed defensive structures:
- Barricade: "Barricade — HP: 35/50"
- Reinforced Wall: "Reinforced Wall — HP: 80/100"
- Spike Trap: "Spike Trap — 2 uses left"

## Files to create/modify

**Modify:**
- `src/data/buildings.js` — add 3 new structures with HP/uses/walkable fields, add `walkable: false` to existing wall
- `src/hooks/useGameLoop.js` — zombie-attacks-structures logic, spike trap damage on zombie move, building-blocks-movement for zombies AND animals
- `src/components/MapView.jsx` — damage indicators, updated tooltips
- `src/components/BuildMenu.jsx` — add new structures to menu
- `src/logic/saveLoad.js` — migration for building HP/usesLeft fields
- `App.jsx` — click-to-repair interaction (or extend building menu if it exists)

## Acceptance criteria

- [ ] Existing `wall` building now blocks zombie AND animal movement (via `walkable: false` check)
- [ ] 3 new buildable structures available in Build menu
- [ ] Barricade: 50 HP, costs 6 wood + 2 stone, blocks movement
- [ ] Reinforced Wall: 100 HP, costs 4 wood + 6 stone + 2 scrap, blocks movement
- [ ] Spike Trap: 3 uses, 15 damage per trigger, costs 3 wood + 3 stone + 1 scrap
- [ ] Zombies attack destructible buildings (barricade, reinforced_wall) that block their path
- [ ] Building HP decreases from zombie attacks
- [ ] Buildings are destroyed (removed) when HP reaches 0
- [ ] Spike traps damage zombies that walk over them — per-zombie, not per-tick
- [ ] Spike traps are consumed after 3 uses
- [ ] Player can repair damaged barricades/walls from adjacent tile using resources
- [ ] Damaged structures show visual HP indicator
- [ ] Tooltips show current HP/uses
- [ ] Existing buildings (campfire, tent, etc.) are NOT affected by zombie attacks
- [ ] Indestructible wall is NOT attacked by zombies (they route around it)
- [ ] Save/load preserves building HP and spike trap uses

## Constraints

- Don't break existing building placement or interaction
- Don't make animals attack structures — only zombies target destructible buildings. Animals are blocked by `walkable: false` buildings but don't attack them.
- Don't add turrets or automated defenses yet (future feature)
- Keep repair costs reasonable — repairing should be cheaper than rebuilding
- Spike traps should feel impactful but not overpowered — 15 damage is half a shambler's 30 HP

Commit message: `feat: defensive structures (barricade, reinforced wall, spike trap) with zombie attacks`

## Plan before executing

1. Read `src/data/buildings.js` — current structure
2. Read `BuildMenu.jsx` — how buildings are listed and placed
3. Read zombie movement in `useGameLoop.js` — find the movement `.map()` loop and the walkability check
4. Read animal movement in `useGameLoop.js` — find the movement `.map()` loop
5. Read `MapView.jsx` — how buildings render and tooltips work
6. Read building placement in `App.jsx` — how buildings are stored in state
7. Propose the zombie-attacks-structure integration and the building-blocks-movement addition
8. Wait for go-ahead
9. Implement: building data → movement blocking → build menu → zombie attack logic → spike trap → repair → visual indicators → save/load
10. Test: build a wall, verify zombies path around it. Build a barricade, let zombies attack it, verify HP decreases and building breaks. Place spike trap in front of horde, verify per-zombie triggering.
