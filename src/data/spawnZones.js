// Outbreak Mode: named spawn zones placed on the map. At sundown the
// active wave locks in the nearest 2-3 zones to the player and all that
// night's sub-waves emerge from there. Zones exist in Wilderness Mode too
// as ambient scenery (player walks over disturbed ground and wonders what
// happened) but never activate.
export const SPAWN_ZONES = [
  {
    id: 'cemetery',
    name: 'Old Cemetery',
    emoji: '🪦',
    x: 65, y: 40,
    desc: 'Weathered headstones jut from the snow. The ground here is disturbed.',
  },
  {
    id: 'field_hospital',
    name: 'Abandoned Field Hospital',
    emoji: '🏥',
    x: 45, y: 30,
    desc: 'Medical tents collapsed under snow. Something went very wrong here.',
  },
  {
    id: 'mass_grave',
    name: 'Mass Grave',
    emoji: '⚰️',
    x: 80, y: 45,
    desc: 'A long trench, barely covered. The smell of decay lingers even in the cold.',
  },
  {
    id: 'crashed_convoy',
    name: 'Wrecked Convoy',
    emoji: '🚛',
    x: 55, y: 70,
    desc: 'Military trucks overturned on the road. Dried blood on the snow.',
  },
  {
    id: 'overrun_camp',
    name: 'Overrun Survivor Camp',
    emoji: '⛺',
    x: 100, y: 50,
    desc: 'Torn tents and scattered belongings. They didn\'t make it.',
  },
];
