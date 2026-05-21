// Pure state-transition for one harvest swing. Mirrors the shape of
// logic/combat.js applyAttack so the same swing engine in useGameLoop
// can drive both.
//
// Returns { state, hit } — the hook is responsible for the cosmetic
// side effects (lunge animation, damage number, hit flash) AND, on
// completion, for converting the map tile to SNOW via setMap.

import { T } from '../data/tiles.js';
import { PROFESSIONS } from '../data/professions.js';
import { TILE_HP, STAMINA_PER_HARVEST_SWING, computeHarvestDamage } from '../data/harvest.js';
import { pushLog } from './log.js';
import { gainXp } from './progression.js';
import { applyXp, XP_REWARDS } from '../data/leveling.js';
import { getCharges, consumeCharge } from './abilities.js';

export function applyHarvest(prev) {
  const target = prev.harvestTarget;
  if (!target) return { state: prev, hit: null };
  const key = `${target.x},${target.y}`;
  const tileHp = { ...(prev.tileHp || {}) };
  const max = TILE_HP[target.tile];
  if (!max) return { state: prev, hit: null };
  const currentHp = tileHp[key] ?? max;
  let dmg = computeHarvestDamage(prev, target.tile);
  // Power Chop: +2 swing damage while a charge is active on a tree.
  if (target.tile === T.TREE && getCharges(prev, 'power_chop') > 0) dmg += 2;
  const newHp = currentHp - dmg;

  let s = {
    ...prev,
    inventory: { ...prev.inventory },
    skills: { ...prev.skills },
  };
  s.player = {
    ...s.player,
    stamina: Math.max(0, s.player.stamina - STAMINA_PER_HARVEST_SWING),
  };

  if (newHp > 0) {
    tileHp[key] = newHp;
    s.tileHp = tileHp;
    return { state: s, hit: { dmg, x: target.x, y: target.y, completed: false, tile: target.tile } };
  }

  // Felled / mined. Grant resources, XP, clear tileHp entry and target.
  delete tileHp[key];
  s.tileHp = tileHp;
  s.harvestTarget = null;

  const profMods = PROFESSIONS[s.profession].mods || {};
  if (target.tile === T.TREE) {
    const woodBonus = profMods.woodBonus || 1;
    const earlyBonus = s.day <= 3 ? 1 : 0;
    let amount = Math.floor((2 + Math.floor(s.skills.foraging / 2)) * woodBonus) + earlyBonus;
    if (getCharges(s, 'power_chop') > 0) {
      amount = Math.floor(amount * 1.5);
      s = consumeCharge(s, 'power_chop');
    }
    s.inventory.wood += amount;
    s = gainXp(s, 'foraging', 5);
    s = applyXp(s, XP_REWARDS.chopTree);
    s = pushLog(s, `🪓 Chopped wood (+${amount})`);
    // Caller (useGameLoop) will swap the map tile to SNOW and add a regrowth entry.
  } else if (target.tile === T.ROCK) {
    let stoneAmount = profMods.miningBonus ? 2 : 1;
    if (getCharges(s, 'power_mine') > 0) {
      stoneAmount += 1;
      s = consumeCharge(s, 'power_mine');
    }
    s.inventory.stone += stoneAmount;
    s = applyXp(s, XP_REWARDS.mineRock);
    s = pushLog(s, `⛏️ +${stoneAmount} stone`);
  }

  return { state: s, hit: { dmg, x: target.x, y: target.y, completed: true, tile: target.tile } };
}
