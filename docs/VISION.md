# Vision — Winter's Edge

Winter's Edge is a single-player survival game with two distinct modes sharing one engine. You crash in a frozen wilderness. What happens next depends on which world you chose.

## The one-line pitch

**Crash near a military outpost, scavenge weapons, build a fortress, and survive 30 nights against zombie hordes — OR opt for Wilderness Mode and face a different kind of survival entirely.**

That's a Steam page. That's a finishable game.

---

## The two modes

### Wilderness Mode

**The fantasy:** You crashed in a frozen wilderness. The cold is hunting you. Every decision matters because the world doesn't care if you live.

- Hunger + warmth are the antagonists — they will kill you
- Wildlife is the threat (bears, wolves, boars)
- Slow-burn, contemplative pacing
- Win by surviving 30 days for rescue OR reaching the radio tower
- Tone: *The Long Dark*, *Don't Starve* — atmospheric, lonely, dread-filled

This is essentially what the game already is. Most existing systems support this mode unchanged.

### Outbreak Mode

**The fantasy:** You crashed near a military outpost in the wilderness. Lucky — there's weapons. Unlucky — the dead are walking, and they come at night.

- Hunger + warmth dialed to ~1/4 drain rate — background flavor, not threats
- Zombies are the central antagonist
- Day = gather, build, scout, prepare. Night = defend.
- Combat and fortification are the core test
- Animals still exist (full ecosystem) — hunters can still live off the land
- Win by surviving 30 nights OR reaching the radio tower for evacuation
- Tone: *State of Decay*, *They Are Billions*, *7 Days to Die* — action-survival, fortress building, escalating waves

**Why two modes instead of one that does everything:** Games that try to balance hunger/cold management AND zombie combat simultaneously end up shallow at both. *7 Days to Die* is the cautionary tale. By separating the systems per mode, each mode tests the player on something specific.

---

## The map — 120×90 tiles (4× current)

The current 60×45 map expands to 120×90. The render system already only draws visible tiles, so map size doesn't hurt performance. The larger map creates real base-location strategy — where you settle matters.

### Base-friendly locations

Each has tradeoffs. No location is strictly best. Different playstyles favor different spots.

1. **The Military Outpost** — Partially destroyed structures, sandbag walls, watchtower. Loot-rich but exposed to multiple attack angles. Best for action players who can defend a wide perimeter.

2. **The Hangar + Cargo Plane** — Large enclosed structure with a downed cargo plane outside. Pre-existing walls, limited access points. Good for "fortress" builders.

3. **The Tree Crescent** — Natural enclosed area in the forest. Lower-tech, more camouflaged. Good for hunters who want to live off the land with defensible cover.

4. **The Cave System** — Expanded from a single tile to a ~5×4 interior space. One or two entrances. Strongest defensive position but isolated from resources. May start with the bear inside as a one-time clearing fight. Negates warmth drain inside.

5. **The Frozen Lake Cabin** — Small structure at the lake edge. Mediocre defenses but excellent fishing/hunting access. Trade defense for resource access.

6. **The Boulder Maze** — Expanded boulder field. Natural stone walls plus stone-rich environment. "Stone fortress" potential.

7. **The Hilltop** — High ground with great visibility. Easy to spot threats but open on multiple sides. Risk/reward base option.

8. **The Crash Site** — Where the player starts. Worst defensive position but the path of least resistance. Some players will choose to live where they fell.

This is what makes runs different. "This run I tried to claim the cave on day 2 but the bear killed me." "This run I built up at the hangar and held it for 20 nights." Stories.

---

## Environmental storytelling

The military outpost does multiple jobs at once without requiring dialogue or cutscenes:

- Justifies weapon abundance — you're looting an armory, not finding 5 random rifles
- Creates a place, not just a tile — multiple buildings, hangars, supply crates, watch towers
- Narrative texture — bullet holes in walls, abandoned tents, a half-built barricade. Players invent the story: "What happened here?"
- Sets up future NPCs for free — the outpost might have survivors hiding, OR signs of people who died (notes, journals). The world supports them when we're ready to build them.
- Justifies the cargo plane near a hangar — establishes scale. This was an active site. Now it's not. Why?

---

## Full realization — where this goes

None of this is committed. It's the north star, not the next sprint.

### Camera + view
- Smooth-scrolling camera (replace tile-snap with glide)
- Aspirational: 3/4 perspective like *Stardew Valley* or *Hyper Light Drifter*
- Far future: 3D over-the-shoulder like Valheim (requires engine swap — realistic only as a full-time hobby decision)

### Creatures
- 15-20+ creature types with distinct purposes
- Mountain lions, foxes, hawks, wolverines, lynx, elk, moose, owls, snowshoe hares, river otters
- Every creature has clear role: food source, threat, harvestable for unique materials, neutral
- Boss-tier creatures beyond the bear
- In Outbreak Mode: zombie variants (shambler, brute, runner, screamer)

### Progression
- Full skill trees per profession (30+ nodes each)
- Active abilities tied to class identity
- Career paths that branch (Hunter: trapping vs. archery vs. tracking)

### Base building
- Multiple tiers of walls (wood, stone, reinforced)
- Gates, towers, watch posts
- Storage, animal pens, gardens, smokehouses, wells
- Workshops (forge, tannery, kitchen)
- Trap variants
- In Outbreak Mode: barricades, sandbag walls, spike pits, turret emplacements

### Audio
- Ambient wind, footsteps, fire crackling
- Wolf howls, combat sounds
- Atmospheric music tracks
- In Outbreak Mode: zombie groans, horde approach audio cues

### Sprite art
- Hand-drawn pixel art replacing emoji
- Proper character sprites with walk/run/attack cycles
- Animal and zombie sprites with idle/movement/attack animations
- Polished tile art for terrain blending

### Shipping target
Free or low-cost release on itch.io. Eventually maybe Steam if it earns it. The point is *finishing*.

---

## Blood Moon — the future game

Blood Moon is NOT part of Winter's Edge. It's a separate future project that shares systems but stands on its own.

- Multiplayer (4-10 players) instead of single-player
- Werewolf instead of zombies — one player is the hidden antagonist
- Medieval theme, outpost town setting
- Social deduction layered on survival — accusations, votes, exile
- Combines *Werewolf/Among Us* + *Don't Starve Together/Valheim* + medieval aesthetic

Concept only. Revisit after Winter's Edge ships. Requires server infrastructure (likely Supabase). See `docs/modes/blood-moon.md` for the full concept.

---

## Phasing

**Phase 1 — Outbreak Mode core (current)**
- Mode selection screen
- Basic zombie enemy + wave system
- Night counter + win condition
- Map expansion (120×90) + named locations
- Defensive structures

**Phase 2 — Polish both modes (3-6 months)**
- Profession abilities + skill trees
- HUD overhaul (D2-style orbs, day/night dial)
- Workbench crafting hub
- Smooth-scrolling camera
- Audio

**Phase 3 — Art + ship (6-12 months)**
- Sprite art swap
- Multiple biomes
- Balance pass across both modes
- Itch.io release

**Phase 4 — Blood Moon (12+ months)**
- Separate project, medieval art, multiplayer engineering
- Borrow systems from Winter's Edge

---

## What to remember

Dreaming keeps side projects alive when day jobs get hard. Just don't let dreaming substitute for shipping.

This game stopped being a sandbox of features and became a game with a vision. Most indie projects never get here. Don't lose that.
