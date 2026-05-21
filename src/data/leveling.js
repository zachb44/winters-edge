// Character progression — pure data and pure state-transition functions.
// No React imports, no DOM, no side effects. The game-logic layer calls
// applyXp() to grow XP; the UI layer reads characterLevel / characterXp
// / unspentStatPoints / statUpgrades to render.

import { pushLog } from '../logic/log.js';
import { getUnlockAtExactly } from './abilities.js';

// XP awarded for in-world actions. The game-logic layer is responsible
// for calling applyXp at the right moments — these constants are just
// the source of truth for "how much per action".
export const XP_REWARDS = {
  chopTree: 3,
  mineRock: 2,
  lootRoll: 5,         // per successful loot drop produced
  lootCrate: 15,       // crate looted (regardless of drop count)
  surviveDay: 25,      // awarded at the day rollover
  buildStructure: 10,
  killAnimal: {
    rabbit: 5,
    deer: 15,
    wolf: 20,
    boar: 25,
    seal: 10,
    raven: 5,
    bear: 100,
  },
};

// Total XP needed to reach the *next* level.
// L1→2 = 50, L2→3 = 125, ... L9→10 = 1600.
// L10+: each next level adds +400 to the previous threshold.
const LEVEL_THRESHOLDS = [50, 125, 225, 350, 500, 700, 950, 1250, 1600];

export function xpForNextLevel(level) {
  if (level < 1) return 0;
  if (level <= 9) return LEVEL_THRESHOLDS[level - 1];
  return 1600 + (level - 9) * 400;
}

// Returns { xp, level } for the current state suitable for display: how far
// the player is into the current level and how much they need.
export function levelProgress(state) {
  const level = state.characterLevel || 1;
  const currentLevelStart = level === 1 ? 0 : xpForNextLevel(level - 1);
  const nextLevelAt = xpForNextLevel(level);
  const into = (state.characterXp || 0) - currentLevelStart;
  const span = nextLevelAt - currentLevelStart;
  return { into, span, pct: span > 0 ? Math.min(1, into / span) : 0 };
}

// Add XP and roll forward through any earned levels. Returns new state.
// On each level gained, awards 1 unspent stat point and logs.
export function applyXp(state, amount) {
  if (!amount || amount <= 0) return state;
  let s = { ...state, characterXp: (state.characterXp || 0) + amount };
  let level = s.characterLevel || 1;
  let pointsGained = 0;
  const unlocked = [];
  while (s.characterXp >= xpForNextLevel(level)) {
    level += 1;
    pointsGained += 1;
    const ability = getUnlockAtExactly(s.profession, level);
    if (ability) unlocked.push(ability);
  }
  if (pointsGained > 0) {
    s = {
      ...s,
      characterLevel: level,
      unspentStatPoints: (s.unspentStatPoints || 0) + pointsGained,
    };
    s = pushLog(s, `🎉 Level Up! You are now Level ${level}.`);
    if (unlocked.length > 0) {
      const existingAbilities = s.player?.abilities || [];
      const newAbilities = [...existingAbilities];
      for (const ab of unlocked) {
        if (!newAbilities.includes(ab.id)) newAbilities.push(ab.id);
        s = pushLog(s, `✨ Unlocked: ${ab.name}`);
      }
      s = { ...s, player: { ...s.player, abilities: newAbilities } };
    }
  }
  return s;
}

// Stat upgrade definitions — apply() takes state, returns new state.
// Each upgrade also increments state.statUpgrades[key] so the modal can
// show "Times upgraded: N" and so Power can compound.
export const STAT_UPGRADES = {
  vitality: {
    name: 'Vitality',
    icon: '❤️',
    desc: 'Max HP +10 (heals +10 now)',
    preview: (s) => `Max HP: ${s.player.maxHp ?? 100} → ${(s.player.maxHp ?? 100) + 10}`,
    apply: (s) => {
      const newMax = (s.player.maxHp ?? 100) + 10;
      return {
        ...s,
        player: { ...s.player, maxHp: newMax, hp: Math.min(newMax, s.player.hp + 10) },
        statUpgrades: { ...s.statUpgrades, vitality: (s.statUpgrades?.vitality || 0) + 1 },
      };
    },
  },
  insulation: {
    name: 'Insulation',
    icon: '🔥',
    desc: 'Max Warmth +10 (restores +10 now)',
    preview: (s) => `Max Warmth: ${s.player.maxWarmth ?? 100} → ${(s.player.maxWarmth ?? 100) + 10}`,
    apply: (s) => {
      const newMax = (s.player.maxWarmth ?? 100) + 10;
      return {
        ...s,
        player: { ...s.player, maxWarmth: newMax, warmth: Math.min(newMax, s.player.warmth + 10) },
        statUpgrades: { ...s.statUpgrades, insulation: (s.statUpgrades?.insulation || 0) + 1 },
      };
    },
  },
  endurance: {
    name: 'Endurance',
    icon: '🍖',
    desc: 'Max Hunger +10, Max Stamina +5 (both restored)',
    preview: (s) => `Hunger: ${s.player.maxHunger ?? 100} → ${(s.player.maxHunger ?? 100) + 10}, Stamina: ${s.player.maxStamina ?? 100} → ${(s.player.maxStamina ?? 100) + 5}`,
    apply: (s) => {
      const newMaxH = (s.player.maxHunger ?? 100) + 10;
      const newMaxS = (s.player.maxStamina ?? 100) + 5;
      return {
        ...s,
        player: {
          ...s.player,
          maxHunger: newMaxH, hunger: Math.min(newMaxH, s.player.hunger + 10),
          maxStamina: newMaxS, stamina: Math.min(newMaxS, s.player.stamina + 5),
        },
        statUpgrades: { ...s.statUpgrades, endurance: (s.statUpgrades?.endurance || 0) + 1 },
      };
    },
  },
  power: {
    name: 'Power',
    icon: '⚔️',
    desc: '+5% combat damage (compounds)',
    preview: (s) => `Damage: +${((s.statUpgrades?.power || 0) * 5)}% → +${((s.statUpgrades?.power || 0) + 1) * 5}%`,
    apply: (s) => ({
      ...s,
      statUpgrades: { ...s.statUpgrades, power: (s.statUpgrades?.power || 0) + 1 },
    }),
  },
};

export function powerDamageMultiplier(state) {
  return 1 + (state.statUpgrades?.power || 0) * 0.05;
}
