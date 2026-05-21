# Mission A: D2-Style Bottom HUD

Copy this entire block into Claude Code as a single prompt.

---

I want to overhaul the UI of Winter's Edge to feel more like a real survival game. The inspiration is Diablo 2's bottom HUD, adapted for our survival mechanics. This is a major visual change — please walk me through your plan before making big sweeping changes, and let me approve.

## Goal

Replace the current top-status-bar + right-side-menu layout with a Diablo 2 — inspired bottom HUD. The map area should expand to fill most of the screen for atmosphere.

## New layout

### Top of screen (minimal — keep the world feeling vast)

A thin top bar containing only:
- Character name + profession emoji (left)
- Animated day/night indicator + clock + day counter (center)
- Weather indicator (center, next to clock)
- Pause / speed controls (right)
- A small ribbon below it showing only raw resources: 🪵 wood, 🪨 stone, 🔧 scrap, 🧵 cloth (one line, small text, unobtrusive)

Remove from the top: food, meat, fat, pelts, medkit counts. Those move into the inventory panel.

**Outbreak Mode top bar:** In Outbreak Mode during the night phase, the top bar should show "Night N / 30" instead of "Day N / 30", matching the current GameUI behavior in `src/components/GameUI.jsx`. Check the `state.mode === 'outbreak' && state.isNightPhase` conditional and preserve it in the new layout.

### Middle of screen

The map view — make it as large as practical. Should be the dominant visual element. Currently it's 20×15 tiles at 32px; if there's room, push it to 24×18 tiles or similar to fill more space.

### Bottom HUD (the D2-style panel)

A horizontal bar across the bottom of the screen with three zones:

**Left zone: HP Orb**
- Large circular orb (~120px diameter)
- Red gradient fill that drains as HP drops
- Number overlaid: "80/100"
- Subtle glow effect
- A small "Hunger" bar directly below the orb, ~100px wide

**Center zone: Selected Entity / Action Belt**
- When nothing is selected: shows the player portrait (the profession's emoji at large size), the player name, and a 6-slot quick belt below
- The 6-slot belt holds consumables (food, raw_meat, cooked_meat, fat, dried_meat, medkit). Each slot shows the item icon and count. Hotkeys 1-6 consume the item in that slot.
- When the player clicks a building on the map: this center zone becomes the building's menu. Shows the building name, icon, status (e.g., "Campfire — Fuel: 8/20"), and contextual action buttons (e.g., "Add wood", "Cook raw meat", "Rest by fire")
- A small "selected" indicator (yellow border) on the map around the clicked building

**Right zone: Warmth Orb**
- Same size and style as HP orb, but orange-to-blue gradient (orange when warm, fades to blue when cold)
- Number overlaid: "60/100"
- Pulses faintly when warmth is below 30
- A small "Stamina" bar directly below the orb

## Side menus (still in the right column for now)

Keep the Build / Inventory / Skills / Help buttons accessible, but move them to a compact button strip somewhere unobtrusive. They open overlay panels instead of taking up permanent screen space.

## Behavior changes

1. **Clicking a building** on the map selects it (shows yellow border) and displays its menu in the center zone of the HUD
2. **Clicking the map** (empty tile or to move) deselects the building and returns the center zone to the player portrait view
3. **Clicking the player** explicitly also deselects buildings
4. **Number keys 1-6** consume the item in the corresponding belt slot
5. **Belt auto-fills** with food items the player has, prioritized: cooked_meat > food > dried_meat > raw_meat > fat > medkit

## Visual style

- Use rich, semi-transparent dark panels for the HUD background
- The two orbs should look polished: gradients, soft glow, slight inner shadow, value text in a bold readable font
- Use CSS gradients and box-shadows for the orb effects — no images needed
- Keep performance smooth — orbs should re-render efficiently

## Constraints

- Don't break any existing game logic. All mechanics (movement, combat, day/night, weather, events, scenarios, professions) should still work identically.
- This is a UI refactor, not a gameplay change.
- Preserve existing keyboard shortcuts (B/I/K/H/Space/Esc). Speed controls (1x/2x/3x) are already button-only in the current UI — there are no keyboard shortcuts for game speed, so the belt hotkeys 1-6 won't conflict with anything.
- Commit when complete with a clear message like `feat: D2-style bottom HUD with orbs and selectable buildings`

## Compatibility note: seed 13 (Interaction Overhaul)

The building selection center-zone pattern established here is the **canonical building interaction UI**. Seed 13's sub-feature #4 (building interaction menus) should add its per-building action buttons (Add Wood, Cook, Sleep, Demolish, etc.) into this center zone — NOT as a separate floating popup component. When seed 13 runs, it extends the center zone's building panel with richer actions rather than creating a parallel UI.

## Acceptance criteria

- [ ] Top bar is minimal: name, level, day/night, weather, pause/speed, resource ribbon
- [ ] In Outbreak Mode during night phase, top bar shows "Night N / 30" instead of "Day N"
- [ ] Map fills most of the screen
- [ ] Bottom HUD has HP orb (left), center zone (player/building), Warmth orb (right)
- [ ] Hunger bar below HP orb, Stamina bar below Warmth orb
- [ ] Clicking a building shows its menu in center zone with yellow border on map
- [ ] Clicking elsewhere deselects building
- [ ] Belt hotkeys 1-6 consume items
- [ ] Belt auto-fills with prioritized consumables
- [ ] Build/Inventory/Skills/Help accessible via compact buttons opening overlay panels
- [ ] All existing game logic unchanged

## Plan before executing

Before making changes, please:
1. Read the current src/App.jsx and GameUI structure
2. Propose a refactor plan (which sections change, which components might be worth extracting)
3. Wait for my approval before executing
4. Then make the changes incrementally with checkpoints
