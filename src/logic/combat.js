import { PROFESSIONS } from '../data/professions.js';
import { rollFromTable } from '../data/loot.js';
import { pushLog } from './log.js';
import { gainXp } from './progression.js';
import { applyXp, XP_REWARDS, powerDamageMultiplier } from '../data/leveling.js';
import { hasAbility } from './abilities.js';

let _nextCorpseId = 1;
export function newCorpseId() { return _nextCorpseId++; }
export function resetCorpseIds(value = 1) { _nextCorpseId = value; }

// Loot table per animal type. Bear is special: uses rollFromTable('bear').
function buildAnimalLoot(animalType) {
  switch (animalType) {
    case 'rabbit': return [{ item: 'raw_meat', qty: 1 }];
    case 'wolf':   return [{ item: 'raw_meat', qty: 2 }, { item: 'pelts', qty: 1 }];
    case 'boar':   return [{ item: 'raw_meat', qty: 4 }];
    case 'deer':   return [{ item: 'raw_meat', qty: 5 }, { item: 'pelts', qty: 1 }];
    case 'seal':   return [{ item: 'raw_meat', qty: 3 }, { item: 'fat', qty: 2 }];
    case 'raven':  return [{ item: 'raw_meat', qty: 1 }];
    case 'bear':   return rollFromTable('bear');
    default:       return [];
  }
}

// Compute outgoing player damage against `animal`. Pure.
export function computePlayerDamage(state, animal) {
  const prof = PROFESSIONS[state.profession];
  let dmg = 8 + Math.floor(state.skills.hunting * 2) + (state.equipment.hasKnife ? 4 : 0);
  if (prof.mods.huntingDmgBonus && ['rabbit','deer','wolf','boar','bear','seal','raven'].includes(animal.type)) {
    dmg = Math.floor(dmg * prof.mods.huntingDmgBonus);
  }
  if (prof.mods.combatBonus) dmg = Math.floor(dmg * prof.mods.combatBonus);
  if (prof.mods.combatPenalty) dmg = Math.floor(dmg * prof.mods.combatPenalty);
  if (state.inventory.rifle > 0) dmg += 15;
  else if (state.inventory.hunting_bow > 0) dmg += 8;
  else if (state.inventory.hatchet > 0) dmg += 5;
  dmg = Math.floor(dmg * powerDamageMultiplier(state));
  // Execute: enemies below 25% HP take 2x damage.
  if (hasAbility(state, 'execute') && animal.maxHp && animal.hp < 0.25 * animal.maxHp) {
    dmg = dmg * 2;
  }
  // One-shot next-attack multiplier (Aimed Shot, Battle Cry).
  const mult = state.player?.nextAttackMult || 1;
  if (mult > 1) dmg = Math.floor(dmg * mult);
  return Math.max(1, dmg);
}

// Pure state transition: apply ONE swing of the player's attack against the
// animal with id === `animalId`. Returns { state, hit: {dmg, lethal} | null }.
// Caller handles cosmetic side-effects (hit flashes, lunge, damage numbers).
export function applyAttack(prev, animalId) {
  const target = prev.animals.find(a => a.id === animalId);
  if (!target || target.hp <= 0) return { state: prev, hit: null };

  let s = { ...prev, inventory: { ...prev.inventory }, skills: { ...prev.skills } };
  const dmg = computePlayerDamage(s, target);
  // Consume one-shot next-attack multiplier after damage was computed.
  if ((s.player?.nextAttackMult || 1) > 1) {
    s = { ...s, player: { ...s.player, nextAttackMult: 1 } };
  }
  const grantSkinMasterPelt = hasAbility(s, 'skin_master');
  let lethal = false;

  let corpseLoot = null;
  const newAnimals = s.animals.map(a => {
    if (a.id !== animalId) return a;
    const newHp = a.hp - dmg;
    if (newHp <= 0) {
      lethal = true;
      const killMessages = {
        rabbit: '🐰 Killed rabbit.',
        wolf:   '🐺 Killed wolf.',
        boar:   '🐗 Killed boar.',
        bear:   '🐻 KILLED THE BEAR!',
        deer:   '🦌 Killed deer.',
        seal:   '🦭 Killed seal.',
        raven:  '🦅 Killed raven.',
      };
      s = pushLog(s, killMessages[a.type] || '✅ Killed.');
      corpseLoot = buildAnimalLoot(a.type);
      if (grantSkinMasterPelt && a.type !== 'raven' && a.type !== 'rabbit') {
        corpseLoot = [...corpseLoot, { item: 'pelts', qty: 1 }];
        s = pushLog(s, '🦊 Skin Master: +1 pelt on corpse');
      }
      s = gainXp(s, 'hunting', 15);
      s = applyXp(s, XP_REWARDS.killAnimal[a.type] || 0);
      return { ...a, hp: 0 };
    }
    if (a.type === 'boar') return { ...a, hp: newHp, aggro: true };
    return { ...a, hp: newHp };
  });
  if (lethal && corpseLoot) {
    const corpse = {
      id: newCorpseId(),
      x: target.x,
      y: target.y,
      type: target.type,
      loot: corpseLoot,
      spawnDay: s.day,
      spawnTime: s.time,
    };
    s.corpses = [...(s.corpses || []), corpse];
    s = pushLog(s, '💀 A corpse remains. Click it to collect loot.');
  }
  s.animals = newAnimals.filter(a => a.hp > 0);
  if (lethal && s.combatTarget === animalId) {
    s.combatTarget = null;
    s.combatTargetType = null;
  }
  s.player = { ...s.player, stamina: Math.max(0, s.player.stamina - 12) };
  return { state: s, hit: { dmg, lethal, x: target.x, y: target.y } };
}
