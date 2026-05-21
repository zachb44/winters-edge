// Visual / map dimensions
export const TILE = 32;
export const MAP_W = 120;
export const MAP_H = 90;
export const VIEW_W = 24;
export const VIEW_H = 18;
export const VISION_RADIUS = 5;

// WC3-style day/night cycle: 1 in-game day = 480 real seconds at gameSpeed 1x.
// All in-game-time-dependent rates (hunger, warmth, HP env, fuel, regrowth)
// multiply by TIME_SCALE so they stretch with the longer day.
export const TIME_SCALE = 0.025;
