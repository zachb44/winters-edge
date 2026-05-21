# Prompt Queue

Seed prompts for Claude Code sessions. Each file is a self-contained task prompt. Paste it into Claude Code pointed at the `zachb44/winters-edge` repo.

## How to use

1. Pick the next numbered prompt
2. Paste the full contents into a Claude Code session
3. Claude Code reads the repo, proposes a plan, waits for your go-ahead, then implements
4. After completion, move the prompt to `docs/prompts/completed/` and update `docs/ROADMAP.md`

## Current queue

### Phase 2 — Gameplay depth
| # | File | Description | Dependencies |
|---|---|---|---|
| 10 | `10-outbreak-events.md` | Horde-themed daily events | 01, 03 |
| 11 | `11-defensive-structures.md` | Barricades, walls, spike traps + building-blocks-movement fix | 02, 03 |
| 12 | `12-profession-abilities.md` | 18 abilities across 6 professions | None |
| 13 | `13-interaction-overhaul.md` | 5 UX improvements (lethality, corpses, menus) | Review vs pivot |

### Phase 3 — HUD + UX overhaul
| # | File | Description | Dependencies |
|---|---|---|---|
| 07 | `07-mission-a-d2-hud.md` | D2-style bottom HUD with orbs | None |
| 08 | `08-mission-b-clock-dial.md` | WC3 day/night dial | 07 |
| 09 | `09-mission-c-workbench-crafting.md` | Workbench crafting menu | 07 (fallback UI if 07 not shipped) |

## Cross-seed dependency notes

These aren't blockers but are worth knowing:

- **Seeds 10 + 11 both heavily modify `useGameLoop.js`.** If running in the same session, watch for merge conflicts in the zombie movement/attack section. They're functionally independent but touch overlapping code.
- **Seed 11 (defensive structures) benefits from seed 13 sub-feature #4 (building menus)** for the repair interaction. Seed 11 has a fallback click-to-repair if 13 hasn't shipped.
- **Seed 13 sub-feature #4 (building menus) adapts to seed 07.** If 07 has shipped, menus go in the center HUD zone. If not, they appear as floating popups. The seed handles both cases.
- **Seed 12 (profession abilities) has a soft dependency on seed 13 sub-feature #1** (predator damage rebalance). Damage reduction passives (Hardy, Iron Will) multiply against animal damage values — the feel changes depending on whether 13's rebalance has shipped.

## Running multiple seeds in one session

Seeds within the same phase are designed to work together. You can often run 2-3 in a single Claude Code session:
- **10 + 11** — outbreak events + defensive structures (functionally independent, but both touch useGameLoop.js — run 10 first, then 11)
- **07 + 08 + 09** — all three HUD missions (08 and 09 depend on 07)

Don't cross phases in a single session. Finish Phase 2 before starting Phase 3.

## Completed prompts

See `docs/prompts/completed/` for prompts that have been executed.

## Last reviewed

Seeds 07-13 were reviewed and updated on 2026-05-21. Changes:
- 07: Removed stale speed key conflict, added outbreak night display AC, added seed 13 compatibility note
- 08: No changes needed
- 09: Separated recipes into tier A (works now) / tier B (deferred effects), added fallback UI path if 07 not shipped
- 10: Fixed XP award to use `applyXp()`, clarified fortify scope (wood AND stone), clarified blizzard zombie speed check
- 11: Added critical building-blocks-movement prerequisite for zombie/animal movement, fixed "pathfinding" → "movement" language, specified repair adjacency requirement
- 12: Fixed cooldown timing model to use game-time pairs, marked no-op passives (Stockpile Mastery), added dual combat hook requirement (animal + zombie)
- 13: Resolved building menu UI conflict with seed 07 (conditional approach), deferred zombie corpses with TODO, fixed build time formula (capped at 5 game-minutes), moved animal damage to data constant
