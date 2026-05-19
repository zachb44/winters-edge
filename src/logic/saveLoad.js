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
    return data;
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}
