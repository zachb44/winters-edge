export const MODE_CONFIG = {
  wilderness: {
    hungerDrain: 0.15,
    warmthDrain: 0.3,
    winLabel: 'Survive 30 days',
    dayLabel: (day) => `Day ${day}`,
    zombiesEnabled: false,
  },
  outbreak: {
    hungerDrain: 0.04,
    warmthDrain: 0.08,
    winLabel: 'Survive 30 nights',
    dayLabel: (day) => `Day ${day}`,
    zombiesEnabled: true,
  },
};
