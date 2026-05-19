import { PROFESSIONS } from '../data/professions.js';

export const SAVE_KEY = 'wintersedge.save.v1';

export function saveGame(state, map, fog) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ts: Date.now(), state, map, fog }));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') { clearSave(); return null; }
    const { state, map, fog } = data;
    if (!state || !state.player || typeof state.day !== 'number'
        || !PROFESSIONS[state.profession]
        || !Array.isArray(map) || !Array.isArray(fog)) {
      clearSave();
      return null;
    }
    // Backfill defaults for fields introduced after this save was written.
    return {
      ...data,
      state: {
        ...state,
        combatTarget: state.combatTarget ?? null,
        harvestTarget: state.harvestTarget ?? null,
        tileHp: state.tileHp ?? {},
        characterXp: state.characterXp ?? 0,
        characterLevel: state.characterLevel ?? 1,
        unspentStatPoints: state.unspentStatPoints ?? 0,
        statUpgrades: state.statUpgrades ?? { vitality: 0, insulation: 0, endurance: 0, power: 0 },
        player: {
          ...state.player,
          maxHp: state.player.maxHp ?? 100,
          maxWarmth: state.player.maxWarmth ?? 100,
          maxHunger: state.player.maxHunger ?? 100,
          maxStamina: state.player.maxStamina ?? 100,
          lastAttackMs: state.player.lastAttackMs ?? 0,
          lungeUntil: state.player.lungeUntil ?? 0,
        },
      },
    };
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}
