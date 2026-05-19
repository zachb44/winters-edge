// Initial wildlife placement for a new run. Hand-tuned spawn points so
// the player encounters a representative mix in their starting biome.
// Day-based respawns happen in the main tick loop (game loop hook).
export function spawnInitialAnimals() {
  return [
    { type: 'rabbit', x: 42, y: 8, hp: 10, hostile: false },
    { type: 'rabbit', x: 20, y: 28, hp: 10, hostile: false },
    { type: 'rabbit', x: 50, y: 18, hp: 10, hostile: false },
    { type: 'rabbit', x: 35, y: 25, hp: 10, hostile: false },
    { type: 'rabbit', x: 25, y: 15, hp: 10, hostile: false },
    { type: 'rabbit', x: 15, y: 32, hp: 10, hostile: false },
    { type: 'rabbit', x: 45, y: 22, hp: 10, hostile: false },
    { type: 'deer', x: 48, y: 6, hp: 20, hostile: false },
    { type: 'deer', x: 52, y: 11, hp: 20, hostile: false },
    { type: 'deer', x: 44, y: 14, hp: 20, hostile: false },
    { type: 'wolf', x: 52, y: 25, hp: 25, hostile: true },
    { type: 'wolf', x: 10, y: 30, hp: 25, hostile: true },
    { type: 'wolf', x: 8, y: 38, hp: 25, hostile: true },
    { type: 'boar', x: 22, y: 35, hp: 35, hostile: true, aggro: false },
    { type: 'boar', x: 28, y: 38, hp: 35, hostile: true, aggro: false },
    { type: 'bear', x: 50, y: 38, hp: 80, hostile: true, territorial: true, homeX: 50, homeY: 38 },
    { type: 'seal', x: 11, y: 14, hp: 15, hostile: false },
    { type: 'seal', x: 9, y: 17, hp: 15, hostile: false },
    { type: 'seal', x: 13, y: 11, hp: 15, hostile: false },
    { type: 'raven', x: 30, y: 10, hp: 5, hostile: false },
    { type: 'raven', x: 40, y: 30, hp: 5, hostile: false },
    { type: 'raven', x: 5, y: 5, hp: 5, hostile: false },
  ];
}
