# Mission C: Workbench as Crafting Hub

**Run AFTER Mission A (the D2 bottom HUD) ships. If Mission A has NOT shipped yet, see fallback UI note below.**

Copy this entire block into Claude Code as a single prompt.

---

Make the workbench building functional as the game's crafting hub, inspired by how Warcraft 3 buildings have their own production menus.

## Current state

The workbench exists as a buildable structure (12 wood / 4 stone / 3 scrap) but doesn't do anything when clicked.

## What the workbench should do

When the player selects a workbench, they see a crafting interface with multiple recipes.

### UI integration

**If Mission A (seed 07) HAS shipped:** Clicking the workbench shows the crafting menu in the center HUD zone, same as any other building selection.

**If Mission A has NOT shipped yet:** Implement the crafting menu as a modal overlay (similar to how InventoryMenu.jsx works — a panel that opens on top of the game). Add a click handler: when the player clicks a workbench building tile, open the crafting modal. Close with Esc or clicking outside.

## Recipes

### Tier A — Items that work immediately (existing inventory/combat system)

These items already exist in `src/data/loot.js` ITEM_INFO and are already referenced by the combat/equipment system. Crafting them adds to the same inventory keys that loot drops use.

- 🪨 **Hatchet** (`hatchet`) — 3 wood, 2 stone, 1 scrap — +5 dmg, chops trees 2x faster. Already tracked: `state.inventory.hatchet`
- 🏹 **Hunting Bow** (`hunting_bow`) — 5 wood, 2 cloth — +8 dmg, attack range 3 tiles. Already tracked: `state.inventory.hunting_bow`
- 🥓 **Dried Meat** (`dried_meat`) — 2 cooked_meat — +35 hunger when eaten. Already tracked: `state.inventory.dried_meat`

### Tier B — Items with deferred effects (craft now, effect hooks come later)

These items can be crafted and will appear in inventory, but their special effects are NOT implemented in this seed. Add the inventory keys and ITEM_INFO entries but do NOT attempt to hook their effects into the game loop. Each has a note about what the future effect will be.

- 🔪 **Sharp Knife** (`sharp_knife`) — 1 wood, 2 scrap — Future: +6 dmg melee weapon. For now: sits in inventory, no combat effect.
- 🔥 **Torch** (`torch`) — 1 wood, 1 cloth — Future: +3 vision radius, +0.5 warmth/tick, 30 in-game min duration. For now: sits in inventory.
- 🏮 **Lantern** (`lantern`) — 2 scrap, 1 cloth, 1 wood — Future: permanent torch, doesn't deplete. For now: already exists as a loot drop (`state.inventory.lantern`) but has no gameplay effect yet. Crafting just adds to the count.
- 🧵 **Fur Coat** (`fur_coat`) — 3 pelts, 2 cloth — Future: +30% warmth retention. For now: already exists as a loot drop and IS partially wired — check `useGameLoop.js` for `state.inventory.fur_coat > 0` warmth bonus. This one actually works already. Move to Tier A if the warmth bonus hook is confirmed present.
- 🏹 **Arrows (x5)** (`arrows`) — 1 wood, 1 scrap — Future: ammunition for hunting bow. For now: sits in inventory. New inventory key: `arrows`.

**Implementation note for Tier B:** Add `ITEM_INFO` entries for `sharp_knife`, `torch`, and `arrows` in `src/data/loot.js`:
```js
sharp_knife: { name: 'sharp knife', icon: '🔪' },
torch: { name: 'torch', icon: '🔥' },
arrows: { name: 'arrows', icon: '➳' },
```

## UI for the crafting menu

In the workbench panel (center HUD zone or modal, depending on 07 status):
- Header: "🔨 Workbench — Craft items here"
- Scrollable list of recipes
- Each recipe shows:
  - Item icon + name
  - Required materials with current/needed (e.g., "🪵 3/5")
  - Materials in green if you have enough, red if not
  - Short description of effect (for Tier B items, show the future effect with a note like "(effect coming soon)" or just show the description without the caveat — player doesn't need to know it's deferred)
  - "Craft" button (disabled if requirements not met)
- Click Craft → deducts materials, adds item to inventory
- Log message: "🔨 Crafted Hatchet"

## Constraints

- Don't break existing functionality
- Workbench still buildable from Build menu
- Crafted items go into inventory normally
- Crafting is instant for v1 (we can add timers later)
- Tier B items: create the inventory entries and ITEM_INFO but do NOT add effect hooks to the game loop. Those come in future seeds.

Commit message: `feat: workbench crafting menu with tools, light sources, and food preservation`
