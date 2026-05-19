# Professions

6 starting professions, each with distinct passive bonuses and starting kits.

## Lumberjack 🪫

**Theme:** Years in timber camps. Cold doesn't bother you.

**Bonuses:**
- +50% wood per chop
- +15% starting warmth (95 instead of 80)
- Extra starting wood

**Tradeoffs:**
- -1 starting food

**Starting inventory:** wood 10, hatchet 1, food 2

**Mods:** `{ woodBonus: 1.5, startWarmth: 95 }`

## Hunter 🏹

**Theme:** A patient tracker who can read tracks and shoot straight.

**Bonuses:**
- +25% damage vs animals
- Deer flee less (deerFleeRange 3 instead of 5)
- Starts with bow

**Tradeoffs:**
- Worse at building

**Starting inventory:** hunting_bow 1, dried_meat 3, food 2

**Mods:** `{ huntingDmgBonus: 1.25, deerFleeRange: 3 }`

## Mechanic 🔧

**Theme:** A scavenger's eye. You see value in every scrap.

**Bonuses:**
- Loot rolls twice, keeps the better one (`lootReroll`)
- Extra scrap starting

**Tradeoffs:**
- -15% combat damage

**Starting inventory:** scrap 5, food 3, wood 3

**Mods:** `{ lootReroll: true, combatPenalty: 0.85 }`

## Medic 🏥

**Theme:** Field medic. You've patched yourself up worse than this.

**Bonuses:**
- 2 medkits
- Medkits heal +75 HP instead of +50
- +30% HP regen rate

**Tradeoffs:**
- Less starting wood/food

**Starting inventory:** medkit 2, cloth 2, food 2

**Mods:** `{ medkitBonus: 25, hpRegenBonus: 1.3 }`

## Prospector ⛏️

**Theme:** Lived in the hills for decades. Used to harsh weather.

**Bonuses:**
- +30% warmth retention (warmthRetention 0.7 on negative deltas)
- Faster mining (mines 2 stone at a time)
- Extra stone starting

**Tradeoffs:**
- Slightly slower movement (not yet wired into game speed, design intent only)

**Starting inventory:** stone 5, wood 3, food 3

**Mods:** `{ warmthRetention: 0.7, miningBonus: true }`

## Veteran 🎖️

**Theme:** You've seen worse. Tough as nails, but you eat a lot.

**Bonuses:**
- +50% combat damage
- -25% damage taken from animals
- Starts with rifle
- -200ms baseline attack speed

**Tradeoffs:**
- Hunger drains 30% faster

**Starting inventory:** rifle 1, food 4, wood 2

**Mods:** `{ combatBonus: 1.5, dmgReduction: 0.75, hungerDrain: 1.3 }`

---

## Future: Active abilities (proposed, not yet built)

Each profession unlocks abilities at character levels 3, 5, 7.

### Lumberjack
- Lv 3: **Power Chop** — Next 3 tree chops deal +2 damage and yield +50% wood. CD: 1 day.
- Lv 5: **Hardy** — Passive. At low warmth, take 30% less HP damage.
- Lv 7: **Stockpile Mastery** — Built stockpiles store 2x capacity.

### Hunter
- Lv 3: **Track** — Click to reveal all animals on visible map for 30 sec. CD: half day.
- Lv 5: **Aimed Shot** — Next ranged attack does 2x damage. CD: 1 in-game hour.
- Lv 7: **Skin Master** — Passive. Kills yield +1 pelt.

### Mechanic
- Lv 3: **Salvage** — Break down 1 weapon into 2-4 scrap.
- Lv 5: **Jury-Rig** — Repair a depleted cabin/plane wreckage for one more loot roll. CD: 1 day.
- Lv 7: **Lucky Find** — Passive. 15% chance any loot rolls twice.

### Medic
- Lv 3: **Field Bandage** — Heal +20 HP using 1 cloth. CD: 1 in-game hour.
- Lv 5: **Diagnose** — Passive. Frostbite/sickness heals 50% faster (when added).
- Lv 7: **Stim Pack** — +50 stamina + faster move for 30 sec. CD: 1 day.

### Prospector
- Lv 3: **Power Mine** — Next 3 rock mines yield +1 stone each. CD: 1 day.
- Lv 5: **Cold Forged** — Passive. Building costs -1 wood/stone (min 1).
- Lv 7: **Earth Sense** — Click to reveal nearby rocks/caves on the map.

### Veteran
- Lv 3: **Battle Cry** — Next attack +100% damage. CD: 5 in-game min.
- Lv 5: **Iron Will** — Passive. At low HP, take 30% less damage.
- Lv 7: **Execute** — Animals below 25% HP take double damage.

## Implementation notes for abilities (when built)

- Add `state.player.abilities` array
- Add `state.player.abilityCooldowns` map
- Unlock at level milestone (3/5/7) automatically based on profession
- UI: ability hotbar near the level-up button (or D2-style flanking the orbs)
- Cooldown tracking per ability
- Tooltip system to explain effects
