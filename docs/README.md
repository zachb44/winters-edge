# Winter's Edge — Project Documentation

This folder is the **brain** of the project. Everything outside the code itself lives here: vision, design decisions, roadmap, system specs, queued work.

## Why this exists

The code in `src/` tells you *what* the game is. These docs tell you *why* — why we made specific design choices, what we're planning next, what the long-term vision looks like.

This is the place to start if you're:
- Returning to the project after a break
- Starting a fresh Claude chat and need full context
- Onboarding anyone else (friend, collaborator, future you)
- Trying to remember why we picked X over Y

## Folder structure

```
docs/
├── README.md                 You are here.
├── VISION.md                 The long-term dream — where this could go
├── ROADMAP.md                Current state + what's planned + what's queued
├── DESIGN_DECISIONS.md       Key calls we've made and why
├── modes/
│   ├── winters-edge.md       Design doc for the current game mode
│   └── blood-moon.md         The werewolf-mode concept (future)
├── systems/
│   ├── combat.md             Auto-attack system, attack speeds, damage
│   ├── harvest.md            Multi-hit chopping/mining
│   ├── leveling.md           XP, level thresholds, stat upgrades
│   └── professions.md        The 6 classes + ability ideas
└── prompts/
    ├── queued/               Claude Code prompts ready to run
    └── completed/            Archive of shipped prompts (for reference)
```

## How to use this with a fresh Claude chat

When you open a new chat and want to keep building, start with:

> I'm continuing work on my game project at zachb44/winters-edge. Read the docs/ folder to catch up on context, then we'll pick up with the next queued prompt in docs/prompts/queued/.

That gives Claude full context in seconds. No copy-paste handoffs, no re-explaining what bears do.

## Maintenance habit

Try to update the relevant doc at the end of each shipping session. Even a one-line addition to ROADMAP.md saying "Bundle X shipped" keeps the docs alive. Stale docs are still 10x better than no docs.

## Author

Built by Zach (zachb44) with Claude as design partner. Started Spring 2026.
