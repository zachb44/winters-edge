# Roadmap

The current state of Winter's Edge, what's planned next, and what's queued for future.

## Current state — Spring 2026

The game is **demo-ready**. Shippable single-player prototype with:

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

1. **Mode selection screen** — Update character creation to add Mode → Scenario two-step selection. Wilderness Mode uses existing systems unchanged. Outbreak Mode sets reduced hunger/warmth drain rates and enables zombie spawning.

2. **Basic zombie enemy (shambler)** — First zombie type. Slow, predictable, moderate HP. Spawns at map edges at sundown. Uses existing combat system (auto-attack engagement). Distinct from animals in appearance and behavior.

3. **Wave system + night counter** — Zombie count scales with night number. Night 1 = small group, Night 30 = horde. Day banner changes to "NIGHT N" format at sundown. Win condition becomes "Survive 30 nights" in Outbreak Mode.

4. **Military outpost zone** — Add the outpost area to the map. Multiple buildings, sandbag walls, watchtower, armory. Near the crash site in Outbreak Mode. Justifies weapon/ammo abundance. Environmental storytelling (bullet holes, abandoned tents, half-built barricades).

5. **Map expansion to 120×90** — 4× the area. Add all 8 named base locations (Military Outpost, Hangar, Tree Crescent, Cave System, Frozen Lake Cabin, Boulder Maze, Hilltop, Crash Site). Cave expands to ~5×4 interior with 1-2 entrances.

### Priority 2 — Gameplay depth (next 3-6 sessions after P1)

6. **Profession abilities** — Active skills tied to class, unlocked at levels 3/5/7
   - Lumberjack: Power Chop, Hardy, Stockpile
   - Hunter: Track, Aimed Shot, Skin Master
   - Mechanic: Salvage, Jury-Rig, Lucky Find
   - Medic: Field Bandage, Diagnose, Stim Pack
   - Prospector: Power Mine, Cold Forged, Earth Sense
   - Veteran: Battle Cry, Iron Will, Execute

7. **Outbreak events** — Replace/supplement cold-themed events with horde-themed ones in Outbreak Mode (big horde tonight, fast zombies, screamer spotted, weapon cache, ammo cache). Keep weather events.

8. **Defensive structures** — Barricades, reinforced walls, spike traps. Zombies attack structures. Structures have HP and can be repaired. Cost wood/stone.

### Priority 3 — HUD + UX overhaul (after P2)

9. **Mission A — D2-style bottom HUD** — Orbs for HP/Warmth, belt for consumables, selectable buildings show menu in center HUD

10. **Mission B — WC3 animated day/night dial** — Circular SVG dial with filling segments and sun/moon morph

11. **Mission C — Workbench crafting hub** — Click workbench to open recipe menu (torch, hatchet, hunting bow, fur coat, dried meat, etc.)

### Priority 4 — Polish + expansion (medium-term)

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

---

## Notes on cadence

This is a part-time passion project. No deadlines. Bundles ship when they ship. Most weeks are 1-2 sessions.

The discipline is: **finish what's started before adding new scope.** The hardest part of game dev is finishing.

The pivot to two modes is NOT scope creep — it's scope clarification. Outbreak Mode reuses 90% of existing systems. The new work is zombies, waves, and map expansion. Everything else already works.
