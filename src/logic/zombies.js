import { ZOMBIE_TYPES } from '../data/zombies.js';
import { PROFESSIONS } from '../data/professions.js';
import { ITEM_INFO } from '../data/loot.js';
import { TILE_DATA } from '../data/tiles.js';
import { MAP_W, MAP_H } from '../constants.js';
import { pushLog } from './log.js';
import { applyXp, powerDamageMultiplier } from '../data/leveling.js';

let _nextZombieId = 1;
export function newZombieId() { return _nextZombieId++; }
export function resetZombieIds(value = 1) { _nextZombieId = value; }

export function getWaveSize(nightNumber) {
  const base = 3;
  const perNight = 1.4;
  return Math.floor(base + (nightNumber - 1) * perNight);
}

export function getEdgeSpawnPositions(map, count) {
  const edges = [];
  for (let x = 0; x < MAP_W; x++) {
    if (map[0]?.[x] !== undefined && TILE_DATA[map[0][x]].walkable) edges.push({ x, y: 0 });
    if (map[MAP_H - 1]?.[x] !== undefined && TILE_DATA[map[MAP_H - 1][x]].walkable) edges.push({ x, y: MAP_H - 1 });
  }
  for (let y = 1; y < MAP_H - 1; y++) {
    if (map[y]?.[0] !== undefined && TILE_DATA[map[y][0]].walkable) edges.push({ x: 0, y });
    if (map[y]?.[MAP_W - 1] !== undefined && TILE_DATA[map[y][MAP_W - 1]].walkable) edges.push({ x: MAP_W - 1, y });
  }
  const positions = [];
  for (let i = 0; i < count && edges.length > 0; i++) {
    positions.push(edges[Math.floor(Math.random() * edges.length)]);
  }
  return positions;
}

export function spawnSubWave(state, map, count) {
  const positions = getEdgeSpawnPositions(map, count);
  const fresh = positions.map(p => spawnZombie('shambler', p.x, p.y, state.wave?.nightNumber ?? state.day));
  return { ...state, zombies: [...state.zombies, ...fresh] };
}

export function despawnAllZombies(state) {
  let next = { ...state, zombies: [] };
  if (next.combatTargetType === 'zombie') {
    next.combatTarget = null;
    next.combatTargetType = null;
  }
  return next;
}

export function spawnZombie(type, x, y, day = 1) {
  const t = ZOMBIE_TYPES[type];
  return {
    id: newZombieId(),
    type,
    x, y,
    hp: t.hp,
    maxHp: t.hp,
    lastAttackMs: 0,
    lastMoveTick: 0,
    lungeUntil: 0,
    targetX: null,
    targetY: null,
    spawnNight: day,
  };
}

// Player damage against a zombie. Mirrors computePlayerDamage but skips the
// hunting-skill bonus (zombies aren't huntable wildlife). Weapon, combat
// profession mods, and the Power stat still apply.
export function computeZombieDamage(state) {
  const prof = PROFESSIONS[state.profession];
  let dmg = 8 + (state.equipment.hasKnife ? 4 : 0);
  if (prof.mods.combatBonus) dmg = Math.floor(dmg * prof.mods.combatBonus);
  if (prof.mods.combatPenalty) dmg = Math.floor(dmg * prof.mods.combatPenalty);
  if (state.inventory.rifle > 0) dmg += 15;
  else if (state.inventory.hunting_bow > 0) dmg += 8;
  else if (state.inventory.hatchet > 0) dmg += 5;
  dmg = Math.floor(dmg * powerDamageMultiplier(state));
  return Math.max(1, dmg);
}

// One swing against zombie `zombieId`. Mirrors combat.applyAttack shape.
export function applyZombieAttack(prev, zombieId) {
  const target = prev.zombies.find(z => z.id === zombieId);
  if (!target || target.hp <= 0) return { state: prev, hit: null };

  let s = { ...prev, inventory: { ...prev.inventory } };
  const dmg = computeZombieDamage(s);
  let lethal = false;

  const newZombies = s.zombies.map(z => {
    if (z.id !== zombieId) return z;
    const newHp = z.hp - dmg;
    if (newHp <= 0) {
      lethal = true;
      const type = ZOMBIE_TYPES[z.type];
      let msg = `🧟 ${type.name} destroyed!`;
      for (const drop of type.loot) {
        if (Math.random() < drop.chance) {
          s.inventory[drop.item] = (s.inventory[drop.item] || 0) + drop.qty;
          const info = ITEM_INFO[drop.item];
          const icon = info?.icon || '•';
          msg += ` +${drop.qty}${icon}`;
        }
      }
      s = pushLog(s, `${msg} (+${type.xpReward} XP)`);
      s = applyXp(s, type.xpReward);
      return { ...z, hp: 0 };
    }
    return { ...z, hp: newHp };
  });
  s.zombies = newZombies.filter(z => z.hp > 0);
  if (lethal && s.combatTarget === zombieId && s.combatTargetType === 'zombie') {
    s.combatTarget = null;
    s.combatTargetType = null;
  }
  s.player = { ...s.player, stamina: Math.max(0, s.player.stamina - 12) };
  return { state: s, hit: { dmg, lethal, x: target.x, y: target.y } };
}
