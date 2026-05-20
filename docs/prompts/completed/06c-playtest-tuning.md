# Playtest Tuning Pass #1

**Run anytime after seed 06 (map expansion). No dependencies on 06b or later seeds. Quick fixes from first playtest.**

Copy this entire block into Claude Code as a single prompt.

---

Bundle of tuning fixes and one bug fix from the first Outbreak Mode playtest on the 120×90 map.

## Bug fix: Zombies must attack from adjacent tile, not player's tile

**The bug:** Zombies move onto the player's tile to attack. They should stop one tile away and swing from there.

**The fix:** In `src/logic/zombies.js` (or wherever zombie movement is calculated in `useGameLoop.js`), find the movement logic where a zombie picks its next tile toward the player. Add a check: if the next tile IS the player's tile `(nextX === player.x && nextY === player.y)`, don't move — stay on the current tile and attack from there.

The zombie is already adjacent at that point (it was about to step onto the player). The attack code triggers when the zombie is within 1 tile of the player, which it is. The zombie just shouldn't take that final step onto the player.

**Search for:** The zombie movement section in `useGameLoop.js`. Look for where `zombie.x` and `zombie.y` are updated. The adjacency check for attacking should already exist nearby. Add the player-tile exclusion to the movement target selection.

## Tuning: Faster shamblers

In `src/data/zombies.js`, update shambler `moveSpeed`:

```js
moveSpeed: 3.5,  // was 2.5 — faster so they actually reach the player on night 1
```

Then find wherever `moveSpeed` is converted to a tick interval in `useGameLoop.js`. The formula from seed 02's implementation was something like `ticksPerMove = Math.round(30 / moveSpeed)`. At 2.5 that was 12 ticks between moves. At 3.5 it becomes ~9 ticks. Verify the formula is still producing sensible intervals after the change.

## Tuning: Bigger waves

In `src/logic/zombies.js`, update `getWaveSize()`:

```js
function getWaveSize(nightNumber) {
  const base = 5;       // was 3
  const perNight = 1.8;  // was 1.4
  return Math.floor(base + (nightNumber - 1) * perNight);
}
```

New curve:
- Night 1: 5
- Night 5: 12
- Night 10: 21
- Night 15: 30
- Night 20: 39
- Night 25: 48
- Night 30: 57

More zombies from the start, steeper ramp. Night 1 should feel like a real threat, not a warmup.

## Tuning: More wildlife

In `src/logic/animals.js`, update `spawnInitialAnimals()` to add more creatures across the 120×90 map. Bump counts:

- Rabbits: 10 → 15 (scatter across all quadrants)
- Deer: 5 → 7 (near tree crescent, open tundra, hilltop area)
- Wolves: 5 → 6 (wilderness areas, avoid outpost)
- Boars: 3 → 5 (southern half)
- Bear: 1 → 1 (keep single apex predator at cave)
- Seals: 4 → 6 (spread across frozen lake)
- Ravens: 4 → 5 (scattered, decorative)

Total: ~45 animals (was ~31). On a 10,800 tile map that's roughly 1 animal per 240 tiles — still sparse enough to feel wild, dense enough that you'll encounter something regularly.

For the new spawns, pick positions that:
- Don't overlap with named locations (outpost, hangar, cave entrance)
- Don't stack multiple animals on the same tile
- Spread across underserved areas (the east half of the map is currently light on wildlife)

Place new positions by adding entries to the existing spawn arrays. Don't restructure the spawn system — just add more `{ type, x, y }` entries.

## Files to modify

- `src/hooks/useGameLoop.js` — zombie movement bug fix (don't step onto player tile)
- `src/data/zombies.js` — shambler moveSpeed 2.5 → 3.5
- `src/logic/zombies.js` — getWaveSize base 3→5, perNight 1.4→1.8
- `src/logic/animals.js` — add ~14 more animal spawns

## Acceptance criteria

- [ ] Zombies stop adjacent to the player, never occupy the player's tile
- [ ] Zombies attack from adjacent tile (existing attack code, no change needed)
- [ ] Shambler moveSpeed is 3.5 (faster movement)
- [ ] Night 1 spawns 5 zombies (was 3)
- [ ] Night 30 spawns ~57 zombies (was ~43)
- [ ] ~45 animals spawn on the map (was ~31)
- [ ] New animal spawns don't overlap with named locations
- [ ] Wilderness Mode: animal changes apply, zombie changes are irrelevant (no zombies spawn)

## Constraints

- Don't change zombie attack mechanics — only movement targeting
- Don't restructure the animal spawn system — just add entries
- Don't touch wave timing or sub-wave logic — only the count formula
- These are all number changes and one conditional check. Small diff.

Commit message: `fix: zombies attack adjacent not on-tile; tune speed, wave size, wildlife counts`

## Plan before executing

1. Read zombie movement code in `useGameLoop.js` — find where zombie position updates
2. Read `src/data/zombies.js` — confirm current moveSpeed
3. Read `getWaveSize` in `src/logic/zombies.js` — confirm current formula
4. Read `src/logic/animals.js` — see current spawn list and pick new positions
5. Make all changes
6. Commit
