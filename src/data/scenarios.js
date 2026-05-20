export const SCENARIOS = {
  rescue: {
    name: { wilderness: 'Wait for Rescue', outbreak: 'Hold the Line' },
    desc: {
      wilderness: 'Survive 30 days. A rescue chopper is coming.',
      outbreak: 'Survive 30 nights. Hold your position until extraction arrives.',
    },
    difficulty: 'Medium',
    icon: '🚁',
    days: 30,
  },
  tower: {
    name: { wilderness: 'Reach the Radio Tower', outbreak: 'Reach the Radio Tower' },
    desc: {
      wilderness: 'Bring 10 food, 5 wood, and your coat to the radio tower.',
      outbreak: 'Fight through the horde to reach the radio tower and call for extraction.',
    },
    difficulty: 'Medium-Hard',
    icon: '📡',
  },
};
