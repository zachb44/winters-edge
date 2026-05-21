# Profession Abilities Bundle

Copy this entire block into Claude Code as a single prompt.

---

Add active abilities tied to each profession's identity. Players unlock abilities at character levels 3, 5, and 7 automatically based on their chosen profession.

## What this adds

Right now professions only differ in starting kit and passive bonuses. This bundle adds 3 active or passive abilities per profession, unlocked at level milestones.

## Ability list (18 total)

### Lumberjack 🪭
- **Lv 3 — Power Chop:** Next 3 tree chops deal +2 damage and yield +50% wood. Cooldown: 1 in-game day.
- **Lv 5 — Hardy:** Passive. At warmth <30, take 30% less HP damage from all sources.
- **Lv 7 — Stockpile Mastery:** Passive. **No-op until storage capacity system exists.** When implemented: built stockpiles store 2x capacity. For now: unlocks, shows in UI, tooltip says "(Awaiting storage system)", but has no mechanical effect.

### Hunter 🏹
- **Lv 3 — Track:** Active. Click to reveal all animals on the visible map for 30 in-game seconds. Cooldown: half in-game day.
- **Lv 5 — Aimed Shot:** Active. Next ranged attack does 2x damage. Cooldown: 1 in-game hour.
- **Lv 7 — Skin Master:** Passive. Animal kills yield +1 pelt.

### Mechanic 🔧
- **Lv 3 — Salvage:** Active. Break down 1 weapon (rifle/bow/hatchet) into 2-4 scrap. Confirmation prompt before executing.
- **Lv 5 — Jury-Rig:** Active. Restore one loot use to a depleted cabin or plane wreckage. Check how `LOOT_BUDGET` tracking works in `src/data/loot.js` — each lootable tile tracks remaining uses. This ability increments that counter by 1. Cooldown: 1 in-game day.
- **Lv 7 — Lucky Find:** Passive. 15% chance any loot roll rolls twice (keeps the better roll). Hook into `rollFromTable` in `src/data/loot.js`.

### Medic 🏥
- **Lv 3 — Field Bandage:** Active. Heal +20 HP using 1 cloth. Cooldown: 1 in-game hour.
- **Lv 5 — Diagnose:** Passive. HP regen rate doubled. Hook into the regen calculation in `useGameLoop.js` where `regenAmount` is computed (search for `let regenAmount`). Check `hasAbility('diagnose')` and multiply `regenAmount` by 2.
- **Lv 7 — Stim Pack:** Active. +50 stamina + 50% movement speed for 30 in-game seconds. Cooldown: 1 in-game day.

### Prospector ⛏️
- **Lv 3 — Power Mine:** Active. Next 3 rock mines yield +1 stone each. Cooldown: 1 in-game day.
- **Lv 5 — Cold Forged:** Passive. All building costs reduced by 1 wood and 1 stone (minimum 1 of each). Hook into building cost validation in `App.jsx` (same place as seed 10's fortify event, but permanent for this profession).
- **Lv 7 — Earth Sense:** Active. Click to reveal all rocks and caves on the visible map for 30 in-game seconds. Cooldown: half in-game day.

### Veteran 🎖️
- **Lv 3 — Battle Cry:** Active. Next attack +100% damage. Cooldown: 5 in-game minutes.
- **Lv 5 — Iron Will:** Passive. At HP <30, take 30% less damage.
- **Lv 7 — Execute:** Passive. Animals (and zombies) below 25% HP take 2x damage from your attacks.

## Implementation

### State additions

```
state.player.abilities  — array of unlocked ability IDs (e.g., ['power_chop', 'hardy'])
state.player.abilityCooldowns  — { abilityId: { day: number, time: number } }
state.player.abilityCharges  — { abilityId: chargesRemaining } (for multi-use abilities like Power Chop)
```

### Cooldown timing model

Cooldowns use **game-time**, not real-time milliseconds. This means they pause automatically when the game is paused (since `state.time` stops advancing).

Store cooldown end-time as a game-time pair `{ day: number, time: number }` in `state.player.abilityCooldowns`.

**To set a cooldown:** Convert the cooldown duration (in game-hours) to an absolute end time:
```js
const currentGameHours = state.day * 24 + state.time;
const endGameHours = currentGameHours + cooldownHours;
const endDay = Math.floor(endGameHours / 24);
const endTime = endGameHours % 24;
state.player.abilityCooldowns[abilityId] = { day: endDay, time: endTime };
```

**To check if cooldown has expired:**
```js
function isCooldownReady(state, abilityId) {
  const cd = state.player.abilityCooldowns[abilityId];
  if (!cd) return true;
  const now = state.day * 24 + state.time;
  const end = cd.day * 24 + cd.time;
  return now >= end;
}
```

**Cooldown display:** Show remaining game-time (e.g., "2h 15m") on the ability button. Compute as `end - now` in game-hours, convert to hours and minutes.

### Unlocking

At level-up (find the level-up code in `src/data/leveling.js` or wherever `state.characterLevel` increments), if the new level is 3, 5, or 7, automatically add the corresponding ability for the player's profession to `state.player.abilities`. Show a brief notification: "✨ Unlocked: [Ability Name]".

### UI — Ability hotbar

Add a small ability hotbar somewhere visible (suggestion: below the resource ribbon, or floating in the bottom-left near where the HP orb will eventually go).

For each unlocked ability:
- Show its icon
- Show cooldown overlay (greyed out, with time remaining) when on cooldown
- Show charge count for multi-use abilities
- Tooltip on hover: name, description, cooldown
- Click to activate (for active abilities)

### Passive abilities

Passive abilities don't need a button — they just modify game logic. Add them to the relevant calculations:

**Damage-related passives must hook into BOTH combat systems:**
- `applyAttack` in `src/logic/combat.js` (animal combat)
- `applyZombieAttack` / `computeZombieDamage` in `src/logic/zombies.js` (zombie combat)

Specifically:
- **Hardy:** Check `hasAbility('hardy')` in both the animal attack section AND the zombie attack section of `useGameLoop.js` (where `dmgTaken` is computed). If warmth < 30, multiply `dmgTaken` by 0.7.
- **Skin Master:** Check in animal kill loot code (in `applyAttack` in `src/logic/combat.js`). Add +1 pelt to drops.
- **Stockpile Mastery:** No-op for now (no storage capacity system).
- **Lucky Find:** Check in `rollFromTable` in `src/data/loot.js`. 15% chance to roll twice and keep the better result.
- **Diagnose:** Check in HP regen calculation in `useGameLoop.js`. Multiply `regenAmount` by 2.
- **Cold Forged:** Check in building cost validation in `App.jsx`. Reduce wood and stone cost by 1 each (min 1).
- **Iron Will:** Check in both animal AND zombie attack damage sections of `useGameLoop.js`. If HP < 30, multiply `dmgTaken` by 0.7.
- **Execute:** Check in both `computePlayerDamage` (combat.js) AND `computeZombieDamage` (zombies.js). If target HP < 25% of maxHp, multiply damage by 2.

### Architecture

- **Data:** `src/data/abilities.js` — ability definitions per profession, keyed by profession ID
- **Logic:** `src/logic/abilities.js` — pure functions: `useAbility(state, id)`, `isCooldownReady(state, id)`, `hasAbility(state, id)`, `getRemainingCooldown(state, id)`
- **Visual:** `src/components/AbilityHotbar.jsx`, `src/components/AbilityTooltip.jsx`

### Save migration

Backfill in `loadGame()` in `src/logic/saveLoad.js`:
```js
state.player.abilities = state.player.abilities ?? [];
state.player.abilityCooldowns = state.player.abilityCooldowns ?? {};
state.player.abilityCharges = state.player.abilityCharges ?? {};
```

Also: on load, check if the character's level should have unlocked abilities that aren't in the array (for saves that leveled up before this system existed). If `characterLevel >= 3` and the lv3 ability isn't in `abilities`, add it. Same for 5 and 7.

## Constraints

- Don't break existing systems — combat, leveling, harvest, save/load all work identically
- Cooldowns measured in game-time (pauses when game pauses)
- Active abilities cost 0 mana/resources to use (the cooldown is the cost). Power Chop/Power Mine use a charge system instead of cooldown.
- Don't add any new vital (no mana, etc.). Abilities are gated by time only.

Commit message: `feat: profession abilities unlocked at character levels 3/5/7`

## Plan before executing

1. Read `src/data/professions.js` and the leveling code in `src/data/leveling.js`
2. Read `src/logic/combat.js` (applyAttack, computePlayerDamage) and `src/logic/zombies.js` (applyZombieAttack, computeZombieDamage)
3. Propose the data structure for abilities
4. Wait for go-ahead
5. Implement in order: data/logic → unlock-on-level-up → passive ability hooks (both combat systems) → active ability UI → save/load
6. Summarize and call out anything to specifically playtest
