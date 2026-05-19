import { VISION_RADIUS } from '../constants.js';

// vis level: 2 = currently in sight (within VISION_RADIUS of player),
//            1 = previously explored (in fog memory),
//            0 = unknown / unexplored.
export function visibilityAt(fog, px, py, x, y) {
  const dx = x - px, dy = y - py;
  if (dx*dx + dy*dy <= VISION_RADIUS * VISION_RADIUS) return 2;
  return fog[y] && fog[y][x] ? 1 : 0;
}
