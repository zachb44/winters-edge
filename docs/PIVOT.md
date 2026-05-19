# Project Pivot — May 2026

This document captures a major design pivot in the Winter's Edge project. It supersedes earlier ambiguity in VISION.md about what the game is fundamentally about.

## The pivot in one line

**Winter's Edge is now two distinct game modes sharing one engine: Wilderness Mode (atmospheric solo survival vs. nature) and Outbreak Mode (single-player zombie horde defense at a military outpost).**

## Why this happened

Earlier versions of the project described "a winter survival game" without committing to what the player is fundamentally fighting. The systems got built (combat, leveling, professions, fog of war, weather, events) but the game lacked a clear antagonist and a clear answer to "why am I playing this?"

In design discussion (see chat history), the project owner identified that:
- They felt more excited about the Blood Moon concept (multiplayer werewolf survival)
- The reason wasn't preference — it was that Blood Moon had a clearer concept
- Winter's Edge needed a sharper "why" to match

The conversation surfaced that zombie waves had been an original instinct that got set aside when winter was picked as the focus. Bringing zombies back, but as a deliberate second mode rather than a feature bolted onto wilderness survival, solves the problem.

## The two modes

### Wilderness Mode (formerly the only mode)

**The fantasy:** You crashed in a frozen wilderness. The cold is hunting you. Every decision matters because the world doesn't care if you live.

**The systems:**
- Hunger + warmth are central — they're the antagonists
- Wildlife is the threat (bears, wolves, boars)
- Slow-burn, contemplative pacing
- Win by surviving 30 days for rescue OR reaching the radio tower

**Tone:** *The Long Dark, Don't Starve*. Atmospheric, lonely, dread-filled.

**Status:** This is essentially what the game already is. Most existing systems support this mode unchanged.

### Outbreak Mode (the new direction)

**The fantasy:** You crashed near a military outpost in the wilderness. Lucky — there's weapons. Unlucky — the dead are walking, and they come at night.

**The premise:** Your plane went down near an abandoned military outpost (or hunting/research station). The outpost has been overrun. Now you have access to its weapons and ammo, but every night zombies emerge from the wilderness and try to take what's left.

**The systems:**
- Hunger + warmth dialed WAY down (drain ~1/4 as fast) — they exist as background flavor, not as threats
- Zombies are the central threat
- Day = gather, build, scout, prepare. Night = defend.
- Combat and fortification are the core test
- Win by surviving 30 nights OR reaching the radio tower for evacuation

**Tone:** *State of Decay, They Are Billions, 7 Days to Die* — action-survival, fortress building, escalating waves.

**Status:** Needs new systems (zombies, wave spawning, night counter, possibly new structures). Reuses everything else.

## What the player picks at game start

Currently the scenario selection screen offers "Wait for Rescue" and "Reach the Radio Tower." This expands to mode + scenario:

**Mode selection (first choice):**
- Wilderness Mode
- Outbreak Mode

**Then scenario (second choice):**
- Wait for Rescue / Hold the Line (mode-appropriate naming)
- Reach the Radio Tower

A future iteration could add scenarios per mode. For now, scenario behaves similarly across modes (30 days/nights, optional tower extraction).

## What changes in Outbreak Mode

### Stays the same
- Same map structure (expanded, see below)
- Same combat system (auto-attack)
- Same leveling and progression
- Same profession system (rebalanced to feel different in Outbreak)
- Same harvest system (chopping/mining)
- Same save/load
- Same UI structure (until we ship Mission A: D2 HUD)

### Changes
- **Hunger drain:** 0.15/tick → 0.04/tick (just over 1/4 the rate)
- **Warmth drain:** -0.3/tick baseline → -0.08/tick baseline (also ~1/4)
- **Night = active threat phase:** zombies spawn at sunset, attack until dawn
- **Win condition:** "Survive 30 days" becomes "Survive 30 nights"
- **Day banner:** changes to "NIGHT N — [horde type]" at sundown
- **Starting position:** plane wreckage near (within ~5 tiles of) the military outpost area

### New
- Zombie enemy types (start with one: shambler. Add brute, runner, screamer later.)
- Wave system: number of zombies scales with night number
- Military outpost zone on the map
- Possibly: ammo as a tracked resource (rifle uses bullets, bow uses arrows)
- Possibly: NPC survivors you can find and recruit

### Removed or reduced
- Daily events about cold-themed mechanics (cold snap, blizzard warning) become rarer or replaced with horde-themed events (big horde tonight, fast zombies, screamer spotted, etc.)
- "Frozen carcass" event doesn't really fit — replaced with "weapon cache" or "ammo cache" events

## Map expansion (applies to both modes)

The current 60×45 tile map becomes 120×90 (4× the area). Render system already only draws visible tiles, so larger maps don't hurt performance.

### New base-friendly locations

Each is a distinct strategic option for the player. **No location is strictly best.** Different playstyles favor different spots.

1. **The Military Outpost** — Partially destroyed structures, sandbag walls, watchtower. Loot-rich starting point but exposed to multiple attack angles. Best for action-focused players who can defend a wider perimeter.

2. **The Hangar + Cargo Plane** — Large enclosed structure with a downed cargo plane outside. Pre-existing walls, limited access points. Good for "fortress" builders.

3. **The Tree Crescent** — Natural enclosed area in the forest. Lower-tech, more camouflaged. Good for hunters who want to live off the land while still having defensible cover.

4. **The Cave System** — Expanded from a single tile to a 5×4 (or similar) interior space. One or two entrances. Strongest defensive position but isolated from resources. May start with the bear inside as a one-time clearing fight.

5. **The Frozen Lake Cabin** — Small structure at the lake edge. Mediocre defenses but excellent fishing/hunting access. Trade defense for resource access.

6. **The Boulder Maze** — Expanded boulder field. Natural stone walls plus a stone-rich environment. "Stone fortress" potential.

7. **The Hilltop** — High ground with great visibility. Easy to spot threats but open on multiple sides. Risk/reward base option.

8. **The Crash Site** — Where the player starts. Worst defensive position but the path of least resistance. Some players will choose to live where they fell.

### Cave interior specifically

The cave is no longer a single tile. It becomes an interior space that:
- Has one or two entrances (defensible chokepoints)
- Negates warmth drain inside (in Wilderness Mode this matters; in Outbreak it's nice but less central)
- Has limited buildable space (forces compact base design)
- May contain initial threats (bear, or in Outbreak: a small zombie nest to clear)
- Provides natural stone walls that can't be broken

## Animals in Outbreak Mode

Same animal ecosystem as Wilderness Mode. Wolves, bears, deer, boars, etc. all exist alongside zombies. This:
- Keeps the world feeling alive
- Keeps the Hunter playstyle viable (you can still survive by hunting deer)
- Avoids breaking existing code
- Adds tactical variety (a wolf during the day is a different problem than a zombie at night)

## Blood Moon (the future game)

Blood Moon is **not part of Winter's Edge**. It's a separate future project that will share systems with Winter's Edge but stand on its own.

### Key differences from Winter's Edge Outbreak Mode

- **Multiplayer** (4-10 players) instead of single-player
- **Werewolf** instead of zombies — one player is the antagonist, hidden role
- **Medieval theme** instead of crash-survivor
- **Outpost town** as the starting point (NPCs, structure, but everyone is locked out of the kingdom)
- **Social deduction** layered on top of survival — accusations, votes, exile
- **Werewolf can spawn minions** (twisted versions of villagers? Wolves they control?)
- **Multiple win conditions** for different roles

### Status

Concept only. Will be revisited after Winter's Edge ships. Requires server infrastructure (likely Supabase) that doesn't currently exist.

See `docs/modes/blood-moon.md` for the full concept.

## Naming

The project name stays **Winter's Edge** for now. The repo, the title, the brand. We may revisit naming when the game gets closer to shipping. Outbreak Mode and Wilderness Mode are subtitles, not separate identities.

## What this means for the next sessions

In order:

1. **Ship the animal attack throttle bug fix** (queued as `00-bugfix-animal-attack-throttle.md`)
2. **Update the start screen** to offer Mode → Scenario two-step selection
3. **Ship the first Outbreak Mode bundle:** basic zombie enemy, night spawn waves, night counter UI, win condition change to "Survive 30 nights"
4. **Expand the map** (120×90) and add the new named locations (military outpost, cave interior, hangar, etc.)
5. **Iterate from there** — zombie variety, defensive structures, ammo system, NPC survivors

The existing prompt queue (interaction overhaul, Mission A/B/C, profession abilities) all still apply but get sequenced behind the core mode work.

## What we're committing to

This is the project. Not a vague survival game. Specifically:

**Winter's Edge: A single-player game where you crash near a military outpost, scavenge weapons, build a fortress, and survive 30 nights against zombie hordes — OR opt for Wilderness Mode and face a different kind of survival entirely.**

That's a Steam page. That's a one-sentence pitch. That's a finishable game.
