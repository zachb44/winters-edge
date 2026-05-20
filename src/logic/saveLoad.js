import { PROFESSIONS } from '../data/professions.js';
import { resetZombieIds } from './zombies.js';

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
    const zombies = Array.isArray(state.zombies) ? state.zombies : [];
    if (zombies.length > 0) {
      const maxId = zombies.reduce((m, z) => Math.max(m, z.id || 0), 0);
      resetZombieIds(maxId + 1);
    } else {
      resetZombieIds(1);
    }
    return {
      ...data,
      state: {
        ...state,
        mode: state.mode ?? 'wilderness',
        combatTarget: state.combatTarget ?? null,
        combatTargetType: state.combatTargetType ?? null,
        zombies,
        // Old saves without spawnZones fall through to edge spawning via
        // spawnSubWave's length check. Don't backfill from SPAWN_ZONES here
        // — those zones aren't stamped on the old map and would look weird.
        spawnZones: Array.isArray(state.spawnZones) ? state.spawnZones : [],
        wave: {
          nightNumber: 0, totalToSpawn: 0, spawned: 0, subWaveIndex: 0, nextSubWaveTime: null, active: false,
          activeZoneIds: [], activeZoneNames: [],
          ...(state.wave || {}),
          activeZoneIds: state.wave?.activeZoneIds ?? [],
          activeZoneNames: state.wave?.activeZoneNames ?? [],
        },
        isNightPhase: state.isNightPhase ?? false,
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
