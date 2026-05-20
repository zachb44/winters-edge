// Initial wildlife placement for a new run. Hand-tuned spawn points so
// the player encounters a representative mix in their starting biome.
// Day-based respawns happen in the main tick loop (game loop hook).
//
// Each animal carries a unique `id` so combat state can refer to it stably
// even though the animals array is rebuilt every tick.
let _nextAnimalId = 1;
export function newAnimalId() { return _nextAnimalId++; }

export function spawnInitialAnimals() {
  _nextAnimalId = 1;
  const base = [
    // Rabbits — scattered across all 4 quadrants of the 120×90 map.
    { type: 'rabbit', x: 45, y: 10, hp: 10, hostile: false },
    { type: 'rabbit', x: 75, y: 30, hp: 10, hostile: false },
    { type: 'rabbit', x: 20, y: 50, hp: 10, hostile: false },
    { type: 'rabbit', x: 65, y: 55, hp: 10, hostile: false },
    { type: 'rabbit', x: 35, y: 25, hp: 10, hostile: false },
    { type: 'rabbit', x: 90, y: 50, hp: 10, hostile: false },
    { type: 'rabbit', x: 105, y: 45, hp: 10, hostile: false },
    { type: 'rabbit', x: 15, y: 65, hp: 10, hostile: false },
    { type: 'rabbit', x: 50, y: 80, hp: 10, hostile: false },
    { type: 'rabbit', x: 80, y: 85, hp: 10, hostile: false },
    { type: 'rabbit', x: 50, y: 30, hp: 10, hostile: false },
    { type: 'rabbit', x: 85, y: 40, hp: 10, hostile: false },
    { type: 'rabbit', x: 70, y: 65, hp: 10, hostile: false },
    { type: 'rabbit', x: 115, y: 40, hp: 10, hostile: false },
    { type: 'rabbit', x: 60, y: 5, hp: 10, hostile: false },
    // Deer — near tree crescent (~30, 55) and open tundra.
    { type: 'deer', x: 28, y: 50, hp: 20, hostile: false },
    { type: 'deer', x: 32, y: 60, hp: 20, hostile: false },
    { type: 'deer', x: 25, y: 65, hp: 20, hostile: false },
    { type: 'deer', x: 55, y: 40, hp: 20, hostile: false },
    { type: 'deer', x: 45, y: 55, hp: 20, hostile: false },
    { type: 'deer', x: 70, y: 25, hp: 20, hostile: false },
    { type: 'deer', x: 40, y: 5, hp: 20, hostile: false },
    // Wolves — wilderness fringes, kept clear of the outpost zone.
    { type: 'wolf', x: 10, y: 35, hp: 25, hostile: true },
    { type: 'wolf', x: 30, y: 80, hp: 25, hostile: true },
    { type: 'wolf', x: 60, y: 75, hp: 25, hostile: true },
    { type: 'wolf', x: 110, y: 60, hp: 25, hostile: true },
    { type: 'wolf', x: 5, y: 60, hp: 25, hostile: true },
    { type: 'wolf', x: 115, y: 80, hp: 25, hostile: true },
    // Boars — southern half of the map.
    { type: 'boar', x: 40, y: 75, hp: 35, hostile: true, aggro: false },
    { type: 'boar', x: 70, y: 80, hp: 35, hostile: true, aggro: false },
    { type: 'boar', x: 95, y: 85, hp: 35, hostile: true, aggro: false },
    { type: 'boar', x: 100, y: 60, hp: 35, hostile: true, aggro: false },
    { type: 'boar', x: 55, y: 88, hp: 35, hostile: true, aggro: false },
    // Bear — territorial near the new cave system.
    { type: 'bear', x: 100, y: 75, hp: 80, hostile: true, territorial: true, homeX: 100, homeY: 75 },
    // Seals — on / next to the frozen lake (~15, 15).
    { type: 'seal', x: 12, y: 15, hp: 15, hostile: false },
    { type: 'seal', x: 15, y: 13, hp: 15, hostile: false },
    { type: 'seal', x: 18, y: 16, hp: 15, hostile: false },
    { type: 'seal', x: 14, y: 17, hp: 15, hostile: false },
    { type: 'seal', x: 10, y: 12, hp: 15, hostile: false },
    { type: 'seal', x: 16, y: 19, hp: 15, hostile: false },
    // Ravens — decorative, scattered.
    { type: 'raven', x: 50, y: 20, hp: 5, hostile: false },
    { type: 'raven', x: 70, y: 50, hp: 5, hostile: false },
    { type: 'raven', x: 25, y: 70, hp: 5, hostile: false },
    { type: 'raven', x: 100, y: 30, hp: 5, hostile: false },
    { type: 'raven', x: 60, y: 45, hp: 5, hostile: false },
  ];
  return base.map(a => ({ ...a, id: newAnimalId(), maxHp: a.hp }));
}
