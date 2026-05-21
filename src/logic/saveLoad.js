import { PROFESSIONS } from '../data/professions.js';
import { BUILDINGS } from '../data/buildings.js';
import { getUnlocksAt } from '../data/abilities.js';
import { resetZombieIds } from './zombies.js';
import { resetCorpseIds } from './combat.js';

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
    const migratedBuildings = Array.isArray(state.buildings)
      ? state.buildings.map(b => {
          const def = BUILDINGS[b.type];
          if (!def) return b;
          let m = b;
          if (def.hp && m.hp === undefined) m = { ...m, hp: def.hp, maxHp: def.maxHp };
          if (def.uses && m.usesLeft === undefined) m = { ...m, usesLeft: def.uses };
          return m;
        })
      : [];
    const zombies = Array.isArray(state.zombies) ? state.zombies : [];
    if (zombies.length > 0) {
      const maxId = zombies.reduce((m, z) => Math.max(m, z.id || 0), 0);
      resetZombieIds(maxId + 1);
    } else {
      resetZombieIds(1);
    }
    const corpses = Array.isArray(state.corpses) ? state.corpses : [];
    if (corpses.length > 0) {
      const maxCid = corpses.reduce((m, c) => Math.max(m, c.id || 0), 0);
      resetCorpseIds(maxCid + 1);
    } else {
      resetCorpseIds(1);
    }

    return {
      ...data,
      state: {
        ...state,
        buildings: migratedBuildings,
        corpses,
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
        waveMultiplier: state.waveMultiplier ?? 1.0,
        zombieSpeedMultiplier: state.zombieSpeedMultiplier ?? 1.0,
        buildingCostReduction: state.buildingCostReduction ?? 0,
        player: {
          ...state.player,
          maxHp: state.player.maxHp ?? 100,
          maxWarmth: state.player.maxWarmth ?? 100,
          maxHunger: state.player.maxHunger ?? 100,
          maxStamina: state.player.maxStamina ?? 100,
          lastAttackMs: state.player.lastAttackMs ?? 0,
          lungeUntil: state.player.lungeUntil ?? 0,
          abilities: (() => {
            const existing = Array.isArray(state.player.abilities) ? [...state.player.abilities] : [];
            const shouldHave = getUnlocksAt(state.profession, state.characterLevel ?? 1);
            for (const id of shouldHave) if (!existing.includes(id)) existing.push(id);
            return existing;
          })(),
          abilityCooldowns: state.player.abilityCooldowns ?? {},
          abilityCharges: state.player.abilityCharges ?? {},
          nextAttackMult: state.player.nextAttackMult ?? 1,
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
