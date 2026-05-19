# Blood Moon — Future Concept (Not Built)

A potential **Game 2** sharing systems with Winter's Edge but standing on its own.

## Status

**Concept only.** Nothing built. Documented here so the vision isn't lost.

## Premise

A group of 4-10 villagers is locked out of the kingdom during a month-long blood moon. They must survive 30 nights in an old outpost. One (or two) is secretly a werewolf, killing villagers each night.

Villagers don't know who the werewolf is. The werewolf doesn't know which villagers might be loyal helpers vs. hunters trying to expose them.

## Setting

Medieval-themed. Cobblestone outpost. Surrounding wilderness with forests, rivers, an abandoned mercenary shop. Day/night cycle with a permanent crimson tint at night.

## Core gameplay

Shared with Winter's Edge:
- Day/night cycle
- Resource gathering
- Base building
- Hunger/warmth/HP management
- Random daily events

New to Blood Moon:
- Multiplayer (4-10 players in a shared session)
- Hidden roles (1-2 werewolves)
- Voice/text chat
- Day phase debate, night phase action
- Voting mechanics
- Mercenary NPC system

## Lifestyles (career paths)

Players pick a focus that affects starting equipment and skill bonuses:

- **Hunter** — tracks animals, can identify "unusual" tracks (werewolf clues)
- **Farmer** — grows food, supports the group's food supply
- **Fisher** — riverside food source, gentle income
- **Builder** — constructs defenses, walls, towers, watch posts
- **Merchant** — finds and hires NPC mercenaries, manages group resources
- **Watchman** — patrols at night, can spot suspicious activity

## Day phase

- All players awake
- Build, gather, farm, fish, hunt
- Debate who might be the werewolf
- Optional: vote to exile a suspect (loses them as resource even if innocent)
- Lock doors at sunset

## Night phase

- Werewolf transforms (visible to themselves only)
- Werewolf can move silently, kill one villager per night
- Villagers sleep in their shelters (locked doors slow the werewolf)
- Watchman role can patrol — sees movement but not identities
- Daybreak reveals any deaths

## Werewolf mechanics

- Hidden identity (server-side, not in client memory)
- Can transform freely between human and werewolf form at night
- Werewolf form has +stats but is recognizable
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

- Found at a mercenary shop somewhere in the wilderness
- Hire for in-game currency (gold or trade goods)
- Help with gathering, defense, or even hunting suspects
- Cost resources to feed
- Can be killed by werewolves at night
- Can act as decoys / scouts

## Asymmetric balance

The whole game rises and falls on whether:
- The werewolf can plausibly hide
- The villagers can plausibly catch them

Key design challenges:
- Werewolf shouldn't always win
- Villagers shouldn't always win
- Voting shouldn't be "who looks shifty" — needs evidence systems
- 2-werewolf mode (larger groups) needs separate balance

## Why this is a strong concept

Combines three proven game patterns:
1. Social deduction (Werewolf, Among Us, Town of Salem)
2. Co-op survival (Don't Starve Together, Valheim, Project Zomboid)
3. Medieval/fantasy aesthetic (broader appeal than frozen wilderness)

No widely known game blends these three. Real concept.

## Engineering scope (honest)

Far harder than Winter's Edge:

- **Server infrastructure** — Supabase or similar. Real-time sync, room management, auth.
- **Anti-cheat** — werewolf identity can't leak through dev tools
- **Voice chat** — externally (Discord) is fine; the *real* werewolf game happens in conversation
- **Asset overhaul** — medieval art, not winter art. Different visual identity.
- **Game design balance** — asymmetric games are notoriously hard to balance

## Realistic timeline

As a standalone game built after Winter's Edge ships:
- **6-18 months** of part-time work
- Probably needs a small art/sound budget ($500-2000) if not built solo
- Could potentially crowdfund (Kickstarter) if the concept lands

## When to revisit

After:
1. Winter's Edge is shipped on itch.io (or similar)
2. A multiplayer prototype exists (probably co-op Winter's Edge first)
3. Real player feedback validates the survival gameplay works

Until then: keep this doc updated as ideas come, but don't start building.
