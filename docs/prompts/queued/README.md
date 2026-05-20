# Prompt Queue

Seed prompts for Claude Code sessions. Each file is a self-contained task prompt. Paste it into Claude Code pointed at the `zachb44/winters-edge` repo.

## How to use

1. Pick the next numbered prompt
2. Paste the full contents into a Claude Code session
3. Claude Code reads the repo, proposes a plan, waits for your go-ahead, then implements
4. After completion, move the prompt to `docs/prompts/completed/` and update `docs/ROADMAP.md`

## Current queue

### Phase 1 — Outbreak Mode core
| # | File | Description | Dependencies |
|---|---|---|---|
| 01 | `01-mode-selection.md` | Mode selection in character creation | None — run first |
| 02 | `02-shambler-zombie.md` | Zombie entity + AI + combat | 01 |
| 03 | `03-wave-spawner.md` | Night waves + night counter + win condition | 01, 02 |
| 04 | `04-vitals-rebalance.md` | Outbreak hunger/warmth to 1/4 rate | 01 |
| 05 | `05-military-outpost.md` | Outpost zone on current map | 01 |
| 06 | `06-map-expansion.md` | 120×90 map + all 8 named locations | 05 |

### Phase 2 — Gameplay depth
| # | File | Description | Dependencies |
|---|---|---|---|
| 10 | `10-outbreak-events.md` | Horde-themed daily events | 01, 03 |
| 11 | `11-defensive-structures.md` | Barricades, walls, spike traps | 02, 03 |
| 12 | `12-profession-abilities.md` | 18 abilities across 6 professions | None |
| 13 | `13-interaction-overhaul.md` | 5 UX improvements (lethality, corpses, menus) | Review vs pivot |

### Phase 3 — HUD + UX overhaul
| # | File | Description | Dependencies |
|---|---|---|---|
| 07 | `07-mission-a-d2-hud.md` | D2-style bottom HUD with orbs | None |
| 08 | `08-mission-b-clock-dial.md` | WC3 day/night dial | 07 |
| 09 | `09-mission-c-workbench-crafting.md` | Workbench crafting menu | 07 |

## Running multiple seeds in one session

Seeds within the same phase are designed to work together. You can often run 2-3 in a single Claude Code session:
- **01 + 04** — mode selection + vitals rebalance (both small, no conflicts)
- **02 + 03** — zombie entity + wave spawner (03 depends on 02, but can run sequentially)
- **10 + 11** — outbreak events + defensive structures (independent of each other)
- **07 + 08 + 09** — all three HUD missions (08 and 09 depend on 07)

Don't cross phases in a single session. Finish Phase 1 before starting Phase 2.

## Completed prompts

See `docs/prompts/completed/` for prompts that have been executed.
