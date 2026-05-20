export const ZOMBIE_TYPES = {
  shambler: {
    name: 'Shambler',
    emoji: '🧟',
    hp: 30,
    damage: 6,
    attackSpeed: 1800,
    moveSpeed: 2.5,
    xpReward: 15,
    aggroRange: 6,
    loot: [
      { item: 'cloth', chance: 0.4, qty: 1 },
      { item: 'scrap', chance: 0.25, qty: 1 },
    ],
    desc: 'Slow but relentless. They never stop coming.',
  },
};

// moveSpeed (tiles per in-game minute) is scaled to tick cadence here so the
// shambler (2.5) ends up slower than the every-8-tick animal cadence.
export function zombieTicksPerMove(moveSpeed) {
  return Math.max(1, Math.round(30 / moveSpeed));
}
