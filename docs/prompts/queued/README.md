# Prompt Queue

Seed prompts for Claude Code sessions. Each file is a self-contained task prompt. Paste it into Claude Code pointed at the `zachb44/winters-edge` repo.

## How to use

1. Pick the next numbered prompt
2. Paste the full contents into a Claude Code session
3. Claude Code reads the repo, proposes a plan, waits for your go-ahead, then implements
4. After completion, move the prompt to `docs/prompts/completed/` and update `docs/ROADMAP.md`

## Current queue

### Phase 3 — HUD + UX overhaul
| # | File | Description | Dependencies |
|---|---|---|---|
| 07 | `07-mission-a-d2-hud.md` | D2-style bottom HUD with orbs | None |
| 08 | `08-mission-b-clock-dial.md` | WC3 day/night dial | 07 |
| 09 | `09-mission-c-workbench-crafting.md` | Workbench crafting menu | 07 (fallback UI if 07 not shipped) |

## Cross-seed dependency notes

Phase 2 (seeds 10–13) shipped on 2026-05-21. Notes about the remaining HUD seeds:

- **Seed 09 (workbench crafting) adapts to seed 07.** If 07 has shipped, the crafting UI lives in the center HUD zone. If not, it falls back to a floating modal. The seed handles both cases.
- **Seed 13's building menus already exist as floating popups** (since 07 hadn't shipped when 13 ran). When 07 ships, the building action menu may want to migrate into the center HUD zone for consistency. Not a blocker.

## Running multiple seeds in one session

- **07 + 08 + 09** — all three HUD missions can run together (08 and 09 depend on 07).

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
