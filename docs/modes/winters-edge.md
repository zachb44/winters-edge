# Winter's Edge — Game Design Doc

The current game mode. Single-player winter survival.

## Premise

You are the sole survivor of a plane crash in a subarctic tundra. You have 30 days until a rescue chopper can reach you (or until you reach a distant radio tower, depending on scenario). Manage warmth, hunger, and the wilderness or die.

## Core gameplay loop

1. **Gather** — chop wood, mine stone, hunt animals, loot wreckage
2. **Build** — shelter, fire, traps, storage
3. **Manage** — warmth (fire), hunger (food), stamina (rest), health (avoid injury)
4. **Survive** — endure weather, animals, daily random events
5. **Progress** — gain XP, level up, choose stat upgrades, unlock crafting recipes
6. **Win** — reach day 30 or the radio tower

## Scenarios

### Wait for Rescue (Medium)
- Survive 30 in-game days
- Rescue helicopter arrives at day 30
- Classic test of endurance

### Reach the Radio Tower (Medium-Hard)
- Gather 10 food, 5 wood, keep your coat
- Trek to the radio tower in the far corner of the map
- Activate the radio to call for help
- Forces real exploration

## Map zones

60×45 tile map with distinct biomes:

- **Central Tundra** — open snow, scattered trees and rocks (starting area)
- **Tree Crescent** (top right) — dense forest, deer territory
- **Frozen Lake + River** (left-center) — seal hunting, ice fishing potential
- **Boulder Field** (bottom center) — stone-rich, boars live here
- **Cave Hill** (bottom right) — territorial bear lives here
- **Deep Wilderness** (top left) — extra trees, isolated cabin

## Crash sites (5 random possible)

- Central Tundra
- Near the Lake
- Eastern Plains
- South Tundra
- Northern Reach

## Vitals

- **HP** — kills you at 0. Drains from cold/hunger/combat.
- **Warmth** — drains over time, faster at night/blizzards. Below 20 starts draining HP.
- **Hunger** — drains slowly. Below 15 starts draining HP.
- **Stamina** — depletes from actions. Recovers when resting.

## Weather

- **Clear** — baseline
- **Snow** — light cosmetic, mild warmth drain
- **Blizzard** — heavy warmth drain, reduced vision

## Day/night cycle

~5 minutes per in-game day at 1x speed. Vitals drain faster at night. Wolves more aggressive at night. Bears unchanged.

## Win/lose conditions

- **Win:** Reach day 30 (Rescue) OR reach radio tower with supplies (Tower)
- **Lose:** HP reaches 0. Death cause is logged: frozen, starved, mauled, etc.

## Onboarding

- 2-step setup: scenario select → character creation
- Intro overlay on game start with crash narrative + 3 tips
- Tile tooltips on hover
- Day banners on new days
- Vitals warnings (FREEZING, STARVING, INJURED)
- Predator alerts (wolf nearby, BEAR NEARBY — RUN)
- Safe first night

## Save/load

- Auto-saves on day change, death, win, and every 60 seconds
- Manual "Save & Quit" button
- Continue Run button on startup if save exists
- Save migration handles older save formats gracefully
