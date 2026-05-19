// Combat tuning constants. All times in milliseconds. Pure data — no React.
// `attackSpeed` = ms between swings. Lower = faster.

export const PLAYER_ATTACK_BASE_MS = 1000;
export const WEAPON_ATTACK_MS = {
  rifle: 1300,
  hunting_bow: 750,
  hatchet: 850,
};

export const ANIMAL_ATTACK_SPEED = {
  wolf: 1000,
  boar: 1500,
  bear: 1700,
};

export const ENGAGEMENT_RANGE = {
  melee: 1,
  bow: 3,
};

export const STAMINA_COST_PER_SWING = 12;
export const STAMINA_FLOOR_TO_SWING = 12;

// Pick the lowest (fastest) weapon ms available, else base. Apply profession
// modifiers (Veteran -200ms). Apply +Power upgrade speed bonus? — spec only
// gives Power +5% damage per stack, not speed. Keep speed independent.
export function computePlayerAttackSpeed(state, professions) {
  let ms = PLAYER_ATTACK_BASE_MS;
  if (state.inventory.rifle > 0) ms = Math.min(ms, WEAPON_ATTACK_MS.rifle);
  if (state.inventory.hunting_bow > 0) ms = Math.min(ms, WEAPON_ATTACK_MS.hunting_bow);
  if (state.inventory.hatchet > 0) ms = Math.min(ms, WEAPON_ATTACK_MS.hatchet);
  const profMods = professions[state.profession]?.mods || {};
  if (profMods.combatBonus) ms -= 200; // Veteran (1.5x dmg) also swings faster
  return Math.max(400, ms);
}

export function computePlayerRange(state) {
  return state.inventory.hunting_bow > 0 || state.inventory.rifle > 0
    ? ENGAGEMENT_RANGE.bow
    : ENGAGEMENT_RANGE.melee;
}
