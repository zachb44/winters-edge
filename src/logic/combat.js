import { PROFESSIONS } from '../data/professions.js';
import { rollFromTable, ITEM_INFO } from '../data/loot.js';
import { pushLog } from './log.js';
import { gainXp } from './progression.js';
import { applyXp, XP_REWARDS, powerDamageMultiplier } from '../data/leveling.js';
import { hasAbility } from './abilities.js';

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

  const newAnimals = s.animals.map(a => {
    if (a.id !== animalId) return a;
    const newHp = a.hp - dmg;
    if (newHp <= 0) {
      lethal = true;
      if (a.type === 'rabbit') { s.inventory.raw_meat += 1; s = pushLog(s, '🐰 Killed rabbit (+1 raw meat)'); }
      else if (a.type === 'wolf') { s.inventory.raw_meat += 2; s.inventory.pelts += 1; s = pushLog(s, '🐺 Killed wolf (+2 meat, +1 pelt)'); }
      else if (a.type === 'boar') { s.inventory.raw_meat += 4; s = pushLog(s, '🐗 Killed boar (+4 meat)'); }
      else if (a.type === 'bear') {
        const drops = rollFromTable('bear');
        let msg = '🐻 KILLED THE BEAR!';
        for (const drop of drops) {
          s.inventory[drop.item] = (s.inventory[drop.item] || 0) + drop.qty;
          msg += ` +${drop.qty}${ITEM_INFO[drop.item].icon}`;
        }
        s = pushLog(s, msg);
      }
      else if (a.type === 'deer') { s.inventory.raw_meat += 5; s.inventory.pelts += 1; s = pushLog(s, '🦌 Killed deer (+5 meat, +1 pelt)'); }
      else if (a.type === 'seal') { s.inventory.raw_meat += 3; s.inventory.fat += 2; s = pushLog(s, '🦭 Killed seal (+3 meat, +2 fat)'); }
      else if (a.type === 'raven') { s.inventory.raw_meat += 1; s = pushLog(s, '🦅 Killed raven (+1 meat)'); }
      if (grantSkinMasterPelt && a.type !== 'raven' && a.type !== 'rabbit') {
        s.inventory.pelts = (s.inventory.pelts || 0) + 1;
        s = pushLog(s, '🦊 Skin Master: +1 pelt');
      }
      s = gainXp(s, 'hunting', 15);
      s = applyXp(s, XP_REWARDS.killAnimal[a.type] || 0);
      return { ...a, hp: 0 };
    }
    if (a.type === 'boar') return { ...a, hp: newHp, aggro: true };
    return { ...a, hp: newHp };
  });
  s.animals = newAnimals.filter(a => a.hp > 0);
  if (lethal && s.combatTarget === animalId) {
    s.combatTarget = null;
    s.combatTargetType = null;
  }
  s.player = { ...s.player, stamina: Math.max(0, s.player.stamina - 12) };
  return { state: s, hit: { dmg, lethal, x: target.x, y: target.y } };
}
