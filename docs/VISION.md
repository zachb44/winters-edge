# Vision — The Long-Term Dream

This is where Winter's Edge could go if pursued seriously. None of this is committed. It's the north star, not the next sprint.

## Winter's Edge: the full realization

The single-player game, fully built out.

### Camera + view
- Smooth-scrolling camera that follows the player character (not tile-snap)
- Possibly later: 3/4 perspective like *Stardew Valley* or *Hyper Light Drifter*
- Aspirational: third-person 3D over-the-shoulder like Valheim — but that would require a full engine swap (Unity/Unreal/Godot) and effectively starting over. Realistic only as a "this is my full-time hobby" decision.

### World
- Much larger map (200×200+ instead of 60×45)
- Multiple **biomes** — frozen tundra, dense forest, mountain caves, frozen lakes, plains, rocky hills
- Each biome has unique terrain, creatures, resources, and dangers
- Real exploration as a game pillar

### Creatures
- 15-20+ creature types, each with distinct purpose
- Mountain lions, foxes, hawks, wolverines, lynx, elk, moose, owls, snowshoe hares, river otters, etc.
- Every creature has clear role: food source, threat, harvestable for unique materials, neutral
- Boss-tier creatures beyond the bear

### Progression
- Full **skill trees** per profession (30+ nodes each)
- Active abilities tied to class identity (not just passive stat bonuses)
- Career paths that branch — a Hunter could specialize in trapping vs. archery vs. tracking

### Base building
- Multiple tiers of walls (wood, stone, reinforced)
- Gates, towers, watch posts
- Storage with locks
- Animal pens, gardens, smokehouses, wells
- Workshops with specific functions (forge, tannery, kitchen)
- Trap variants
- Signs for navigation

### Audio
- Ambient wind, footsteps, fire crackling
- Wolf howls in the distance
- Combat sounds (swings, hits, animal cries)
- A few atmospheric music tracks

### Sprite art
- Hand-drawn pixel art replacing emoji
- Proper character sprites with walk/run/attack cycles
- Animal sprites with idle and movement animations
- Polished tile art for terrain blending

### Shipping target
Free or low-cost release on itch.io. Eventually maybe Steam if it earns it. The point is *finishing* — most game projects die in pre-alpha.

---

## Blood Moon: the multiplayer werewolf mode

A potential **Game 2**, sharing systems with Winter's Edge but standing on its own.

### Concept

Medieval-themed survival with a hidden role. A group of villagers is locked out of the kingdom during a month-long blood moon. They must survive 30 nights in an old outpost. One (or two) of them is secretly a werewolf, killing villagers each night.

### Mechanics

- **Group of 4-10 players** drop into a shared map
- **One player is secretly the werewolf** (two for larger groups)
- **30 in-game days** to survive
- Villagers wake up each morning to discover any new deaths
- Day phase: build, gather, farm, hunt, fish, debate, accuse, vote
- Night phase: werewolf transforms and hunts, villagers shelter or band together

### Lifestyles / careers
- Hunter — tracks animals, can identify "unusual" tracks (werewolf clues)
- Farmer — grows food, supports the group's food supply
- Fisher — riverside food source
- Builder — constructs defenses, walls, towers
- Mercenary recruiter — finds NPC mercenaries in the wilderness, hires for help

### Social mechanics
- Voice chat externally (Discord) — the *real* werewolf game happens in conversation
- In-game evidence (tracks, missed appointments, suspicious behavior)
- Lock doors, witness mechanics, alibi systems
- Vote to exile a suspect (loses them as a resource even if they're innocent)

### Asymmetric play
- **Werewolf wins by** killing villagers down to a critical mass
- **Villagers win by** surviving to day 30 OR correctly identifying and exiling the werewolf
- **Wildcard:** a villager could secretly *help* the werewolf in exchange for sparing them — built-in betrayal

### Mercenary NPCs
- Find a mercenary shop in the wilderness
- Hire NPCs to help with gathering, defense, or even hunting suspects
- Costs precious resources to keep them fed
- Werewolves can kill mercenaries to thin help

### Why this is a strong idea

Combines three proven game patterns:
1. **Social deduction** (Werewolf, Among Us, Town of Salem)
2. **Co-op survival** (Don't Starve Together, Valheim, Project Zomboid)
3. **Medieval/fantasy aesthetic** — broader appeal than frozen wilderness

I've not seen these three blended this way. Real game concept.

### Why it's much harder than Winter's Edge

- **Multiplayer infrastructure** — server, database, real-time sync. Supabase would be the foundation.
- **Anti-cheat** — werewolf identity can't leak through dev tools
- **Game design balance** — asymmetric games rise/fall on whether either side can plausibly win
- **Different aesthetic** — medieval art assets, not winter survival art

### Realistic timeline

Blood Moon as its own polished game = 6-18 months part-time, building on Winter's Edge systems but with a separate art style and the multiplayer engineering layer.

---

## The honest reality check

What's described above is **$100k-$500k of indie game studio work** if hired out. *Stardew Valley* took 4 years solo and is the gold standard for solo passion projects.

This isn't discouraging — it's calibrating. The path forward:

1. **Don't burn out trying to build everything at once**
2. **Pick what excites you this month, ship it**
3. **Look back every 3 months and see what actually got done**
4. **Most game projects die because the dev tries to build the whole vision at once.** The ones that ship pick small slices.

## Suggested phasing

**Phase 1 (3-6 months part-time):** Winter's Edge to "real" status
- Profession abilities + skill trees
- Smooth-scrolling camera
- Audio
- Sprite art swap
- Polish, test, ship on itch.io

**Phase 2 (1-2 months):** Multiplayer prototype
- Add Supabase
- 2-player co-op in Winter's Edge (no werewolf yet)
- Test syncing, lag, shared base mechanics

**Phase 3 (6-12 months):** Blood Moon as separate game
- New project, medieval art, werewolf design
- Borrow systems from Winter's Edge
- Asymmetric roles, voting, evidence, mercenaries

**Total realistic time to both games:** 18-24 months part-time.

## What to remember

Dreaming keeps side projects alive when day jobs get hard. **Just don't let dreaming substitute for shipping.**
