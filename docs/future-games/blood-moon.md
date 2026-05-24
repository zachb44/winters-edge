# Blood Moon — Future Game Concept

A standalone multiplayer game sharing design DNA with Winter's Edge.

## Status

**Concept only.** Nothing built. This ships after Winter's Edge.

## Origin

Based on a Warcraft 3 custom game mode — werewolf survival with hidden roles. Never produced as a standalone game.

## One-line pitch

**A group of villagers is locked outside the kingdom during a blood moon. One of them is a werewolf. Survive 30 nights — or figure out who's hunting you before it's too late.**

## Premise

4-10 players spawn as villagers at a medieval outpost during a month-long blood moon. They must survive 30 nights together. One (or two, in larger groups) is secretly a werewolf who kills villagers each night.

Villagers don't know who the werewolf is. The werewolf doesn't know which villagers might be hunters trying to expose them.

## Setting

Medieval-themed. Cobblestone outpost with surrounding wilderness — forests, rivers, an abandoned mercenary shop. Day/night cycle with a permanent crimson tint at night.

## Core gameplay

### Shared with Winter's Edge
- Day/night cycle
- Resource gathering
- Base building
- Hunger/warmth/HP management
- Random daily events

### New to Blood Moon
- **Multiplayer** (4-10 players in a shared session)
- **Hidden roles** (1-2 werewolves, server-side — not in client memory)
- **Voice/text chat** (external via Discord is fine; the real game happens in conversation)
- **Day phase debate** + voting mechanics
- **Night phase action** — werewolf hunts, villagers shelter
- **Mercenary NPC system** — hire help with shared resources

## Lifestyles (career paths)

Players pick a focus affecting starting equipment and skill bonuses:

- **Hunter** — tracks animals, can identify unusual tracks (werewolf clues)
- **Farmer** — grows food, supports group food supply
- **Fisher** — riverside food source, steady income
- **Builder** — constructs defenses, walls, towers, watch posts
- **Merchant** — finds and hires NPC mercenaries, manages group resources
- **Watchman** — patrols at night, can spot suspicious activity

## Day phase

- All players awake
- Build, gather, farm, fish, hunt
- Debate who might be the werewolf
- Optional: vote to exile a suspect (loses them as a resource even if innocent)
- Lock doors at sunset

## Night phase

- Werewolf transforms (visible only to themselves)
- Werewolf can move silently, kill one villager per night
- Villagers sleep in shelters (locked doors slow the werewolf)
- Watchman role can patrol — sees movement but not identities
- Daybreak reveals any deaths

## Werewolf mechanics

- Hidden identity (server-side, anti-cheat critical)
- Transform freely between human and werewolf form at night
- Werewolf form has boosted stats but is recognizable if spotted
- Killing leaves traces (tracks, missing player, witnesses)
- Can secretly recruit a loyal villager via a one-time "bite" that doesn't kill
- Wins by killing villagers down to critical mass

## Villager mechanics

- All start as villagers
- Win by surviving to day 30 OR correctly identifying + exiling the werewolf
- Can lock doors, build defenses, post watchmen
- Can hire mercenaries (with shared resources)
- Can vote to exile a player (loses them even if wrong)
- Mid-game wildcard: a villager could secretly help the werewolf in exchange for being spared

## Mercenary NPCs

- Found at a mercenary shop in the wilderness
- Hire for in-game currency (gold or trade goods)
- Help with gathering, defense, or hunting suspects
- Cost resources to feed
- Can be killed by werewolves at night
- Can act as decoys/scouts

## Asymmetric balance

The whole game rises and falls on whether the werewolf can plausibly hide AND the villagers can plausibly catch them. Key challenges:
- Werewolf shouldn't always win
- Villagers shouldn't always win
- Voting needs evidence systems, not just gut reads
- 2-werewolf mode (larger groups) needs separate balance

## Why this is a strong concept

Combines three proven game patterns that no widely known game blends together:
1. Social deduction (Werewolf, Among Us, Town of Salem)
2. Co-op survival (Don't Starve Together, Valheim, Project Zomboid)
3. Medieval/fantasy aesthetic (broader appeal)

## Engineering scope (honest)

Far harder than Winter's Edge:
- **Server infrastructure** — Supabase or similar. Real-time sync, room management, auth.
- **Anti-cheat** — werewolf identity can't leak through dev tools
- **Asset overhaul** — medieval art, different visual identity from Winter's Edge
- **Game design balance** — asymmetric games are notoriously hard to balance

## When to revisit

After:
1. Winter's Edge ships on itch.io
2. A multiplayer prototype exists (probably co-op Winter's Edge first)
3. Real player feedback validates the survival gameplay works

Until then: capture ideas here, don't start building.
