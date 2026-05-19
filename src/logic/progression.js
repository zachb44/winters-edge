import { pushLog } from './log.js';

const SKILL_NAMES = { foraging: 'Foraging', hunting: 'Hunting', crafting: 'Crafting' };

// Add XP to a skill. If it hits the level threshold (currentLevel * 30),
// level up, reset XP, and log a level-up message. Returns the new state.
// Pure: never mutates input.
export function gainXp(state, skill, amount) {
  const xpKey = `${skill}Xp`;
  const skills = { ...state.skills, [xpKey]: state.skills[xpKey] + amount };
  let s = { ...state, skills };
  if (s.skills[xpKey] >= s.skills[skill] * 30) {
    s = {
      ...s,
      skills: { ...s.skills, [skill]: s.skills[skill] + 1, [xpKey]: 0 },
    };
    s = pushLog(s, `🌟 ${SKILL_NAMES[skill]} Lv ${s.skills[skill]}!`);
  }
  return s;
}
