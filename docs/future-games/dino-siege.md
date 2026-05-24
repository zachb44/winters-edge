# Dino Siege — Future Game Concept (Working Title)

A standalone survival/base-building game. Shares design DNA with Winter's Edge but is its own project.

## Status

**Early concept.** Nothing built. This is the furthest out of the three game ideas.

## Origin

Based on a Warcraft 3 custom game mode — base defense against waves of dinosaurs. Never produced as a standalone game.

## One-line pitch

**Build a fortified camp in a prehistoric wilderness and survive escalating waves of dinosaur attacks.**

## Core fantasy

You're stranded in a world where dinosaurs are the apex threat. During the day you gather resources, build walls, set traps, and craft weapons. At night (or on a timer), waves of increasingly dangerous dinosaurs attack your base. Survive long enough to escape — or don't.

## What makes it different from Winter's Edge

| | Winter's Edge | Dino Siege |
|---|---|---|
| **Threat** | Zombies (Outbreak) / Nature (Wilderness) | Dinosaurs |
| **Setting** | Frozen military crash site | Prehistoric jungle/volcanic landscape |
| **Tone** | Dread, isolation, cold | Adrenaline, spectacle, primal danger |
| **Enemy variety** | Shambler + future variants | Raptors, T-Rex, Pterodactyls, Triceratops, etc. |
| **Scale of threat** | Horde quantity | Individual dinosaurs can be boss-tier |
| **Base building emphasis** | Medium (walls, traps, barricades) | High (fortress construction is the core loop) |

## Core gameplay loop

### Day phase
- Gather resources (wood, stone, metal, hide)
- Build and upgrade fortifications (walls, gates, towers, spike pits)
- Craft weapons and traps
- Scout the surrounding area for resource nodes and dinosaur nests
- Repair damage from the previous night

### Night phase (or wave trigger)
- Dinosaur waves attack from one or more directions
- Small dinos (raptors) come in packs — fast, flanking, break through weak points
- Large dinos (T-Rex, Triceratops) are slow but devastate structures
- Flying dinos (Pterodactyls) bypass ground walls entirely
- Player defends with placed weapons, traps, and personal combat

### Escalation
- Night 1: small raptor pack
- Night 10: mixed raptors + larger herbivore stampede
- Night 20: T-Rex appears as a boss-tier threat
- Night 30: full extinction-level assault
- Each night the composition and aggression scales

## Dinosaur types (concept)

### Pack hunters
- **Raptor** — fast, low HP, attacks in groups of 3-8. Flanks. The shambler equivalent.
- **Compy** — tiny, swarm enemy. Individually weak, dangerous in numbers. Gets through small gaps.

### Heavy hitters
- **Triceratops** — charges walls, massive structural damage, moderate HP. Predictable path.
- **T-Rex** — boss-tier. Enormous HP, destroys anything in its path. Appears on later nights.
- **Ankylosaurus** — armored, slow, high damage to structures. Hard to kill without heavy weapons.

### Aerial threats
- **Pterodactyl** — flies over walls, swoops at the player. Forces anti-air solutions (towers, ranged weapons).
- **Quetzalcoatlus** — larger flyer, can grab and drop the player. Rare, terrifying.

### Special
- **Dilophosaurus** — spits venom (area denial, vision impairment). Forces repositioning.
- **Stampede event** — herbivore herd (stegosaurus, parasaurs) panics and runs through your base. Not hostile, just destructive.

## Base building (the core differentiator)

This game leans harder into base construction than Winter's Edge:
- Multiple wall tiers (wood → stone → reinforced → metal)
- Gates that open/close
- Watchtowers with mounted weapons
- Spike pits and trap corridors
- Resource storage that must be defended
- Repair stations
- Kill zones (funneling dinos through choke points)

The strategic puzzle is: where do you build, how do you funnel threats, and what do you prioritize repairing?

## Profession / class ideas

- **Engineer** — builds faster, unlocks advanced structures
- **Trapper** — specializes in traps, nets, pit construction
- **Ranger** — ranged combat specialist, scouting bonus
- **Tamer** — can domesticate small dinosaurs (future system — mount/companion)
- **Medic** — healing, stamina buffs (shared with Winter's Edge DNA)

## Perspective

Open question. Options:
- **Top-down 2D** — same as Winter's Edge, fastest to build, proven workflow
- **Isometric** — more visual depth, still 2D art pipeline
- **Third-person 3D** — most immersive, biggest scope jump, requires a 3D engine + models + animations

Decision deferred until build time. The gameplay loop works regardless of camera angle.

## Multiplayer potential

Could work as:
- **Solo** (like Winter's Edge Outbreak Mode)
- **Co-op 2-4 players** (shared base, divided responsibilities — one builds while another scouts)
- **Competitive** (separate bases, shared dinosaur threat, race to survive longest)

## Shared systems from Winter's Edge

If built on the same foundation:
- Day/night cycle
- Resource gathering + inventory
- Building placement + construction time
- Wave spawning + escalation
- Combat system (adapted for ranged + melee)
- Crafting (workbench recipes)
- Profession/class framework
- Save/load architecture

## What's genuinely new

- Dinosaur AI (pack behavior, charging, flying, stampedes)
- Structural damage model (walls have HP tiers, directional attacks)
- Anti-air defense systems
- Potentially: 3D rendering if perspective shifts
- Potentially: co-op multiplayer

## Engineering scope (honest)

Depends entirely on perspective choice:
- **Top-down 2D:** Moderate. Reuses Winter's Edge architecture. New art, new enemy types, heavier base-building. Achievable solo.
- **Isometric:** Moderate-hard. New rendering approach but still 2D assets. Achievable solo with more time.
- **Third-person 3D:** Hard. Requires Unreal/Unity/Godot 3D, 3D models, animations, camera systems. Likely needs a collaborator or significant art budget.

## When to revisit

After:
1. Winter's Edge ships
2. Blood Moon is at least prototyped
3. There's clarity on whether to stay 2D or move to 3D

This is the most ambitious of the three concepts. Park it, capture ideas as they come, build it last.
