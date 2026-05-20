# Profession Abilities Bundle

Copy this entire block into Claude Code as a single prompt.

---

Add active abilities tied to each profession's identity. Players unlock abilities at character levels 3, 5, and 7 automatically based on their chosen profession.

## What this adds

Right now professions only differ in starting kit and passive bonuses. This bundle adds 3 active or passive abilities per profession, unlocked at level milestones.

## Ability list (18 total)

### Lumberjack 🪫
- **Lv 3 — Power Chop:** Next 3 tree chops deal +2 damage and yield +50% wood. Cooldown: 1 in-game day.
- **Lv 5 — Hardy:** Passive. At warmth <30, take 30% less HP damage from all sources.
- **Lv 7 — Stockpile Mastery:** Passive. Built stockpiles store 2x capacity.

### Hunter 🏹
- **Lv 3 — Track:** Active. Click to reveal all animals on the visible map for 30 in-game seconds. Cooldown: half in-game day.
- **Lv 5 — Aimed Shot:** Active. Next ranged attack does 2x damage. Cooldown: 1 in-game hour.
- **Lv 7 — Skin Master:** Passive. Animal kills yield +1 pelt.

### Mechanic 🔧
- **Lv 3 — Salvage:** Active. Break down 1 weapon (rifle/bow/hatchet) into 2-4 scrap. Confirmation prompt before executing.
- **Lv 5 — Jury-Rig:** Active. Restore one loot use to a depleted cabin or plane wreckage. Cooldown: 1 in-game day.
- **Lv 7 — Lucky Find:** Passive. 15% chance any loot roll rolls twice (keeps the better roll).

### Medic 🏥
- **Lv 3 — Field Bandage:** Active. Heal +20 HP using 1 cloth. Cooldown: 1 in-game hour.
- **Lv 5 — Diagnose:** Passive. (For now: HP regen rate doubled. Will become "frostbite/sickness heals 2x faster" when those systems exist.)
- **Lv 7 — Stim Pack:** Active. +50 stamina + 50% movement speed for 30 in-game seconds. Cooldown: 1 in-game day.

### Prospector ⛏️
- **Lv 3 — Power Mine:** Active. Next 3 rock mines yield +1 stone each. Cooldown: 1 in-game day.
- **Lv 5 — Cold Forged:** Passive. All building costs reduced by 1 wood and 1 stone (minimum 1 of each).
- **Lv 7 — Earth Sense:** Active. Click to reveal all rocks and caves on the visible map for 30 in-game seconds. Cooldown: half in-game day.

### Veteran 🎖️
- **Lv 3 — Battle Cry:** Active. Next attack +100% damage. Cooldown: 5 in-game minutes.
- **Lv 5 — Iron Will:** Passive. At HP <30, take 30% less damage.
- **Lv 7 — Execute:** Passive. Animals below 25% HP take 2x damage from your attacks.

## Implementation

### State additions

```
state.player.abilities  — array of unlocked ability IDs
state.player.abilityCooldowns  — { abilityId: endTimestamp }
state.player.abilityCharges  — { abilityId: chargesRemaining } (for multi-use abilities like Power Chop)
```

### Unlocking

At level-up, if the new level is 3, 5, or 7, automatically add the corresponding ability for the player's profession to `state.player.abilities`. Show a brief notification: "✨ Unlocked: [Ability Name]".

### UI — Ability hotbar

Add a small ability hotbar somewhere visible (suggestion: below the resource ribbon, or floating in the bottom-left near where the HP orb will eventually go).

For each unlocked ability:
- Show its icon
- Show cooldown overlay (greyed out, with seconds remaining) when on cooldown
- Show charge count for multi-use abilities
- Tooltip on hover: name, description, cooldown
- Click to activate (for active abilities)

### Passive abilities

Passive abilities don't need a button — they just modify game logic. Add them to the relevant calculations:
- Hardy: check `hasAbility('hardy')` in the damage-taken code
- Skin Master: check in the kill loot code
- Stockpile Mastery: check in storage cap calculations (when added)
- Lucky Find: check in `rollFromTable`
- Diagnose: check in HP regen calculation
- Cold Forged: check in building cost validation
- Iron Will: check in damage-taken code (similar to Hardy)
- Execute: check in animal damage calculation when HP is low

### Architecture

- **Data:** `src/data/abilities.js` — ability definitions per profession
- **Logic:** `src/logic/abilities.js` — pure functions for ability effects, `useAbility(state, id)`, cooldown helpers
- **Visual:** `src/components/AbilityHotbar.jsx`, `src/components/AbilityTooltip.jsx`

### Save migration

Backfill `abilities`, `abilityCooldowns`, `abilityCharges` to empty defaults on older saves.

## Constraints

- Don't break existing systems — combat, leveling, harvest, save/load all work identically
- Cooldowns measured in game-time (in-game hours), not real-time milliseconds, so they pause when game is paused
- Active abilities cost 0 mana/resources to use (the cooldown is the cost). Power Chop/Power Mine use a charge system instead of cooldown.
- Don't add any new vital (no mana, etc.). Abilities are gated by time only.

Commit message: `feat: profession abilities unlocked at character levels 3/5/7`

## Plan before executing

1. Read `src/data/professions.js` and the leveling code
2. Propose the data structure for abilities
3. Wait for go-ahead
4. Implement in order: data/logic → unlock-on-level-up → passive ability hooks → active ability UI → save/load
5. Summarize and call out anything to specifically playtest
