# Prompt Queue

Seed prompts for Claude Code sessions. Each file is a self-contained task prompt. Paste it into Claude Code pointed at the `zachb44/winters-edge` repo.

## How to use

1. Pick the next numbered prompt
2. Paste the full contents into a Claude Code session
3. Claude Code reads the repo, proposes a plan, waits for your go-ahead, then implements
4. After completion, move the prompt to `docs/prompts/completed/` and update `docs/ROADMAP.md`

## Current queue

### Batch A — Close the gaps (deferred items)
| # | File | Description | Dependencies |
|---|---|---|---|
| 14 | `14-deferred-abilities.md` | Track, Stim Pack, Earth Sense — the 3 stubbed abilities | Seed 12 |
| 15 | `15-tier-b-item-effects.md` | Sharp knife, torch, arrows, lantern get real effects | Seed 09, seed 12 (for knife + combat) |
| 16 | `16-zombie-corpses.md` | Zombie kills drop lootable corpses | Seed 13a (corpse system) |

## Cross-seed dependency notes

- **Seed 14** builds two small systems (temporary fog reveal, speed buff) that only the three stubbed abilities use. No other seeds depend on these systems yet.
- **Seed 15** modifies `visibilityAt` in `src/logic/visibility.js` to accept an effective vision radius. If seed 14 is run first, seed 14's fog reveal system is render-only and doesn't touch `visibilityAt`, so no conflict. Run order 14 → 15 or 15 → 14 both work.
- **Seed 16** is fully independent — it just converts the zombie kill path from auto-loot to the existing corpse system.
- **Seeds 14, 15, 16 can run in any order or in one session.**

## Completed prompts

See `docs/prompts/completed/` for prompts that have been executed.

## Last reviewed

Seeds 14-16 written 2026-05-21 against the shipped codebase (post seeds 07-13 + bug fixes).
