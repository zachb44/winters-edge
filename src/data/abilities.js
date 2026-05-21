// Profession ability definitions, keyed by profession id and level milestone.
//
// kind: 'active' | 'passive'
// - active abilities show a button in the hotbar and have an activation handler
// - passive abilities live as flags; combat/loop code reads hasAbility(state, id)
//
// cooldownHours: game-time hours until reactivation. Cooldowns use game-time,
// so they pause automatically when state.time stops advancing.
//
// charges: if set, activation grants that many charges (consumed by chops/mines).
//
// stub: deferred ability — appears in hotbar, click logs "not yet implemented",
// does not start a cooldown.

export const ABILITIES = {
  lumberjack: {
    3: {
      id: 'power_chop',
      name: 'Power Chop',
      kind: 'active',
      emoji: '🪵',
      desc: 'Next 3 tree chops: +2 damage, +50% wood. CD: 1 day.',
      charges: 3,
      cooldownHours: 24,
    },
    5: {
      id: 'hardy',
      name: 'Hardy',
      kind: 'passive',
      emoji: '🥶',
      desc: 'At warmth <30, take 30% less damage.',
    },
    7: {
      id: 'stockpile_mastery',
      name: 'Stockpile Mastery',
      kind: 'passive',
      emoji: '📦',
      desc: 'Stockpiles store 2× capacity. (Awaiting storage system)',
    },
  },
  hunter: {
    3: {
      id: 'track',
      name: 'Track',
      kind: 'active',
      emoji: '👣',
      desc: 'Reveal animals on the visible map for 30s. CD: 12h.',
      cooldownHours: 12,
      stub: true,
    },
    5: {
      id: 'aimed_shot',
      name: 'Aimed Shot',
      kind: 'active',
      emoji: '🎯',
      desc: 'Next attack does 2× damage. CD: 1h.',
      cooldownHours: 1,
      multiplier: 2,
    },
    7: {
      id: 'skin_master',
      name: 'Skin Master',
      kind: 'passive',
      emoji: '🦊',
      desc: 'Animal kills yield +1 pelt.',
    },
  },
  mechanic: {
    3: {
      id: 'salvage',
      name: 'Salvage',
      kind: 'active',
      emoji: '🔧',
      desc: 'Break down 1 weapon for 2-4 scrap.',
      cooldownHours: 0,
    },
    5: {
      id: 'jury_rig',
      name: 'Jury-Rig',
      kind: 'active',
      emoji: '🛠️',
      desc: 'Restore 1 loot use to nearest depleted site. CD: 1 day.',
      cooldownHours: 24,
    },
    7: {
      id: 'lucky_find',
      name: 'Lucky Find',
      kind: 'passive',
      emoji: '🍀',
      desc: '15% chance any loot roll rolls twice (keeps better).',
    },
  },
  medic: {
    3: {
      id: 'field_bandage',
      name: 'Field Bandage',
      kind: 'active',
      emoji: '🩹',
      desc: 'Heal +20 HP using 1 cloth. CD: 1h.',
      cooldownHours: 1,
    },
    5: {
      id: 'diagnose',
      name: 'Diagnose',
      kind: 'passive',
      emoji: '💉',
      desc: 'HP regen rate doubled.',
    },
    7: {
      id: 'stim_pack',
      name: 'Stim Pack',
      kind: 'active',
      emoji: '💊',
      desc: '+50 stamina, +50% move speed for 30s. CD: 1 day.',
      cooldownHours: 24,
      stub: true,
    },
  },
  prospector: {
    3: {
      id: 'power_mine',
      name: 'Power Mine',
      kind: 'active',
      emoji: '⛏️',
      desc: 'Next 3 rock mines: +1 stone each. CD: 1 day.',
      charges: 3,
      cooldownHours: 24,
    },
    5: {
      id: 'cold_forged',
      name: 'Cold Forged',
      kind: 'passive',
      emoji: '🛡️',
      desc: 'All building costs -1 wood and -1 stone (min 1).',
    },
    7: {
      id: 'earth_sense',
      name: 'Earth Sense',
      kind: 'active',
      emoji: '🔮',
      desc: 'Reveal all rocks and caves on map for 30s. CD: 12h.',
      cooldownHours: 12,
      stub: true,
    },
  },
  veteran: {
    3: {
      id: 'battle_cry',
      name: 'Battle Cry',
      kind: 'active',
      emoji: '📣',
      desc: 'Next attack +100% damage. CD: 5 in-game minutes.',
      cooldownHours: 5 / 60,
      multiplier: 2,
    },
    5: {
      id: 'iron_will',
      name: 'Iron Will',
      kind: 'passive',
      emoji: '🛡️',
      desc: 'At HP <30, take 30% less damage.',
    },
    7: {
      id: 'execute',
      name: 'Execute',
      kind: 'passive',
      emoji: '⚔️',
      desc: 'Enemies below 25% HP take 2× damage.',
    },
  },
};

// Flatten lookup: ability id -> definition + profession + unlockLevel.
const _byId = {};
for (const [prof, byLevel] of Object.entries(ABILITIES)) {
  for (const [lvl, def] of Object.entries(byLevel)) {
    _byId[def.id] = { ...def, profession: prof, unlockLevel: Number(lvl) };
  }
}

export function getAbilityDef(id) {
  return _byId[id] || null;
}

// Ability ids the profession unlocks at or before `level`.
export function getUnlocksAt(profession, level) {
  const byLevel = ABILITIES[profession];
  if (!byLevel) return [];
  const ids = [];
  for (const lvl of [3, 5, 7]) {
    if (level >= lvl && byLevel[lvl]) ids.push(byLevel[lvl].id);
  }
  return ids;
}

// The single ability unlocked exactly at this level (or null).
export function getUnlockAtExactly(profession, level) {
  const byLevel = ABILITIES[profession];
  if (!byLevel) return null;
  return byLevel[level] || null;
}
