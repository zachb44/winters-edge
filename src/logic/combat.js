import { PROFESSIONS } from '../data/professions.js';
import { rollFromTable, ITEM_INFO } from '../data/loot.js';
import { pushLog } from './log.js';
import { gainXp } from './progression.js';

// Pure state transition: apply the player's melee/ranged attack against `animal`.
// Caller handles cosmetic side-effects (hit flashes, screen shake).
// Returns the new state.
export function applyAttack(prev, animal) {
  let s = { ...prev, inventory: { ...prev.inventory }, skills: { ...prev.skills } };
  const prof = PROFESSIONS[s.profession];
  let dmg = 8 + Math.floor(s.skills.hunting * 2) + (s.equipment.hasKnife ? 4 : 0);
  if (prof.mods.huntingDmgBonus && ['rabbit','deer','wolf','boar','bear','seal','raven'].includes(animal.type)) {
    dmg = Math.floor(dmg * prof.mods.huntingDmgBonus);
  }
  if (prof.mods.combatBonus) dmg = Math.floor(dmg * prof.mods.combatBonus);
  if (prof.mods.combatPenalty) dmg = Math.floor(dmg * prof.mods.combatPenalty);
  if (s.inventory.rifle > 0) dmg += 15;
  else if (s.inventory.hunting_bow > 0) dmg += 8;
  else if (s.inventory.hatchet > 0) dmg += 5;

  const newAnimals = s.animals.map(a => {
    if (a === animal) {
      const newHp = a.hp - dmg;
      if (newHp <= 0) {
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
        s = gainXp(s, 'hunting', 15);
        return { ...a, hp: 0 };
      }
      if (a.type === 'boar') a.aggro = true;
      return { ...a, hp: newHp };
    }
    return a;
  });
  s.animals = newAnimals.filter(a => a.hp > 0);
  s.player = { ...s.player, stamina: Math.max(0, s.player.stamina - 12) };
  return s;
}
