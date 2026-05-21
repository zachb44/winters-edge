import { useEffect, useRef } from 'react';
import { MAP_W, MAP_H, TIME_SCALE } from '../constants.js';
import { T, TILE_DATA } from '../data/tiles.js';
import { PROFESSIONS } from '../data/professions.js';
import { BUILDINGS } from '../data/buildings.js';
import { rollDailyEvent } from '../data/events.js';
import { newAnimalId } from '../logic/animals.js';
import { applyAttack } from '../logic/combat.js';
import { applyHarvest } from '../logic/harvest.js';
import { applyXp, XP_REWARDS } from '../data/leveling.js';
import {
  ANIMAL_ATTACK_SPEED,
  ANIMAL_DAMAGE,
  ENGAGEMENT_CHARGE_MS,
  STAMINA_COST_PER_SWING,
  STAMINA_FLOOR_TO_SWING,
  computePlayerAttackSpeed,
  computePlayerRange,
} from '../data/combat.js';
import { HARVEST_SWING_MS, HARVEST_STAMINA_FLOOR, HARVEST_RANGE } from '../data/harvest.js';
import { MODE_CONFIG } from '../data/modeConfig.js';
import { ZOMBIE_TYPES, zombieTicksPerMove } from '../data/zombies.js';
import { applyZombieAttack, getWaveSize, spawnSubWave, despawnAllZombies } from '../logic/zombies.js';
import { SPAWN_ZONES } from '../data/spawnZones.js';
import { hasAbility } from '../logic/abilities.js';

// Main game tick. Runs every 100ms while gameStarted && !paused && !dead && !rescued.
// All state transitions go through setState(prev => next) so the hook stays pure
// outside of the cosmetic side-effect of calling setMap when a tree regrows.
//
// Owns tickRef internally; returns { resetTick } so the caller can reset the
// counter on startGame / continueGame.
export function useGameLoop({ gameStarted, state, setState, map, setMap, moveTarget, addLog, onPlayerSwing, onAnimalSwing }) {
  const tickRef = useRef(0);

  useEffect(() => {
    if (!gameStarted || state.paused || state.dead || state.rescued) return;
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.dead || prev.rescued) return prev;
        tickRef.current++;
        let s = { ...prev };
        const prof = PROFESSIONS[s.profession];
        // Dynamic map dims — old saves can be 60×45 while constants are now
        // 120×90. Falling back to constants protects against a transient
        // empty map between mode switches.
        const W = map[0]?.length ?? MAP_W;
        const H = map.length || MAP_H;

        s.time = s.time + 0.2 * s.gameSpeed * TIME_SCALE;
        if (s.time >= 24) {
          s.time = s.time - 24;
          s.day += 1;
          s.buildingCostReduction = 0;
          s = addLog(s, `--- Day ${s.day} ---`);
          s = applyXp(s, XP_REWARDS.surviveDay);
          const event = rollDailyEvent(s.day, s.mode || 'wilderness');
          s.currentEvent = event;
          s.eventEffects = {};
          s = addLog(s, `📅 ${event.name}: ${event.desc}`);
          if (event.id === 'wolf_pack') {
            for (let i = 0; i < 2; i++) {
              let wx, wy, tries = 0;
              do {
                wx = Math.floor(Math.random() * W);
                wy = Math.floor(Math.random() * H);
                tries++;
              } while (tries < 30 && (!map[wy] || !TILE_DATA[map[wy][wx]].walkable || Math.abs(wx - s.player.x) + Math.abs(wy - s.player.y) < 8));
              if (tries < 30) s.animals = [...s.animals, { type: 'wolf', x: wx, y: wy, hp: 25, maxHp: 25, hostile: true, id: newAnimalId() }];
            }
            s.eventEffects.extraWolfAggression = true;
          } else if (event.id === 'cold_snap') s.eventEffects.coldSnap = true;
          else if (event.id === 'aurora') s.eventEffects.aurora = true;
          else if (event.id === 'deer_migration') {
            for (let i = 0; i < 3; i++) {
              let dx, dy, tries = 0;
              do {
                dx = 38 + Math.floor(Math.random() * 18);
                dy = 3 + Math.floor(Math.random() * 13);
                tries++;
              } while (tries < 20 && (!map[dy] || !TILE_DATA[map[dy][dx]].walkable));
              if (tries < 20) s.animals = [...s.animals, { type: 'deer', x: dx, y: dy, hp: 20, maxHp: 20, hostile: false, id: newAnimalId() }];
            }
          } else if (event.id === 'crate_signal' || event.id === 'cache_rumor') {
            s.nextCrateDay = s.day;
          } else if (event.id === 'thaw') s.eventEffects.thaw = true;
          else if (event.id === 'frozen_carcass') {
            const cx = Math.max(1, Math.min(W - 2, s.player.x + (Math.random() < 0.5 ? -3 : 3) + Math.floor(Math.random() * 3)));
            const cy = Math.max(1, Math.min(H - 2, s.player.y + (Math.random() < 0.5 ? -3 : 3) + Math.floor(Math.random() * 3)));
            s.pendingCarcass = { x: cx, y: cy };
          } else if (event.id === 'blizzard_warning') s.eventEffects.blizzardIncoming = true;
          else if (event.id === 'bear_roaming') {
            s.animals = s.animals.map(a => {
              if (a.type === 'bear') {
                let bx, by, tries = 0;
                do {
                  bx = Math.floor(Math.random() * W);
                  by = Math.floor(Math.random() * H);
                  tries++;
                } while (tries < 20 && (!map[by] || !TILE_DATA[map[by][bx]].walkable));
                if (tries < 20) return { ...a, x: bx, y: by, homeX: bx, homeY: by };
              }
              return a;
            });
          } else if (event.id === 'lost_traveler') {
            s.pendingTraveler = { resolved: false };
          } else if (event.id === 'big_horde') {
            s.waveMultiplier = 1.5;
          } else if (event.id === 'fast_zombies') {
            s.zombieSpeedMultiplier = 1.5;
          } else if (event.id === 'respite') {
            s.waveMultiplier = 0.5;
          } else if (event.id === 'screamer_spotted') {
            // TODO: when screamer zombie type exists, guarantee one spawns in
            // the wave instead of (or alongside) the size bump.
            s.waveMultiplier = 1.25;
          } else if (event.id === 'weapon_cache') {
            s.inventory = { ...s.inventory };
            if (Math.random() > 0.5) {
              s.inventory.rifle = (s.inventory.rifle || 0) + 1;
              s = addLog(s, '🔫 Weapon cache: +1 rifle');
            } else {
              s.inventory.hunting_bow = (s.inventory.hunting_bow || 0) + 1;
              s = addLog(s, '🏹 Weapon cache: +1 hunting bow');
            }
          } else if (event.id === 'ammo_cache') {
            s.inventory = { ...s.inventory, scrap: (s.inventory.scrap || 0) + 5 };
            s = addLog(s, '🎯 Ammo cache: +5 scrap');
          } else if (event.id === 'survivor_radio') {
            s = applyXp(s, 50);
          } else if (event.id === 'fortify') {
            s.buildingCostReduction = 2;
          }
          if (s.day === 30 && s.scenario === 'rescue' && s.mode !== 'outbreak') {
            s.rescued = true;
            s = addLog(s, '🎉 RESCUE HELICOPTER ARRIVES! You survived!');
            return s;
          }

          // Slow respawn at map edges (skips wolves/bears — they stay rare)
          if (s.day >= (s.nextRespawnDay ?? 5)) {
            const count = 1 + Math.floor(Math.random() * 2);
            const stats = { rabbit: { hp: 10, maxHp: 10, hostile: false }, deer: { hp: 20, maxHp: 20, hostile: false }, raven: { hp: 5, maxHp: 5, hostile: false } };
            for (let i = 0; i < count; i++) {
              const r = Math.random();
              const type = r < 0.5 ? 'rabbit' : r < 0.8 ? 'deer' : 'raven';
              let sx, sy, tries = 0, ok = false;
              while (tries < 30 && !ok) {
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) { sx = Math.floor(Math.random() * W); sy = Math.floor(Math.random() * 3); }
                else if (edge === 1) { sx = Math.floor(Math.random() * W); sy = H - 1 - Math.floor(Math.random() * 3); }
                else if (edge === 2) { sx = Math.floor(Math.random() * 3); sy = Math.floor(Math.random() * H); }
                else { sx = W - 1 - Math.floor(Math.random() * 3); sy = Math.floor(Math.random() * H); }
                const distToPlayer = Math.abs(sx - s.player.x) + Math.abs(sy - s.player.y);
                if (map[sy] && TILE_DATA[map[sy][sx]].walkable && distToPlayer >= 10) ok = true;
                tries++;
              }
              if (ok) s.animals = [...s.animals, { type, x: sx, y: sy, ...stats[type], id: newAnimalId() }];
            }
            s.nextRespawnDay = s.day + 4 + Math.floor(Math.random() * 3);
          }
        }

        const isNight = s.time < 6 || s.time > 19;
        let nearFire = false, inShelter = false;
        for (const b of s.buildings) {
          const d = Math.abs(b.x - s.player.x) + Math.abs(b.y - s.player.y);
          if (b.type === 'campfire' && b.fuel > 0 && d <= 3) nearFire = true;
          if (b.type === 'tent' && d === 0) inShelter = true;
        }
        if (map[s.player.y] && map[s.player.y][s.player.x] === T.CAVE) inShelter = true;

        const warmthBase = MODE_CONFIG[s.mode || 'wilderness'].warmthDrain;
        // 7/3 preserves the wilderness day/night ratio (-0.3 / -0.7) for any mode's base.
        let warmthDelta = -warmthBase;
        if (isNight) warmthDelta = -warmthBase * (7 / 3);
        if (s.weather === 'blizzard') warmthDelta -= 0.5;
        if (s.eventEffects.coldSnap) warmthDelta -= 0.4;
        if (s.eventEffects.aurora && isNight) warmthDelta += 0.3;
        if (s.eventEffects.thaw) warmthDelta += 0.2;
        if (nearFire) warmthDelta = Math.max(warmthDelta + 1.5, 0.5);
        if (inShelter && isNight) warmthDelta = Math.max(warmthDelta + 0.8, -0.1);
        if (s.equipment.hasCoat) warmthDelta += 0.2;
        if (s.inventory.fur_coat > 0) warmthDelta += 0.3;
        if (prof.mods.warmthRetention && warmthDelta < 0) warmthDelta *= prof.mods.warmthRetention;
        if (s.day <= 3 && warmthDelta < 0) warmthDelta *= 0.8;
        s.player.warmth = Math.max(0, Math.min(s.player.maxWarmth ?? 100, s.player.warmth + warmthDelta * TIME_SCALE));

        const hungerBase = MODE_CONFIG[s.mode || 'wilderness'].hungerDrain;
        const hungerDrain = hungerBase * (prof.mods.hungerDrain || 1) * TIME_SCALE;
        s.player.hunger = Math.max(0, s.player.hunger - hungerDrain);
        if (!moveTarget) s.player.stamina = Math.min(s.player.maxStamina ?? 100, s.player.stamina + 0.5);
        if (s.player.warmth < 20) {
          s.player.hp = Math.max(0, s.player.hp - 0.5 * TIME_SCALE);
          if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'You froze to death.';
        }
        if (s.player.hunger < 15) {
          s.player.hp = Math.max(0, s.player.hp - 0.3 * TIME_SCALE);
          if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'You starved.';
        }
        const regenThreshold = s.eventEffects.thaw ? 50 : 60;
        if (s.player.warmth > regenThreshold && s.player.hunger > 50 && s.player.hp > 0 && s.player.hp < 100) {
          let regenAmount = s.eventEffects.thaw ? 0.4 : 0.2;
          if (prof.mods.hpRegenBonus) regenAmount *= prof.mods.hpRegenBonus;
          if (hasAbility(s, 'diagnose')) regenAmount *= 2;
          s.player.hp = Math.min(s.player.maxHp ?? 100, s.player.hp + regenAmount * TIME_SCALE);
        }

        if (s.player.hp <= 0) {
          s.dead = true;
          s = addLog(s, '💀 You have died.');
          return s;
        }

        if (s.scenario === 'tower' && map[s.player.y] && map[s.player.y][s.player.x] === T.TOWER) {
          if (s.inventory.food + s.inventory.cooked_meat >= 10 && s.inventory.wood >= 5 && s.equipment.hasCoat) {
            s.rescued = true;
            s = addLog(s, '📡 Radio activated. Rescue inbound! YOU WIN!');
            return s;
          }
        }

        s.buildings = s.buildings.map(b => {
          if (b.type !== 'campfire') return b;
          if (b.fuel <= 0) return b;
          const newFuel = b.fuel - 0.05 * s.gameSpeed * TIME_SCALE;
          if (newFuel <= 0 && !b.wentOutLogged) {
            s = addLog(s, '🔥 Campfire went out.');
            return { ...b, fuel: 0, wentOutLogged: true };
          }
          return { ...b, fuel: Math.max(0, newFuel) };
        });

        if (tickRef.current % 50 === 0) {
          s.buildings.forEach(b => {
            if (b.type === 'trap' && !b.caught && Math.random() < 0.15) b.caught = true;
          });
        }

        // Corpse decay: drop corpses older than 4 in-game hours.
        if ((s.corpses || []).length > 0) {
          const nowHours = s.day * 24 + s.time;
          const fresh = s.corpses.filter(c => {
            const spawned = c.spawnDay * 24 + c.spawnTime;
            return nowHours - spawned < 4;
          });
          if (fresh.length !== s.corpses.length) s.corpses = fresh;
        }

        const newTrees = { ...s.trees };
        for (const key in newTrees) {
          newTrees[key] -= 0.2 * s.gameSpeed * TIME_SCALE / 24;
          if (newTrees[key] <= 0) {
            const parts = key.split(',');
            const tx = Number(parts[0]), ty = Number(parts[1]);
            setMap(m => {
              const nm = m.map(r => [...r]);
              if (nm[ty] && nm[ty][tx] === T.SNOW) nm[ty][tx] = T.TREE;
              return nm;
            });
            delete newTrees[key];
          }
        }
        s.trees = newTrees;

        if (s.day >= s.nextCrateDay && s.time > 8 && s.time < 10 && tickRef.current % 30 === 0) {
          let cx, cy, attempts = 0;
          do {
            cx = Math.floor(Math.random() * W);
            cy = Math.floor(Math.random() * H);
            attempts++;
          } while (attempts < 20 && (!map[cy] || !TILE_DATA[map[cy][cx]].walkable));
          if (attempts < 20) {
            s.crates = [...s.crates, { x: cx, y: cy, looted: false }];
            s.nextCrateDay = s.day + 4 + Math.floor(Math.random() * 3);
            s = addLog(s, '📦 Supply crate spotted on the map!');
          }
        }

        // ===== Combat: per-tick swing checks =====
        const now = Date.now();
        const isFirstNight = (s.day === 1 && s.time >= 18) || (s.day === 2 && s.time < 6);

        // Unified player swing engine — drives combat OR harvest from the
        // same lastAttackMs timer + lunge. Player can only engage one at
        // a time; the click router enforces mutual exclusion.
        if (s.combatTarget !== null) {
          const isZombieTarget = s.combatTargetType === 'zombie';
          const target = isZombieTarget
            ? s.zombies.find(z => z.id === s.combatTarget)
            : s.animals.find(a => a.id === s.combatTarget);
          if (!target || target.hp <= 0) {
            s.combatTarget = null;
            s.combatTargetType = null;
          } else {
            const td = Math.abs(target.x - s.player.x) + Math.abs(target.y - s.player.y);
            const range = computePlayerRange(s);
            if (td <= range
                && s.player.stamina >= STAMINA_FLOOR_TO_SWING
                && now - (s.player.lastAttackMs || 0) >= computePlayerAttackSpeed(s, PROFESSIONS)) {
              const result = isZombieTarget
                ? applyZombieAttack(s, target.id)
                : applyAttack(s, target.id);
              s = result.state;
              if (result.hit) {
                s.player = { ...s.player, lastAttackMs: now, lungeUntil: now + 200, stamina: Math.max(0, s.player.stamina) };
                if (onPlayerSwing) onPlayerSwing({
                  dmg: result.hit.dmg,
                  lethal: result.hit.lethal,
                  x: result.hit.x,
                  y: result.hit.y,
                  fromX: s.player.x,
                  fromY: s.player.y,
                  weaponType: s.inventory.rifle > 0 ? 'rifle' : (s.inventory.hunting_bow > 0 ? 'bow' : null),
                });
              }
            }
          }
        } else if (s.harvestTarget) {
          const ht = s.harvestTarget;
          // Validate the tile is still a tree/rock (someone else might have
          // chopped it via an event — defensive).
          const stillThere = map[ht.y]?.[ht.x] === ht.tile;
          if (!stillThere) {
            s.harvestTarget = null;
          } else {
            const td = Math.abs(ht.x - s.player.x) + Math.abs(ht.y - s.player.y);
            if (td <= HARVEST_RANGE
                && s.player.stamina >= HARVEST_STAMINA_FLOOR
                && now - (s.player.lastAttackMs || 0) >= HARVEST_SWING_MS) {
              const result = applyHarvest(s);
              s = result.state;
              if (result.hit) {
                s.player = { ...s.player, lastAttackMs: now, lungeUntil: now + 200 };
                if (onPlayerSwing) onPlayerSwing({ dmg: result.hit.dmg, lethal: result.hit.completed, x: result.hit.x, y: result.hit.y });
                if (result.hit.completed) {
                  // Side effect: swap the map tile to SNOW. Trees also register
                  // for the existing regrowth system.
                  const cx = result.hit.x, cy = result.hit.y;
                  setMap(m => {
                    const nm = m.map(r => [...r]);
                    if (nm[cy]) nm[cy][cx] = T.SNOW;
                    return nm;
                  });
                  if (result.hit.tile === T.TREE) {
                    s.trees = { ...s.trees, [`${cx},${cy}`]: 6 };
                  }
                }
              }
            }
          }
        }

        // Animal attacks (per-animal timers).
        // Capture the mapped array in a local first — `s` gets reassigned by
        // addLog inside the callback, so writing back via `s.animals = ...`
        // outside the map ensures the new array lands on the final `s`
        // (otherwise the lastAttackMs updates get stranded on a stale object
        // and the throttle never takes effect).
        const updatedAnimals = s.animals.map(a => {
          if (a.hp <= 0 || !a.hostile) return a;
          const attackMs = ANIMAL_ATTACK_SPEED[a.type];
          if (!attackMs) return a;
          const d = Math.abs(a.x - s.player.x) + Math.abs(a.y - s.player.y);
          // Clear engagement charge when out of attack range so re-engaging
          // triggers a fresh delay.
          if (d > 1) {
            return a.engagementChargedAt ? { ...a, engagementChargedAt: null } : a;
          }
          if (isFirstNight) return a;
          if (a.type === 'boar' && !a.aggro) return a;
          // Charging delay on first adjacency.
          if (a.engagementChargedAt == null) {
            return { ...a, engagementChargedAt: now + ENGAGEMENT_CHARGE_MS };
          }
          if (now < a.engagementChargedAt) return a;
          if (now - (a.lastAttackMs || 0) < attackMs) return a;
          const baseDmg = ANIMAL_DAMAGE[a.type] || 8;
          let dmgTaken = prof.mods.dmgReduction ? Math.floor(baseDmg * prof.mods.dmgReduction) : baseDmg;
          if (hasAbility(s, 'hardy') && s.player.warmth < 30) dmgTaken = Math.floor(dmgTaken * 0.7);
          if (hasAbility(s, 'iron_will') && s.player.hp < 30) dmgTaken = Math.floor(dmgTaken * 0.7);
          dmgTaken = Math.max(1, dmgTaken);
          s.player.hp = Math.max(0, s.player.hp - dmgTaken);
          const msg = a.type === 'wolf' ? '🐺 A wolf attacks!' : a.type === 'boar' ? '🐗 A boar gores you!' : '🐻 THE BEAR MAULS YOU!';
          s = addLog(s, msg);
          if (s.player.hp <= 0 && !s.deathCause) {
            s.deathCause = a.type === 'wolf' ? 'Killed by a wolf.' : a.type === 'boar' ? 'Gored by a boar.' : 'The bear got you.';
          }
          if (onAnimalSwing) onAnimalSwing({ dmg: dmgTaken, animalId: a.id, px: s.player.x, py: s.player.y });
          return { ...a, lastAttackMs: now, lungeUntil: now + 200 };
        });
        s.animals = updatedAnimals;

        // Immediate death check — animal damage above can drop hp to 0 in
        // the same tick. Without this, death only catches on the next tick
        // via the warmth/hunger check at the top, and the regen step can
        // lift hp off 0 before that check sees it.
        if (s.player.hp <= 0 && !s.dead) {
          s.dead = true;
          s = addLog(s, '💀 You have died.');
          return s;
        }

        // Set of "x,y" keys for buildings that block movement. Rebuilt per
        // tick (cheap at current scale) — used by animal and zombie movement.
        const blockingBuildingKeys = new Set();
        for (const b of s.buildings) {
          if (BUILDINGS[b.type]?.walkable === false) blockingBuildingKeys.add(`${b.x},${b.y}`);
        }

        // Animal movement (every 8 ticks). Animals engaged with the player
        // (player.combatTarget === a.id) stay locked in their tile.
        if (tickRef.current % 8 === 0) {
          s.animals = s.animals.map(a => {
            if (a.hp <= 0) return a;
            if (s.combatTarget === a.id) return a;
            let nx = a.x, ny = a.y;
            const dx = s.player.x - a.x;
            const dy = s.player.y - a.y;
            const dist = Math.abs(dx) + Math.abs(dy);

            if (a.type === 'wolf') {
              // Day: chase if within 4 tiles. Night / wolf-pack event: out to 8 / 10.
              const wolfRange = s.eventEffects.extraWolfAggression
                ? 10
                : (isNight ? 8 : 4);
              if (dist < wolfRange) {
                if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
                else ny += Math.sign(dy);
              }
            } else if (a.type === 'boar') {
              // Boars wake up via proximity (sticky). Once aggro'd, chase out to 6.
              const wakeNow = !a.aggro && dist <= 3;
              const aggro = a.aggro || wakeNow;
              if (aggro && dist < 6) {
                if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
                else ny += Math.sign(dy);
              }
              if (wakeNow) {
                nx = Math.max(0, Math.min(W - 1, nx));
                ny = Math.max(0, Math.min(H - 1, ny));
                if (map[ny] && map[ny][nx] !== undefined && TILE_DATA[map[ny][nx]].walkable
                    && !blockingBuildingKeys.has(`${nx},${ny}`)) {
                  return { ...a, x: nx, y: ny, aggro: true };
                }
                return { ...a, aggro: true };
              }
            } else if (a.type === 'bear') {
              if (dist < 5) {
                if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
                else ny += Math.sign(dy);
              } else {
                const hdx = a.homeX - a.x, hdy = a.homeY - a.y;
                if (Math.abs(hdx) + Math.abs(hdy) > 1) {
                  if (Math.abs(hdx) > Math.abs(hdy)) nx += Math.sign(hdx);
                  else ny += Math.sign(hdy);
                }
              }
            } else if (a.type === 'deer') {
              const fleeRange = prof.mods.deerFleeRange || 5;
              if (dist < fleeRange) {
                if (Math.abs(dx) > Math.abs(dy)) nx -= Math.sign(dx);
                else ny -= Math.sign(dy);
              } else if (Math.random() < 0.3) {
                const dir = Math.floor(Math.random() * 4);
                if (dir === 0) nx += 1; else if (dir === 1) nx -= 1;
                else if (dir === 2) ny += 1; else ny -= 1;
              }
            } else if (a.type === 'raven') {
              const dir = Math.floor(Math.random() * 5);
              if (dir === 0) nx += 1; else if (dir === 1) nx -= 1;
              else if (dir === 2) ny += 1; else if (dir === 3) ny -= 1;
              nx = Math.max(0, Math.min(W - 1, nx));
              ny = Math.max(0, Math.min(H - 1, ny));
              return { ...a, x: nx, y: ny };
            } else if (a.type === 'seal') {
              if (Math.random() < 0.1) {
                const dir = Math.floor(Math.random() * 4);
                let tnx = nx, tny = ny;
                if (dir === 0) tnx += 1; else if (dir === 1) tnx -= 1;
                else if (dir === 2) tny += 1; else tny -= 1;
                if (map[tny] && map[tny][tnx] === T.ICE) { nx = tnx; ny = tny; }
              }
            } else {
              const dir = Math.floor(Math.random() * 5);
              if (dir === 0) nx += 1; else if (dir === 1) nx -= 1;
              else if (dir === 2) ny += 1; else if (dir === 3) ny -= 1;
            }

            nx = Math.max(0, Math.min(W - 1, nx));
            ny = Math.max(0, Math.min(H - 1, ny));
            if (map[ny] && map[ny][nx] !== undefined && TILE_DATA[map[ny][nx]].walkable
                && !blockingBuildingKeys.has(`${nx},${ny}`)) {
              return { ...a, x: nx, y: ny };
            }
            return a;
          });
        }

        // ===== Zombie AI (outbreak only) =====
        // Attacks each tick (throttled by attackSpeed). Movement throttled per-zombie
        // by lastMoveTick + zombieTicksPerMove(moveSpeed). Zombies single-mindedly
        // path toward the player, ignore wildlife, and may stack on the same tile.
        if (s.mode === 'outbreak' && s.zombies.length > 0) {
          const tick = tickRef.current;

          // Attack pass.
          let zombiesAfterAttacks = s.zombies.map(z => {
            if (z.hp <= 0) return z;
            const d = Math.abs(z.x - s.player.x) + Math.abs(z.y - s.player.y);
            if (d > 1) return z;
            const type = ZOMBIE_TYPES[z.type];
            if (!type) return z;
            if (now - (z.lastAttackMs || 0) < type.attackSpeed) return z;
            let dmgTaken = prof.mods.dmgReduction ? Math.floor(type.damage * prof.mods.dmgReduction) : type.damage;
            if (hasAbility(s, 'hardy') && s.player.warmth < 30) dmgTaken = Math.floor(dmgTaken * 0.7);
            if (hasAbility(s, 'iron_will') && s.player.hp < 30) dmgTaken = Math.floor(dmgTaken * 0.7);
            dmgTaken = Math.max(1, dmgTaken);
            s.player.hp = Math.max(0, s.player.hp - dmgTaken);
            s = addLog(s, `🧟 A ${type.name.toLowerCase()} claws at you! (-${dmgTaken} HP)`);
            if (s.player.hp <= 0 && !s.deathCause) {
              s.deathCause = `Devoured by a ${type.name.toLowerCase()}.`;
            }
            if (onAnimalSwing) onAnimalSwing({ dmg: dmgTaken, animalId: z.id, px: s.player.x, py: s.player.y });
            return { ...z, lastAttackMs: now, lungeUntil: now + 200 };
          });
          s.zombies = zombiesAfterAttacks;

          if (s.player.hp <= 0 && !s.dead) {
            s.dead = true;
            s = addLog(s, '💀 You have died.');
            return s;
          }

          // Movement pass — sequential per zombie so that building HP and
          // spike-trap usesLeft mutate in order across zombies in the same tick.
          // We rebuild s.zombies and s.buildings as we go.
          const nextZombies = new Array(s.zombies.length);
          for (let zi = 0; zi < s.zombies.length; zi++) {
            const z = s.zombies[zi];
            if (z.hp <= 0) { nextZombies[zi] = z; continue; }
            if (s.combatTargetType === 'zombie' && s.combatTarget === z.id) { nextZombies[zi] = z; continue; }
            let cadence = zombieTicksPerMove(ZOMBIE_TYPES[z.type].moveSpeed);
            cadence = Math.max(1, Math.round(cadence / (s.zombieSpeedMultiplier || 1)));
            if (s.weather === 'blizzard') cadence = Math.max(1, Math.round(cadence * 1.33));
            if (tick - (z.lastMoveTick || 0) < cadence) { nextZombies[zi] = z; continue; }
            const dx = s.player.x - z.x;
            const dy = s.player.y - z.y;
            if (dx === 0 && dy === 0) { nextZombies[zi] = z; continue; }
            const primaryX = Math.abs(dx) >= Math.abs(dy);
            const tryMoves = primaryX
              ? [[Math.sign(dx), 0], [0, Math.sign(dy)]]
              : [[0, Math.sign(dy)], [Math.sign(dx), 0]];

            let resolved = null;
            for (const [mx, my] of tryMoves) {
              if (mx === 0 && my === 0) continue;
              const nx = z.x + mx, ny = z.y + my;
              if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
              if (!map[ny] || map[ny][nx] === undefined) continue;
              if (!TILE_DATA[map[ny][nx]].walkable) continue;
              if (nx === s.player.x && ny === s.player.y) continue;

              const key = `${nx},${ny}`;
              if (blockingBuildingKeys.has(key)) {
                // Find the blocking building (always exists when key is set).
                const bi = s.buildings.findIndex(bb => bb.x === nx && bb.y === ny && BUILDINGS[bb.type]?.walkable === false);
                const blocker = s.buildings[bi];
                const destructible = blocker && blocker.hp > 0;
                if (destructible) {
                  const zType = ZOMBIE_TYPES[z.type];
                  if (now - (z.lastAttackMs || 0) >= zType.attackSpeed) {
                    const newHp = blocker.hp - zType.damage;
                    if (newHp <= 0) {
                      // Destroy: remove from buildings, clear blocker key.
                      s.buildings = s.buildings.filter((_, i) => i !== bi);
                      blockingBuildingKeys.delete(key);
                      s = addLog(s, `🧟 Shamblers destroyed your ${BUILDINGS[blocker.type].name.toLowerCase()}!`);
                    } else {
                      // Damage in place.
                      const newBuildings = [...s.buildings];
                      newBuildings[bi] = { ...blocker, hp: newHp };
                      s.buildings = newBuildings;
                    }
                    resolved = { ...z, lastAttackMs: now, lungeUntil: now + 200, lastMoveTick: tick };
                  } else {
                    // Attack on cooldown — zombie waits, doesn't try other axis.
                    resolved = { ...z, lastMoveTick: tick };
                  }
                  break;
                }
                // Indestructible blocker (wall) — try secondary axis.
                continue;
              }

              // Tile is free: move there, then check for spike trap.
              let movedZ = { ...z, x: nx, y: ny, lastMoveTick: tick };
              const trapIdx = s.buildings.findIndex(bb => bb.x === nx && bb.y === ny && bb.type === 'spike_trap' && (bb.usesLeft ?? 0) > 0);
              if (trapIdx !== -1) {
                const trap = s.buildings[trapIdx];
                const trapDef = BUILDINGS.spike_trap;
                const trapDmg = trapDef.damage;
                const zHpAfter = Math.max(0, movedZ.hp - trapDmg);
                movedZ = { ...movedZ, hp: zHpAfter };
                const newUses = (trap.usesLeft ?? 0) - 1;
                if (newUses <= 0) {
                  s.buildings = s.buildings.filter((_, i) => i !== trapIdx);
                  s = addLog(s, `⚠️ Spike trap hits ${ZOMBIE_TYPES[z.type].name.toLowerCase()}! (-${trapDmg} HP) Trap destroyed.`);
                } else {
                  const newBuildings = [...s.buildings];
                  newBuildings[trapIdx] = { ...trap, usesLeft: newUses };
                  s.buildings = newBuildings;
                  s = addLog(s, `⚠️ Spike trap hits ${ZOMBIE_TYPES[z.type].name.toLowerCase()}! (-${trapDmg} HP)`);
                }
                if (onPlayerSwing) onPlayerSwing({ dmg: trapDmg, lethal: zHpAfter <= 0, x: nx, y: ny });
              }
              resolved = movedZ;
              break;
            }

            nextZombies[zi] = resolved ?? { ...z, lastMoveTick: tick };
          }
          s.zombies = nextZombies;
        }

        // ===== Wave management (outbreak only) =====
        // Night phase: 18:00 -> 06:00. Distinct from the existing 19:00 isNight
        // boundary used for wolf/vision — they intentionally coexist.
        if (s.mode === 'outbreak') {
          const nightPhase = s.time >= 18 || s.time < 6;
          const wasNightPhase = !!s.isNightPhase;

          // Sundown transition: start a new wave.
          if (nightPhase && !wasNightPhase) {
            const nightNumber = s.day;
            const totalToSpawn = Math.max(1, Math.round(getWaveSize(nightNumber) * (s.waveMultiplier || 1)));
            // Lock in the nearest 2 (nights 1-10) or 3 (nights 11+) spawn
            // zones at sundown so threat direction stays stable across
            // sub-waves even if the player moves at night.
            let activeZoneIds = [];
            let activeZoneNames = [];
            if (s.spawnZones && s.spawnZones.length > 0) {
              const k = nightNumber >= 11 ? 3 : 2;
              const nearest = SPAWN_ZONES
                .map(z => ({ z, dist: Math.abs(z.x - s.player.x) + Math.abs(z.y - s.player.y) }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, k);
              activeZoneIds = nearest.map(n => n.z.id);
              activeZoneNames = nearest.map(n => n.z.name);
            }
            s.wave = {
              nightNumber,
              totalToSpawn,
              spawned: 0,
              subWaveIndex: 0,
              nextSubWaveTime: 18.0,
              active: true,
              activeZoneIds,
              activeZoneNames,
            };
            const fromMsg = activeZoneNames.length > 0
              ? ` from the ${activeZoneNames.join(' and ')}`
              : '';
            s = addLog(s, `🧟 Night ${nightNumber} begins — ${totalToSpawn} shamblers approaching${fromMsg}.`);
          }

          // Active wave: spawn sub-waves on schedule.
          if (s.wave?.active && s.wave.subWaveIndex < 4 && s.wave.spawned < s.wave.totalToSpawn) {
            if (s.time >= s.wave.nextSubWaveTime) {
              const remaining = s.wave.totalToSpawn - s.wave.spawned;
              const subwavesLeft = 4 - s.wave.subWaveIndex;
              const count = Math.min(remaining, Math.ceil(remaining / subwavesLeft));
              s = spawnSubWave(s, map, count);
              s.wave = {
                ...s.wave,
                spawned: s.wave.spawned + count,
                subWaveIndex: s.wave.subWaveIndex + 1,
                nextSubWaveTime: s.wave.nextSubWaveTime + 0.5,
              };
            }
          }

          // Dawn transition: despawn + win check.
          if (!nightPhase && wasNightPhase) {
            const survivedNight = s.wave?.nightNumber || 0;
            s = despawnAllZombies(s);
            s = addLog(s, '☀️ Dawn breaks. The dead retreat... for now.');
            s.wave = { ...(s.wave || {}), active: false };
            s.waveMultiplier = 1.0;
            s.zombieSpeedMultiplier = 1.0;
            if (survivedNight >= 30 && s.scenario === 'rescue') {
              s.rescued = true;
              s = addLog(s, '🎉 You held the line for 30 nights. Extraction is here.');
            }
          }

          s.isNightPhase = nightPhase;
        }

        if (tickRef.current % 200 === 0) {
          const r = Math.random();
          const blizzChance = s.eventEffects.blizzardIncoming ? 0.6 : 0.25;
          if (s.day > 5 && r < blizzChance) {
            s.weather = 'blizzard';
            s = addLog(s, '❄️ A blizzard rolls in!');
          } else if (r < 0.5) s.weather = 'snow';
          else s.weather = 'clear';
        }

        return s;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameStarted, state.paused, state.dead, state.rescued, state.gameSpeed, map, moveTarget, addLog, setMap, setState, onPlayerSwing, onAnimalSwing]);

  return { resetTick: () => { tickRef.current = 0; } };
}
