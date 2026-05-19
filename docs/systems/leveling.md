# Leveling System

## Two parallel progressions

### Skill levels (per-skill XP)
- **Foraging** — increased by chopping trees
- **Hunting** — increased by killing animals
- **Crafting** — increased by building structures
- Each level grants passive bonuses (more wood per chop, more attack damage, etc.)

### Character level (separate XP track)
- Gained from doing pretty much anything
- Each level grants 1 stat point to spend
- The dopamine hit progression

## Character XP sources

- Chop tree (completion): +3
- Mine rock (completion): +2
- Loot roll (cabin/plane): +5 per roll
- Loot crate: +15
- Build structure: +10
- Survive a full day: +25 (at day transition)
- Kill rabbit: +5
- Kill deer: +15
- Kill wolf: +20
- Kill boar: +25
- Kill seal: +10
- Kill raven: +5
- **Kill bear: +100** (one-shot level-up burst)

## Level thresholds (cumulative XP)

```
Level  XP Required
1 → 2  50
2 → 3  125
3 → 4  225
4 → 5  350
5 → 6  500
6 → 7  700
7 → 8  950
8 → 9  1250
9 → 10 1600
10+    +400 per level beyond L10
```

A full successful 30-day run yields ~6-10 levels at active play.

## Stat upgrades

Each level grants 1 unspent point. Player chooses from 4 stats:

1. **❤️ Vitality** — Max HP +10 (current HP restored by 10)
2. **🔥 Insulation** — Max Warmth +10 (current warmth restored by 10)
3. **🍖 Endurance** — Max Hunger +10 + Max Stamina +5 (current values restored)
4. **⚔️ Power** — +5% combat damage (compounds across stacks)

Power stacking example: 3 Power upgrades → +15% damage (compounds via `powerDamageMultiplier()`).

## Level Up UI

- Celebratory overlay flashes for 2s with gold glow + scale animation
- "LEVEL UP!" + "You are now Level N"
- Button appears in top bar (between character name and day/time)
- Button styled to match other top-bar buttons (slate background, gold text, gentle 2s pulse)
- Hidden when `unspentStatPoints === 0`
- Click → opens StatUpgradeModal

## Stat upgrade modal

- Shows 4 stat options
- Each shows: name, icon, description, current→next value, times-upgraded count
- Click choice → stat applied, point spent
- If more points remain, button stays visible

## Architecture

- **Data:** `src/data/leveling.js` — `XP_REWARDS`, level thresholds, `applyXp()`, `STAT_UPGRADES`
- **Logic:** `src/logic/progression.js` — `gainXp(state, amount)`
- **Visual:** `src/components/LevelUpOverlay.jsx`, `src/components/LevelButton.jsx`, `src/components/StatUpgradeModal.jsx`

## Save behavior

All level/XP/stat upgrade data persists via localStorage. New fields backfilled cleanly on older saves.
