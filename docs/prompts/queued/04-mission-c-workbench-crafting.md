# Mission C: Workbench as Crafting Hub

**Run AFTER Mission A (the D2 bottom HUD) ships.**

Copy this entire block into Claude Code as a single prompt.

---

Make the workbench building functional as the game's crafting hub, inspired by how Warcraft 3 buildings have their own production menus.

## Current state

The workbench exists as a buildable structure (12 wood / 4 stone / 3 scrap) but doesn't do anything when clicked.

## What the workbench should do

When the player selects a workbench (clicking it shows its menu in the center HUD zone from Mission A), they see a crafting interface with multiple recipes.

## Recipes

**Tools & Equipment:**
- 🪨 **Hatchet** — 3 wood, 2 stone, 1 scrap — +5 dmg, chops trees 2x faster
- 🏹 **Hunting Bow** — 5 wood, 2 cloth — +8 dmg, attack range 3 tiles
- 🔪 **Sharp Knife** — 1 wood, 2 scrap — replaces default knife with +6 dmg version
- 🧥 **Fur Coat** — 3 pelts, 2 cloth — +30% warmth retention

**Light Sources:**
- 🔥 **Torch** — 1 wood, 1 cloth — portable light (+3 vision, +0.5 warmth/tick), 30 in-game min duration
- 🏮 **Lantern** — 2 scrap, 1 cloth, 1 wood — permanent torch, doesn't deplete

**Food Preservation:**
- 🥓 **Dried Meat** — 2 cooked_meat — +35 hunger when eaten, doesn't spoil

**Ammo (for future ranged combat):**
- 🏹 **Arrows (x5)** — 1 wood, 1 scrap — ammunition for hunting bow

## UI for the crafting menu

In the workbench's selected-building panel:
- Header: "🔨 Workbench — Craft items here"
- Scrollable list of recipes
- Each recipe shows:
  - Item icon + name
  - Required materials with current/needed (e.g., "🪵 3/5")
  - Materials in green if you have enough, red if not
  - Short description of effect
  - "Craft" button (disabled if requirements not met)
- Click Craft → deducts materials, adds item to inventory
- Log message: "🔨 Crafted Hatchet"

## Constraints

- Don't break existing functionality
- Workbench still buildable from Build menu
- Crafted items go into inventory normally
- Equipping/using crafted items happens via inventory panel (full equipment slot mechanics come in a future mission)
- Crafting is instant for v1 (we can add timers later)

Commit message: `feat: workbench crafting menu with tools, light sources, and food preservation`
