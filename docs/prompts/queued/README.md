# Queued Prompts

Claude Code prompts ready to run. Each is a standalone bundle.

When one ships, move the file to `../completed/` and add a note to ROADMAP.md.

## Run order

### 🔴 Critical (run first)

1. `00-bugfix-animal-attack-throttle.md` — Hostile animals attack on every tick instead of respecting attack speed. Game is unplayable when this triggers (wolves machine-gun, boars spawn-camp the player to death).

### Then features

2. `01-profession-abilities.md` — active class abilities at level milestones (biggest gameplay depth add)
3. `05-interaction-overhaul.md` — predator damage tuning, corpses, projectiles, building menus, build time
4. `02-mission-a-d2-hud.md` — D2-style bottom HUD with orbs + selectable buildings
5. `03-mission-b-clock-dial.md` — animated day/night dial (depends on Mission A)
6. `04-mission-c-workbench-crafting.md` — workbench as crafting hub (depends on Mission A)

The missions are sequenced because Mission A creates the selectable-building panel that B and C build on top of. The interaction overhaul (05) overlaps with Mission A on building menus — when running 05, decide whether to ship its building menus as a placeholder or wait for Mission A's full HUD treatment.

## Known issues to address opportunistically

- Level Up notification at the top of the screen is hard to spot — will be naturally fixed by Mission A (D2 HUD will place this near the orbs).
- Boar permanent aggro can feel punishing if you spawn near one — interaction overhaul (05) addresses this with damage reduction; could also add a 5-min aggro timeout if it still feels harsh.
- No spawn protection for hostile animals near crash sites — consider adding to bug-fix prompt 00 if the throttle fix alone isn't enough.
