# Prompt Queue

Seed prompts for Claude Code sessions. Each file is a self-contained task prompt. Paste it into Claude Code pointed at the `zachb44/winters-edge` repo.

## How to use

1. Pick the next numbered prompt
2. Paste the full contents into a Claude Code session
3. Claude Code reads the repo, proposes a plan, waits for your go-ahead, then implements
4. After completion, move the prompt to `docs/prompts/completed/` and update `docs/ROADMAP.md`

## Current queue

### Phase 4 — Close the gaps
| # | File | Description | Dependencies |
|---|---|---|---|
| 14 | `14-deferred-abilities.md` | Track, Stim Pack, Earth Sense — the 3 stubbed abilities | 12 |
| 15 | `15-tier-b-item-effects.md` | Sharp knife, torch, lantern, arrows get real effects | 09 |
| 16 | `16-zombie-corpse-looting.md` | Zombie kills drop lootable corpses | 13 |

## Cross-seed dependency notes

- **Seed 14 depends on seed 12** (abilities system must exist). No other dependencies.
- **Seed 15 depends on seed 09** (workbench crafting — items must be craftable). Also touches `visibilityAt` in visibility.js. If seed 14 has already changed the signature (adding temporaryReveals params), seed 15 must adapt. **Run 14 before 15** to avoid merge conflicts on visibility.js.
- **Seed 16 depends on seed 13** (corpse system must exist for animals). No other dependencies. Can run in any order relative to 14/15.

## Recommended run order

14 → 15 → 16

Seed 14 and 15 both touch `visibility.js`. Running 14 first establishes the new signature; 15 adapts to it.

## Completed prompts

See `docs/prompts/completed/` for prompts that have been executed.

## Last reviewed

Seeds 14-16 written on 2026-05-21 against the shipped codebase (all Phase 2 + Phase 3 seeds complete).
