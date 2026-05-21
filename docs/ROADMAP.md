# Roadmap

The current state of Winter's Edge, what's planned next, and what's queued for future.

## Current state — Spring 2026

The game is **demo-ready**. Shippable single-player prototype with:

> **Big jump on 2026-05-21:** Outbreak Mode gained horde-themed daily events, defensive structures with HP, profession abilities at lv 3/5/7, calmer predator AI, click-to-loot corpses, ranged projectile animations, in-HUD building action menus, walk-to-place + adjacency-gated build time. UI was overhauled to a D2-style bottom HUD with HP/Warmth orbs, a 24-segment animated day/night dial, and the workbench is now a crafting hub. Player movement uses A* pathfinding so you route around obstacles instead of stalling on them. The per-system details below predate these changes; see the completed-bundles table at the bottom for the per-commit map.


### Core gameplay
- Top-down 2D map with click-to-move
- Day/night cycle (~5 min per in-game day at 1x)
- Weather (clear, snow, blizzard)
- Vitals: HP, Warmth, Hunger, Stamina (all with proper max stats now)
- Fog of war with permanent reveal

### Player systems
- 6 professions with distinct starting kits + passive bonuses
- Character creation flow (scenario → profession → name → start)
- Random crash sites (5 possible locations)
- Skill XP for Foraging, Hunting, Crafting (each levels independently)
- **Character leveling** with XP rewards from all major actions
- **Stat upgrades** at level-up: Vitality, Insulation, Endurance, Power

### Combat
- **Auto-attack engagement** — click target, swings happen on attack-speed timer
- Player baseline 1000ms, faster with weapons (hatchet 850ms, bow 750ms, rifle 1300ms)
- Animal AI with per-creature attack speeds (properly throttled — see bug fix 829095e)
- Floating damage numbers, lunge animation, hit flashes, screen shake
- HP bar over engaged targets
- Combat target tracking by stable animal ID

### Harvest (trees/rocks)
- Multi-hit chopping/mining on same swing engine as combat
- Trees: 4 HP, Rocks: 5 HP
- Tile HP persists across walk-aways
- Tools add damage (hatchet +1 to trees), skills add damage (+1 per 3 skill levels)

### World
- 60×45 tile map with distinct zones: tundra, lake, forest crescent, boulder field, cave hill, deep wilderness
- 7 animal types with distinct behaviors (rabbit, deer, wolf, boar, bear, seal, raven)
- Bear is territorial near the cave (apex predator)
- Animals respawn slowly at map edges

### Loot
- Rarity-tiered loot tables (common/uncommon/rare)
- Cabins and plane wreckage have finite uses (limited loot rolls)
- Supply crates drop periodically
- "Frozen carcass" event drops a one-time meat pickup near player

### Events
- 12 daily random events (calm, wolf pack, aurora, cold snap, deer migration, lost traveler, cache rumor, frozen carcass, thaw, bear roaming, distant engine, storm brewing)
- Each affects gameplay meaningfully (extra wolf aggro, faster warmth drain, free crate drop, etc.)

### Buildings
- 6 building types: campfire, tent, wall, stockpile, workbench, snare trap
- Campfires cast warm glow + smoke, consume wood as fuel
- Tents allow sleep-through-night
- Traps catch small game over time

### Scenarios
- "Wait for Rescue" — survive 30 days
- "Reach the Radio Tower" — gather supplies, trek to far corner of map

### Onboarding + polish
- Intro overlay with crash narrative + 3 quick tips
- Tile hover tooltips ("Click to chop for wood", with use counts on cabins/wreckage)
- Vitals warnings (FREEZING, STARVING, INJURED)
- Day change banner with event name
- Predator proximity warnings (wolf nearby, BEAR NEARBY — RUN)
- Death cause tracking ("Killed by wolf", "You froze to death")
- Safe first night for new players
- Level Up button in top bar (gold pulse, restyled to match UI)

### Architecture
- Refactored from 1969-line monolith to 31 files across `data/`, `logic/`, `components/`, `hooks/`
- Pure logic separated from React rendering — future-proofed for engine swap
- Save/load via localStorage with migration support for older save formats

### Tech stack
- React 18 + Vite + Tailwind
- Pure functions for game logic (testable, portable)
- CSS animations for visual effects (snow particles, campfire glow, smoke, aurora, lunges)

---

## Queued — ready to run

These are the next prompts that can be pasted into Claude Code. See `docs/prompts/queued/` for full prompt text.

### Priority 1 — Outbreak Mode core (next 3-5 sessions)

This is the critical path. Everything else waits until Outbreak Mode is playable.

1. **Mode selection screen** — `01-mode-selection.md` — Update character creation to add Mode → Scenario two-step selection. Wilderness Mode uses existing systems unchanged. Outbreak Mode sets reduced hunger/warmth drain rates and enables zombie spawning.

2. **Basic zombie enemy (shambler)** — `02-shambler-zombie.md` — First zombie type. Slow, predictable, moderate HP. Spawns at map edges at sundown. Uses existing combat system (auto-attack engagement). Distinct from animals in appearance and behavior. *Depends on: 01*

3. **Wave system + night counter** — `03-wave-spawner.md` — Zombie count scales with night number. Night 1 = small group, Night 30 = horde. Day banner changes to "NIGHT N" format at sundown. Win condition becomes "Survive 30 nights" in Outbreak Mode. *Depends on: 01, 02*

4. **Outbreak vitals rebalance** — `04-vitals-rebalance.md` — Wire mode-dependent hunger/warmth drain rates into the game loop (outbreak = 1/4 rate). *Depends on: 01*

5. **Military outpost zone** — `05-military-outpost.md` — Add the outpost area to the map. Multiple buildings, sandbag walls, watchtower, armory. Near the crash site in Outbreak Mode. Justifies weapon/ammo abundance. *Depends on: 01*

6. **Map expansion to 120×90** — `06-map-expansion.md` — 4× the area. Add all 8 named base locations (Military Outpost, Hangar, Tree Crescent, Cave System, Frozen Lake Cabin, Boulder Maze, Hilltop, Crash Site). *Depends on: 05*

### Priority 2 — Polish + expansion (medium-term)

- Zombie variants (brute, runner, screamer)
- Ammo as tracked resource (rifle uses bullets, bow uses arrows)
- NPC survivors you can find and recruit
- Smooth-scrolling camera (replace tile-snap with glide)
- Sprite art swap (Kenney winter pack or commissioned)
- Skill trees per profession (30+ nodes each)
- Audio (ambient wind, footsteps, combat, wolf howls, zombie groans)
- Multiple biomes on larger map

### Long-term (6+ months out)

- Itch.io release of v1 Winter's Edge (both modes)
- Multiplayer prototype (Supabase integration)
- Blood Moon mode as separate game (medieval werewolf survival)

---

## Completed bundles

| Bundle | Date | Summary |
|---|---|---|
| v1-v5 | Spring 2026 | Core game built in Claude.ai artifact |
| Refactor | May 2026 | App.jsx 1969→690 lines, 31 files |
| Bundle 1 | May 2026 | Finite loot, more creatures, save/load |
| Bundle 2 / Demo Polish | May 2026 | Intro overlay, vitals warnings, day banners, predator alerts, death cause, safe first night, tile tooltips |
| Combat + Leveling | May 2026 | Auto-attack combat, character XP, level-ups, 4 stat upgrades |
| Quick Wins | May 2026 | Faster combat speeds, multi-hit harvest, level-up button repositioned |
| Bug Fix | May 2026 | Animal attack throttle — animals were attacking every 100ms tick instead of respecting attackSpeed. Split map assignment to fix stale-reference bug (commit 829095e) |
| Pivot Docs | May 2026 | PIVOT.md created, VISION.md and ROADMAP.md updated to reflect two-mode design (Wilderness + Outbreak) |
| Seed Queue | May 2026 | 13 prompt seeds written and queued: 8 new (mode selection, shambler, wave spawner, vitals rebalance, military outpost, map expansion, outbreak events, defensive structures) + 5 renumbered (HUD, clock, workbench, profession abilities, interaction overhaul) |
| Phase 2 — Gameplay depth | 2026-05-21 | Seeds 10–13 shipped in one session. Outbreak events (`22433a7`), defensive structures (`ad4dafb`), profession abilities (`574e833`), interaction overhaul part 1 — predator damage retune + corpses + projectiles (`90c1d7d`), interaction overhaul part 2 — building action menus + adjacency + build time (`8d990c0`). 3 abilities (Track, Stim Pack, Earth Sense) stubbed pending fog-reveal / movement-buff systems. Rest Here at campfires stubbed. Zombie corpses deferred per seed spec. |
| Playtest pass | 2026-05-21 | Outbreak Sleep restriction (`5d84d1e`); A* pathfinding + no build distance cap + adjacency-gated build progress + WC3-style log panel (`8c7fb5a`). |
| Phase 3 — HUD overhaul | 2026-05-21 | Seeds 07–09 shipped in one session. D2-style bottom HUD with HP/Warmth orbs, 6-slot belt, in-HUD BuildingPanel (`1fe9eb0`); animated 24-segment day/night dial in the top bar (`2f6f118`); workbench crafting menu with 8 recipes (`0f8a402`). Track / Stim Pack / Earth Sense still pending their underlying systems. |

---

## Notes on cadence

This is a part-time passion project. No deadlines. Bundles ship when they ship. Most weeks are 1-2 sessions.

The discipline is: **finish what's started before adding new scope.** The hardest part of game dev is finishing.

The pivot to two modes is NOT scope creep — it's scope clarification. Outbreak Mode reuses 90% of existing systems. The new work is zombies, waves, and map expansion. Everything else already works.
