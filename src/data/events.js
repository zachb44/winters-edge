export const EVENT_TABLE = [
  { id: 'calm', weight: 25, min_day: 1, name: 'Calm Day', desc: 'The wilderness is quiet today.' },
  { id: 'wolf_pack', weight: 12, min_day: 3, name: 'Wolves Hunting Nearby', desc: '🐺 Wolf pack spotted. Aggressive tonight.' },
  { id: 'aurora', weight: 10, min_day: 1, name: 'Aurora Forecast', desc: '✨ Aurora tonight. Warmth drains less.' },
  { id: 'cold_snap', weight: 10, min_day: 4, name: 'Bitter Cold Snap', desc: '🥶 Warmth drains faster today.' },
  { id: 'deer_migration', weight: 9, min_day: 2, name: 'Deer Migration', desc: '🦌 Deer are moving through.' },
  { id: 'lost_traveler', weight: 7, min_day: 5, name: 'Lost Traveler', desc: '👤 A traveler approaches. Meet at your campfire.' },
  { id: 'cache_rumor', weight: 7, min_day: 3, name: 'Old Cache Rumor', desc: '📜 Hidden cache nearby. Supply crate dropping.' },
  { id: 'frozen_carcass', weight: 6, min_day: 2, name: 'Frozen Carcass', desc: '💀 You spot a carcass — free meat.' },
  { id: 'thaw', weight: 5, min_day: 6, name: 'Brief Thaw', desc: '☀️ Warm front. Vitals recover faster.' },
  { id: 'bear_roaming', weight: 5, min_day: 8, name: 'Bear on the Move', desc: '🐻 The bear has left its territory.' },
  { id: 'crate_signal', weight: 5, min_day: 4, name: 'Distant Engine', desc: '✈️ Plane overhead. Crate dropped.' },
  { id: 'blizzard_warning', weight: 4, min_day: 5, name: 'Storm Brewing', desc: '⛈️ Blizzard likely tonight.' },
];

export function rollDailyEvent(day) {
  const valid = EVENT_TABLE.filter(e => day >= e.min_day);
  const total = valid.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of valid) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return valid[0];
}
