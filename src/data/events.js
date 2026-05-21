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

export const OUTBREAK_EVENT_TABLE = [
  // Shared events (kept from wilderness, still make sense)
  { id: 'calm', weight: 15, min_day: 1, name: 'Quiet Day', desc: 'The dead are silent... for now.' },
  { id: 'aurora', weight: 8, min_day: 1, name: 'Aurora Forecast', desc: '✨ Aurora tonight. Warmth drains less.' },
  { id: 'cold_snap', weight: 6, min_day: 4, name: 'Bitter Cold Snap', desc: '🥶 Warmth drains faster today.' },
  { id: 'thaw', weight: 5, min_day: 6, name: 'Brief Thaw', desc: '☀️ Warm front. Vitals recover faster.' },
  { id: 'blizzard_warning', weight: 4, min_day: 5, name: 'Storm Brewing', desc: '⛈️ Blizzard likely tonight. Zombies may be slowed.' },
  { id: 'crate_signal', weight: 5, min_day: 3, name: 'Distant Engine', desc: '✈️ Plane overhead. Supply crate dropped.' },

  // Outbreak-specific events
  { id: 'big_horde', weight: 10, min_day: 5, name: 'Big Horde Tonight', desc: '🧟‍♂️ Scouts report a massive wave gathering. Tonight\'s horde will be 50% larger.' },
  { id: 'fast_zombies', weight: 8, min_day: 7, name: 'Runners Spotted', desc: '🏃 Some of the dead are moving faster today. Zombie move speed +50% tonight.' },
  { id: 'weapon_cache', weight: 7, min_day: 3, name: 'Weapon Cache Found', desc: '🔫 You found a stash. +1 rifle OR +1 hunting bow (random).' },
  { id: 'ammo_cache', weight: 7, min_day: 2, name: 'Ammo Cache', desc: '🎯 Found ammunition. +5 scrap (ammo placeholder).' },
  { id: 'respite', weight: 6, min_day: 8, name: 'Quiet Night', desc: '🌙 The horde seems thin tonight. Wave size reduced by 50%.' },
  { id: 'screamer_spotted', weight: 5, min_day: 10, name: 'Screamer Spotted', desc: '😱 A screamer is in tonight\'s wave. It will call reinforcements. (Future: screamer zombie type. For now: +25% wave size.)' },
  { id: 'survivor_radio', weight: 4, min_day: 6, name: 'Survivor on the Radio', desc: '📻 A voice on the radio. "Hold on... we\'re coming." +50 XP for hope.' },
  { id: 'fortify', weight: 6, min_day: 4, name: 'Time to Fortify', desc: '🛡️ Clear skies, calm winds. Building costs reduced today.' },
];

export function rollDailyEvent(day, mode = 'wilderness') {
  const table = mode === 'outbreak' ? OUTBREAK_EVENT_TABLE : EVENT_TABLE;
  const valid = table.filter(e => day >= e.min_day);
  const total = valid.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of valid) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return valid[0];
}
