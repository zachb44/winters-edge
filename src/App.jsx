import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TILE, MAP_W, MAP_H, VIEW_W, VIEW_H, VISION_RADIUS, TIME_SCALE } from './constants.js';
import { T, TILE_DATA } from './data/tiles.js';
import { BUILDINGS } from './data/buildings.js';
import { SCENARIOS } from './data/scenarios.js';
import { PROFESSIONS } from './data/professions.js';
import { ITEM_INFO, LOOT_BUDGET, rollFromTable } from './data/loot.js';
import { rollDailyEvent } from './data/events.js';
import { genMap } from './logic/mapGen.js';
import { visibilityAt } from './logic/visibility.js';
import { spawnInitialAnimals } from './logic/animals.js';
import { applyAttack } from './logic/combat.js';
import { gainXp } from './logic/progression.js';
import { pushLog } from './logic/log.js';
import { saveGame, loadGame, clearSave } from './logic/saveLoad.js';
import { Vital } from './components/shared/Vital.jsx';
import { ResourceRow } from './components/shared/ResourceRow.jsx';
import { SkillRow } from './components/shared/SkillRow.jsx';

const initialState = (scenario = 'rescue', startPos = { x: 28, y: 22 }, profession = 'lumberjack', charName = 'Survivor') => {
  const prof = PROFESSIONS[profession];
  const baseInv = {
    wood: 0, stone: 0, scrap: 0, food: 3, raw_meat: 0, cooked_meat: 0, pelts: 0, fat: 0, medkit: 0,
    cloth: 0, flare: 0, dried_meat: 0, lantern: 0, hatchet: 0, hunting_bow: 0, rifle: 0,
    rifle_part: 0, fur_coat: 0, snowshoes: 0, map_fragment: 0, rare_pelt: 0,
  };
  for (const item in prof.startInv) {
    baseInv[item] = (baseInv[item] || 0) + prof.startInv[item];
  }
  const startWarmth = prof.mods.startWarmth || 80;

  return {
    player: { x: startPos.x + 2, y: startPos.y, hp: 100, warmth: startWarmth, hunger: 80, stamina: 100, name: charName },
    profession,
    inventory: baseInv,
    skills: { foraging: 1, hunting: 1, crafting: 1, foragingXp: 0, huntingXp: 0, craftingXp: 0 },
    equipment: { hasKnife: true, hasCoat: true, hasFlareGun: 1 },
    day: 1, time: 8,
    buildings: [],
    animals: [],
    crates: [],
    trees: {},
    weather: 'clear',
    log: [{ msg: `${charName} the ${prof.name} wakes in the wreckage. Cold. Alone.`, day: 1, time: 8 }],
    gameSpeed: 1, paused: true, dead: false, rescued: false,
    scenario,
    nextCrateDay: 4,
    nextRespawnDay: 5,
    currentEvent: null,
    eventEffects: {},
    pendingCarcass: null,
    pendingTraveler: null,
    lootCounts: {},
    showIntro: true,
    crashSiteName: '',
    deathCause: null,
  };
};

export default function WintersEdge() {
  const [gameStarted, setGameStarted] = useState(false);
  const [setupStep, setSetupStep] = useState('scenario');
  const [chosenScenario, setChosenScenario] = useState('rescue');
  const [chosenProfession, setChosenProfession] = useState('lumberjack');
  const [charName, setCharName] = useState('');
  const [mapData, setMapData] = useState(() => genMap());
  const [map, setMap] = useState(mapData.map);
  const [state, setState] = useState(() => initialState('rescue', { x: mapData.startX, y: mapData.startY }, 'lumberjack', 'Survivor'));
  const [fog, setFog] = useState(() => Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false)));
  const [view, setView] = useState({ x: 18, y: 14 });
  const [menu, setMenu] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [hover, setHover] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [snowflakes, setSnowflakes] = useState([]);
  const [hitFlashes, setHitFlashes] = useState([]);
  const [screenShake, setScreenShake] = useState(0);
  const [playerBob, setPlayerBob] = useState(0);
  const [footprints, setFootprints] = useState([]);
  const [mapScale, setMapScale] = useState(1);
  const [dayBanner, setDayBanner] = useState(null);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [savedGameMeta, setSavedGameMeta] = useState(() => {
    const s = loadGame();
    return s ? { day: s.state.day, profession: s.state.profession } : null;
  });
  const refreshSavedMeta = useCallback((stateLike) => {
    setSavedGameMeta({ day: stateLike.day, profession: stateLike.profession });
  }, []);
  const tickRef = useRef(0);

  useEffect(() => {
    const updateScale = () => {
      const barsHeight = 150;
      const sidebarWidth = 300;
      const pad = 24;
      const availH = window.innerHeight - barsHeight - pad;
      const availW = window.innerWidth - sidebarWidth - pad;
      const sH = availH / (VIEW_H * TILE);
      const sW = availW / (VIEW_W * TILE);
      setMapScale(Math.min(1.8, Math.max(0.55, Math.min(sH, sW))));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  const flashIdRef = useRef(0);
  const lastHpRef = useRef(100);

  const startGame = (scenario, profession, name) => {
    const md = genMap();
    setMapData(md);
    setMap(md.map);
    const finalName = name && name.trim() ? name.trim() : 'Survivor';
    const fresh = initialState(scenario, { x: md.startX, y: md.startY }, profession, finalName);
    fresh.animals = spawnInitialAnimals();
    fresh.crashSiteName = md.siteName;
    fresh.showIntro = true;
    fresh.log = [
      { msg: `Crash site: ${md.siteName}.`, day: 1, time: 8 },
      { msg: `${finalName} the ${PROFESSIONS[profession].name} wakes in the wreckage. Cold. Alone.`, day: 1, time: 8 },
    ];
    setState(fresh);
    setFog(Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false)));
    tickRef.current = 0;
    setGameStarted(true);
  };

  const continueGame = () => {
    const save = loadGame();
    if (!save) return;
    setMap(save.map);
    setState({ ...save.state, paused: true, showIntro: false });
    setFog(save.fog);
    tickRef.current = 0;
    setGameStarted(true);
  };

  const saveAndQuit = () => {
    saveGame(state, map, fog);
    refreshSavedMeta(state);
    setGameStarted(false);
    setSetupStep('scenario');
  };

  useEffect(() => {
    if (!gameStarted) return;
    setView({
      x: Math.max(0, Math.min(MAP_W - VIEW_W, state.player.x - Math.floor(VIEW_W / 2))),
      y: Math.max(0, Math.min(MAP_H - VIEW_H, state.player.y - Math.floor(VIEW_H / 2))),
    });
    setFog(prev => {
      const nf = prev.map(r => [...r]);
      for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
        for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
          if (dx*dx + dy*dy <= VISION_RADIUS * VISION_RADIUS) {
            const x = state.player.x + dx;
            const y = state.player.y + dy;
            if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) nf[y][x] = true;
          }
        }
      }
      return nf;
    });
  }, [state.player.x, state.player.y, gameStarted]);

  const addLog = useCallback(pushLog, []);

  // Visual effects loop
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setSnowflakes(prev => {
        const intensity = state.weather === 'blizzard' ? 6 : state.weather === 'snow' ? 2 : 1;
        let next = prev
          .map(f => ({ ...f, y: f.y + f.vy, x: f.x + f.vx }))
          .filter(f => f.y < VIEW_H * TILE + 20);
        for (let i = 0; i < intensity; i++) {
          if (Math.random() < 0.5) {
            next.push({
              id: Math.random(),
              x: Math.random() * VIEW_W * TILE,
              y: -10,
              vy: 1 + Math.random() * 2 + (state.weather === 'blizzard' ? 2 : 0),
              vx: state.weather === 'blizzard' ? -1 - Math.random() * 1.5 : (Math.random() - 0.5) * 0.5,
              size: 1 + Math.random() * 2,
              opacity: 0.4 + Math.random() * 0.5,
            });
          }
        }
        if (next.length > 200) next = next.slice(-200);
        return next;
      });
      setFootprints(prev => prev.filter(f => now - f.ts < 8000));
      setHitFlashes(prev => prev.filter(f => now - f.ts < 500));
      setScreenShake(prev => Math.max(0, prev - 1));
      setPlayerBob(prev => moveTarget ? (prev + 1) % 360 : 0);
    }, 50);
    return () => clearInterval(interval);
  }, [gameStarted, state.weather, moveTarget]);

  // Hit flash + shake on HP drop
  useEffect(() => {
    if (!gameStarted) return;
    if (state.player.hp < lastHpRef.current) {
      const drop = lastHpRef.current - state.player.hp;
      if (drop >= 4) {
        setHitFlashes(prev => [...prev, {
          id: flashIdRef.current++,
          x: state.player.x, y: state.player.y, color: 'red', ts: Date.now(),
        }]);
        setScreenShake(drop >= 15 ? 6 : drop >= 8 ? 4 : 2);
      }
    }
    lastHpRef.current = state.player.hp;
  }, [state.player.hp, gameStarted, state.player.x, state.player.y]);

  // Footprints
  useEffect(() => {
    if (!gameStarted) return;
    setFootprints(prev => [...prev, { x: state.player.x, y: state.player.y, ts: Date.now() }].slice(-20));
  }, [state.player.x, state.player.y, gameStarted]);

  // Autosave: latest snapshot held in a ref so the 60s interval doesn't restart
  const saveSnapshotRef = useRef({ state, map, fog });
  useEffect(() => { saveSnapshotRef.current = { state, map, fog }; });

  // Autosave every 60 seconds
  useEffect(() => {
    if (!gameStarted) return;
    const id = setInterval(() => {
      const snap = saveSnapshotRef.current;
      if (snap.state.dead || snap.state.rescued) return;
      saveGame(snap.state, snap.map, snap.fog);
      refreshSavedMeta(snap.state);
    }, 60000);
    return () => clearInterval(id);
  }, [gameStarted, refreshSavedMeta]);

  // Save on day change
  useEffect(() => {
    if (!gameStarted) return;
    saveGame(state, map, fog);
    refreshSavedMeta(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.day]);

  // Day-change banner (skip day 1 — that's covered by the intro)
  useEffect(() => {
    if (!gameStarted || state.day < 2 || state.showIntro) return;
    setDayBanner({ day: state.day, event: state.currentEvent?.name || '' });
    const t = setTimeout(() => setDayBanner(null), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.day]);

  // Hover tooltip delay (300ms after entering a tile)
  useEffect(() => {
    if (!hover) { setTooltipReady(false); return; }
    const t = setTimeout(() => setTooltipReady(true), 300);
    return () => clearTimeout(t);
  }, [hover]);

  // Save on death / rescue
  useEffect(() => {
    if (!gameStarted) return;
    if (state.dead || state.rescued) {
      saveGame(state, map, fog);
      refreshSavedMeta(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dead, state.rescued]);

  // Main tick
  useEffect(() => {
    if (!gameStarted || state.paused || state.dead || state.rescued) return;
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.dead || prev.rescued) return prev;
        tickRef.current++;
        let s = { ...prev };
        const prof = PROFESSIONS[s.profession];

        s.time = s.time + 0.2 * s.gameSpeed * TIME_SCALE;
        if (s.time >= 24) {
          s.time = s.time - 24;
          s.day += 1;
          s = addLog(s, `--- Day ${s.day} ---`);
          const event = rollDailyEvent(s.day);
          s.currentEvent = event;
          s.eventEffects = {};
          s = addLog(s, `📅 ${event.name}: ${event.desc}`);
          if (event.id === 'wolf_pack') {
            for (let i = 0; i < 2; i++) {
              let wx, wy, tries = 0;
              do {
                wx = Math.floor(Math.random() * MAP_W);
                wy = Math.floor(Math.random() * MAP_H);
                tries++;
              } while (tries < 30 && (!map[wy] || !TILE_DATA[map[wy][wx]].walkable || Math.abs(wx - s.player.x) + Math.abs(wy - s.player.y) < 8));
              if (tries < 30) s.animals = [...s.animals, { type: 'wolf', x: wx, y: wy, hp: 25, hostile: true }];
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
              if (tries < 20) s.animals = [...s.animals, { type: 'deer', x: dx, y: dy, hp: 20, hostile: false }];
            }
          } else if (event.id === 'crate_signal' || event.id === 'cache_rumor') {
            s.nextCrateDay = s.day;
          } else if (event.id === 'thaw') s.eventEffects.thaw = true;
          else if (event.id === 'frozen_carcass') {
            const cx = Math.max(1, Math.min(MAP_W - 2, s.player.x + (Math.random() < 0.5 ? -3 : 3) + Math.floor(Math.random() * 3)));
            const cy = Math.max(1, Math.min(MAP_H - 2, s.player.y + (Math.random() < 0.5 ? -3 : 3) + Math.floor(Math.random() * 3)));
            s.pendingCarcass = { x: cx, y: cy };
          } else if (event.id === 'blizzard_warning') s.eventEffects.blizzardIncoming = true;
          else if (event.id === 'bear_roaming') {
            s.animals = s.animals.map(a => {
              if (a.type === 'bear') {
                let bx, by, tries = 0;
                do {
                  bx = Math.floor(Math.random() * MAP_W);
                  by = Math.floor(Math.random() * MAP_H);
                  tries++;
                } while (tries < 20 && (!map[by] || !TILE_DATA[map[by][bx]].walkable));
                if (tries < 20) return { ...a, x: bx, y: by, homeX: bx, homeY: by };
              }
              return a;
            });
          } else if (event.id === 'lost_traveler') {
            s.pendingTraveler = { resolved: false };
          }
          if (s.day === 30 && s.scenario === 'rescue') {
            s.rescued = true;
            s = addLog(s, '🎉 RESCUE HELICOPTER ARRIVES! You survived!');
            return s;
          }

          // Slow respawn at map edges (skips wolves/bears — they stay rare)
          if (s.day >= (s.nextRespawnDay ?? 5)) {
            const count = 1 + Math.floor(Math.random() * 2);
            const stats = { rabbit: { hp: 10, hostile: false }, deer: { hp: 20, hostile: false }, raven: { hp: 5, hostile: false } };
            for (let i = 0; i < count; i++) {
              const r = Math.random();
              const type = r < 0.5 ? 'rabbit' : r < 0.8 ? 'deer' : 'raven';
              let sx, sy, tries = 0, ok = false;
              while (tries < 30 && !ok) {
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) { sx = Math.floor(Math.random() * MAP_W); sy = Math.floor(Math.random() * 3); }
                else if (edge === 1) { sx = Math.floor(Math.random() * MAP_W); sy = MAP_H - 1 - Math.floor(Math.random() * 3); }
                else if (edge === 2) { sx = Math.floor(Math.random() * 3); sy = Math.floor(Math.random() * MAP_H); }
                else { sx = MAP_W - 1 - Math.floor(Math.random() * 3); sy = Math.floor(Math.random() * MAP_H); }
                const distToPlayer = Math.abs(sx - s.player.x) + Math.abs(sy - s.player.y);
                if (map[sy] && TILE_DATA[map[sy][sx]].walkable && distToPlayer >= 10) ok = true;
                tries++;
              }
              if (ok) s.animals = [...s.animals, { type, x: sx, y: sy, ...stats[type] }];
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

        let warmthDelta = -0.3;
        if (isNight) warmthDelta = -0.7;
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
        s.player.warmth = Math.max(0, Math.min(100, s.player.warmth + warmthDelta * TIME_SCALE));

        const hungerDrain = 0.15 * (prof.mods.hungerDrain || 1) * TIME_SCALE;
        s.player.hunger = Math.max(0, s.player.hunger - hungerDrain);
        if (!moveTarget) s.player.stamina = Math.min(100, s.player.stamina + 0.5);
        if (s.player.warmth < 20) {
          s.player.hp = Math.max(0, s.player.hp - 0.5 * TIME_SCALE);
          if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'You froze to death.';
        }
        if (s.player.hunger < 15) {
          s.player.hp = Math.max(0, s.player.hp - 0.3 * TIME_SCALE);
          if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'You starved.';
        }
        const regenThreshold = s.eventEffects.thaw ? 50 : 60;
        if (s.player.warmth > regenThreshold && s.player.hunger > 50 && s.player.hp < 100) {
          let regenAmount = s.eventEffects.thaw ? 0.4 : 0.2;
          if (prof.mods.hpRegenBonus) regenAmount *= prof.mods.hpRegenBonus;
          s.player.hp = Math.min(100, s.player.hp + regenAmount * TIME_SCALE);
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
          if (b.type === 'campfire' && b.fuel > 0) {
            const newFuel = b.fuel - 0.05 * s.gameSpeed * TIME_SCALE;
            if (newFuel <= 0 && b.fuel > 0) s = addLog(s, '🔥 Campfire went out.');
            return { ...b, fuel: Math.max(0, newFuel) };
          }
          return b;
        });

        if (tickRef.current % 50 === 0) {
          s.buildings.forEach(b => {
            if (b.type === 'trap' && !b.caught && Math.random() < 0.15) b.caught = true;
          });
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
            cx = Math.floor(Math.random() * MAP_W);
            cy = Math.floor(Math.random() * MAP_H);
            attempts++;
          } while (attempts < 20 && (!map[cy] || !TILE_DATA[map[cy][cx]].walkable));
          if (attempts < 20) {
            s.crates = [...s.crates, { x: cx, y: cy, looted: false }];
            s.nextCrateDay = s.day + 4 + Math.floor(Math.random() * 3);
            s = addLog(s, '📦 Supply crate spotted on the map!');
          }
        }

        if (tickRef.current % 8 === 0) {
          s.animals = s.animals.map(a => {
            if (a.hp <= 0) return a;
            let nx = a.x, ny = a.y;
            const dx = s.player.x - a.x;
            const dy = s.player.y - a.y;
            const dist = Math.abs(dx) + Math.abs(dy);

            const isFirstNight = (s.day === 1 && s.time >= 18) || (s.day === 2 && s.time < 6);
            if (a.type === 'wolf' && (isNight || s.eventEffects.extraWolfAggression) && dist < (s.eventEffects.extraWolfAggression ? 10 : 8)) {
              if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
              else ny += Math.sign(dy);
              if (dist <= 1 && !isFirstNight) {
                const baseDmg = 8;
                const dmgTaken = prof.mods.dmgReduction ? Math.floor(baseDmg * prof.mods.dmgReduction) : baseDmg;
                s.player.hp = Math.max(0, s.player.hp - dmgTaken);
                s = addLog(s, '🐺 A wolf attacks!');
                if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'Killed by a wolf.';
              }
            } else if (a.type === 'boar' && a.aggro && dist < 6) {
              if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
              else ny += Math.sign(dy);
              if (dist <= 1) {
                const baseDmg = 12;
                const dmgTaken = prof.mods.dmgReduction ? Math.floor(baseDmg * prof.mods.dmgReduction) : baseDmg;
                s.player.hp = Math.max(0, s.player.hp - dmgTaken);
                s = addLog(s, '🐗 A boar gores you!');
                if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'Gored by a boar.';
              }
            } else if (a.type === 'bear') {
              if (dist < 5) {
                if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
                else ny += Math.sign(dy);
                if (dist <= 1 && !isFirstNight) {
                  const baseDmg = 20;
                  const dmgTaken = prof.mods.dmgReduction ? Math.floor(baseDmg * prof.mods.dmgReduction) : baseDmg;
                  s.player.hp = Math.max(0, s.player.hp - dmgTaken);
                  s = addLog(s, '🐻 THE BEAR MAULS YOU!');
                  if (s.player.hp <= 0 && !s.deathCause) s.deathCause = 'The bear got you.';
                }
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
              nx = Math.max(0, Math.min(MAP_W - 1, nx));
              ny = Math.max(0, Math.min(MAP_H - 1, ny));
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

            nx = Math.max(0, Math.min(MAP_W - 1, nx));
            ny = Math.max(0, Math.min(MAP_H - 1, ny));
            if (map[ny] && map[ny][nx] !== undefined && TILE_DATA[map[ny][nx]].walkable) {
              return { ...a, x: nx, y: ny };
            }
            return a;
          });
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
  }, [gameStarted, state.paused, state.dead, state.rescued, state.gameSpeed, map, moveTarget, addLog]);

  useEffect(() => {
    if (!moveTarget || !gameStarted || state.paused || state.dead) return;
    const moveInterval = setInterval(() => {
      setState(prev => {
        if (!moveTarget) return prev;
        const tx = moveTarget.x, ty = moveTarget.y;
        if (prev.player.x === tx && prev.player.y === ty) {
          setMoveTarget(null);
          return prev;
        }
        if (prev.player.stamina < 5) {
          setMoveTarget(null);
          return addLog(prev, 'Too exhausted to move.');
        }
        let nx = prev.player.x, ny = prev.player.y;
        const dx = tx - nx, dy = ty - ny;
        if (Math.abs(dx) > Math.abs(dy)) nx += Math.sign(dx);
        else ny += Math.sign(dy);
        if (map[ny] && map[ny][nx] !== undefined && TILE_DATA[map[ny][nx]].walkable) {
          return {
            ...prev,
            player: { ...prev.player, x: nx, y: ny, stamina: Math.max(0, prev.player.stamina - 0.5) },
          };
        } else {
          setMoveTarget(null);
          return prev;
        }
      });
    }, 200 / state.gameSpeed);
    return () => clearInterval(moveInterval);
  }, [moveTarget, state.paused, state.dead, state.gameSpeed, map, addLog, gameStarted]);

  const interact = (tx, ty) => {
    const tile = map[ty] && map[ty][tx];
    if (tile === undefined) return;
    const d = Math.abs(tx - state.player.x) + Math.abs(ty - state.player.y);
    if (d > 1) { setMoveTarget({ x: tx, y: ty }); return; }

    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory }, skills: { ...prev.skills } };
      const prof = PROFESSIONS[s.profession];

      if (tile === T.TREE) {
        const woodBonus = prof.mods.woodBonus || 1;
        const earlyBonus = s.day <= 3 ? 1 : 0;
        const amount = Math.floor((2 + Math.floor(s.skills.foraging / 2)) * woodBonus) + earlyBonus;
        s.inventory.wood += amount;
        s = gainXp(s, 'foraging', 5);
        s.player.stamina = Math.max(0, s.player.stamina - 8);
        s = addLog(s, `🪓 Chopped wood (+${amount})`);
        setMap(m => { const nm = m.map(r => [...r]); nm[ty][tx] = T.SNOW; return nm; });
        s.trees = { ...s.trees, [`${tx},${ty}`]: 6 };
      } else if (tile === T.ROCK) {
        s.inventory.stone += prof.mods.miningBonus ? 2 : 1;
        s.player.stamina = Math.max(0, s.player.stamina - (prof.mods.miningBonus ? 7 : 10));
        s = addLog(s, `⛏️ +${prof.mods.miningBonus ? 2 : 1} stone`);
        if (Math.random() < (prof.mods.miningBonus ? 0.55 : 0.4)) {
          setMap(m => { const nm = m.map(r => [...r]); nm[ty][tx] = T.SNOW; return nm; });
        }
      } else if (tile === T.PLANE || tile === T.CABIN) {
        const key = `${tx},${ty}`;
        const lootCounts = { ...(s.lootCounts || {}) };
        const max = LOOT_BUDGET[tile];
        const remaining = key in lootCounts ? lootCounts[key] : max;
        if (remaining <= 0) {
          s = addLog(s, 'Picked clean — nothing left here.');
          return s;
        }
        const tableName = tile === T.PLANE ? 'plane' : 'cabin';
        const label = tile === T.PLANE ? 'Found' : 'Cabin';
        let drops = rollFromTable(tableName);
        if (prof.mods.lootReroll) {
          const d2 = rollFromTable(tableName);
          const t1 = drops.reduce((sum, d) => sum + d.qty, 0);
          const t2 = d2.reduce((sum, d) => sum + d.qty, 0);
          if (t2 > t1) drops = d2;
        }
        if (drops.length === 0) {
          s = addLog(s, 'Nothing useful this time.');
        } else {
          for (const drop of drops) {
            s.inventory[drop.item] = (s.inventory[drop.item] || 0) + drop.qty;
            const info = ITEM_INFO[drop.item];
            s = addLog(s, `${info.icon} ${label}: ${drop.qty}× ${info.name}`);
          }
          lootCounts[key] = remaining - 1;
          if (lootCounts[key] <= 0) {
            s = addLog(s, '🗑️ Picked clean.');
          }
          s.lootCounts = lootCounts;
        }
        s.player.stamina = Math.max(0, s.player.stamina - 3);
      }
      return s;
    });
  };

  const lootCrate = (crate) => {
    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory } };
      const drops = rollFromTable('crate');
      if (drops.length === 0) {
        s.inventory.food += 2;
        s.inventory.scrap += 1;
        s = addLog(s, '📦 Crate: +2 food, +1 scrap');
      } else {
        let msg = '📦 Crate:';
        for (const drop of drops) {
          s.inventory[drop.item] = (s.inventory[drop.item] || 0) + drop.qty;
          msg += ` +${drop.qty}${ITEM_INFO[drop.item].icon}`;
        }
        s = addLog(s, msg);
      }
      s.crates = s.crates.filter(c => c !== crate);
      return s;
    });
  };

  const attack = (animal) => {
    setHitFlashes(prev => [...prev, {
      id: flashIdRef.current++,
      x: animal.x, y: animal.y, color: 'white', ts: Date.now(),
    }]);
    setState(prev => applyAttack(prev, animal));
  };

  const placeBuilding = (tx, ty) => {
    if (!selectedBuild) return;
    const cost = BUILDINGS[selectedBuild];
    if (state.inventory.wood < cost.wood || state.inventory.stone < cost.stone || state.inventory.scrap < cost.scrap) {
      setState(s => addLog(s, 'Not enough resources.'));
      return;
    }
    if (map[ty] && map[ty][tx] !== T.SNOW && map[ty][tx] !== T.ICE) {
      setState(s => addLog(s, 'Cannot build here.'));
      return;
    }
    if (state.buildings.some(b => b.x === tx && b.y === ty)) {
      setState(s => addLog(s, 'Something is already here.'));
      return;
    }
    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory }, skills: { ...prev.skills } };
      s.inventory.wood -= cost.wood;
      s.inventory.stone -= cost.stone;
      s.inventory.scrap -= cost.scrap;
      const nb = { type: selectedBuild, x: tx, y: ty };
      if (selectedBuild === 'campfire') nb.fuel = 10;
      if (selectedBuild === 'trap') nb.caught = false;
      s.buildings = [...s.buildings, nb];
      s = gainXp(s, 'crafting', 10);
      s = addLog(s, `✅ Built ${BUILDINGS[selectedBuild].name}`);
      return s;
    });
    setSelectedBuild(null);
  };

  const interactBuilding = (b) => {
    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory } };
      if (b.type === 'campfire') {
        if (s.pendingTraveler && !s.pendingTraveler.resolved) {
          const r = Math.random();
          if (r < 0.5) {
            if (s.inventory.food > 0) {
              s.inventory.food -= 1;
              const gift = Math.random() < 0.5 ? 'dried_meat' : 'scrap';
              const qty = 2 + Math.floor(Math.random() * 2);
              s.inventory[gift] = (s.inventory[gift] || 0) + qty;
              s = addLog(s, `👤 Shared a ration. They gave ${qty}× ${ITEM_INFO[gift].name}.`);
            } else {
              s = addLog(s, '👤 They were starving but you had no food. They wandered off.');
            }
          } else if (r < 0.8) {
            const gifts = ['medkit','flare','cloth','dried_meat'];
            const gift = gifts[Math.floor(Math.random() * gifts.length)];
            s.inventory[gift] = (s.inventory[gift] || 0) + 1;
            s = addLog(s, `👤 They thanked you and left a ${ITEM_INFO[gift].name} behind.`);
          } else {
            s = addLog(s, '👤 They warmed themselves, muttered about wolves, and slipped away.');
          }
          s.pendingTraveler = { resolved: true };
        }
        if (s.inventory.raw_meat > 0 && b.fuel > 0) {
          s.inventory.raw_meat -= 1;
          s.inventory.cooked_meat += 1;
          s.buildings = s.buildings.map(x => x === b ? { ...x, fuel: Math.max(0, x.fuel - 0.5) } : x);
          s = addLog(s, '🍳 Cooked raw meat');
        } else if (s.inventory.wood >= 1) {
          s.inventory.wood -= 1;
          s.buildings = s.buildings.map(x => x === b ? { ...x, fuel: Math.min(20, x.fuel + 4) } : x);
          s = addLog(s, '🔥 Added wood to fire');
        } else {
          s = addLog(s, 'No wood and no raw meat to cook.');
        }
      } else if (b.type === 'tent') {
        if (s.time > 19 || s.time < 6) {
          s.time = 7;
          s.day += 1;
          s.player.warmth = Math.min(100, s.player.warmth + 30);
          s.player.stamina = 100;
          s = addLog(s, '😴 You sleep through the night.');
          if (s.day === 30 && s.scenario === 'rescue') {
            s.rescued = true;
            s = addLog(s, '🎉 RESCUE!');
          }
        } else s = addLog(s, 'Too early to sleep.');
      } else if (b.type === 'trap') {
        if (b.caught) {
          s.inventory.raw_meat += 1;
          s.buildings = s.buildings.map(x => x === b ? { ...x, caught: false } : x);
          s = addLog(s, '🐰 Trap caught small game (+1 meat)');
        } else s = addLog(s, 'Trap is empty.');
      }
      return s;
    });
  };

  const eat = (type) => {
    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory } };
      const prof = PROFESSIONS[s.profession];
      if (type === 'food' && s.inventory.food > 0) {
        s.inventory.food -= 1;
        s.player.hunger = Math.min(100, s.player.hunger + 30);
        s = addLog(s, '🥫 Ate a ration (+30 hunger)');
      } else if (type === 'raw_meat' && s.inventory.raw_meat > 0) {
        s.inventory.raw_meat -= 1;
        s.player.hunger = Math.min(100, s.player.hunger + 15);
        s = addLog(s, '🍖 Ate raw meat (+15 hunger)');
      } else if (type === 'cooked_meat' && s.inventory.cooked_meat > 0) {
        s.inventory.cooked_meat -= 1;
        s.player.hunger = Math.min(100, s.player.hunger + 40);
        s = addLog(s, '🍗 Ate cooked meat (+40 hunger)');
      } else if (type === 'fat' && s.inventory.fat > 0) {
        s.inventory.fat -= 1;
        s.player.warmth = Math.min(100, s.player.warmth + 25);
        s.player.hunger = Math.min(100, s.player.hunger + 15);
        s = addLog(s, '🟡 Ate fat (+25 warmth, +15 hunger)');
      } else if (type === 'medkit' && s.inventory.medkit > 0) {
        s.inventory.medkit -= 1;
        const healAmount = 50 + (prof.mods.medkitBonus || 0);
        s.player.hp = Math.min(100, s.player.hp + healAmount);
        s = addLog(s, `🏥 Used medkit (+${healAmount} HP)`);
      } else if (type === 'dried_meat' && s.inventory.dried_meat > 0) {
        s.inventory.dried_meat -= 1;
        s.player.hunger = Math.min(100, s.player.hunger + 35);
        s = addLog(s, '🥓 Ate dried meat (+35 hunger)');
      }
      return s;
    });
  };

  useEffect(() => {
    if (!gameStarted) return;
    const handle = (e) => {
      if (e.key === 'b' || e.key === 'B') setMenu(m => m === 'build' ? null : 'build');
      else if (e.key === 'i' || e.key === 'I') setMenu(m => m === 'inventory' ? null : 'inventory');
      else if (e.key === 'k' || e.key === 'K') setMenu(m => m === 'skills' ? null : 'skills');
      else if (e.key === 'h' || e.key === 'H') setMenu(m => m === 'help' ? null : 'help');
      else if (e.key === ' ') { e.preventDefault(); setState(s => ({ ...s, paused: !s.paused })); }
      else if (e.key === '1') setState(s => ({ ...s, gameSpeed: 1 }));
      else if (e.key === '2') setState(s => ({ ...s, gameSpeed: 2 }));
      else if (e.key === '3') setState(s => ({ ...s, gameSpeed: 3 }));
      else if (e.key === 'Escape') { setMenu(null); setSelectedBuild(null); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [gameStarted]);

  const handleTileClick = (tx, ty) => {
    if (selectedBuild) { placeBuilding(tx, ty); return; }
    const d = Math.abs(tx - state.player.x) + Math.abs(ty - state.player.y);

    if (state.pendingCarcass && state.pendingCarcass.x === tx && state.pendingCarcass.y === ty && d <= 1) {
      setState(prev => {
        let s = { ...prev, inventory: { ...prev.inventory } };
        const meatGain = 3 + Math.floor(Math.random() * 4);
        const fatGain = Math.random() < 0.5 ? 1 : 0;
        s.inventory.raw_meat += meatGain;
        if (fatGain) s.inventory.fat += fatGain;
        s.pendingCarcass = null;
        s = addLog(s, `💀 Salvaged: +${meatGain} raw meat${fatGain ? ', +1 fat' : ''}`);
        return s;
      });
      return;
    }

    const crate = state.crates.find(c => c.x === tx && c.y === ty && !c.looted);
    if (crate && d <= 1) { lootCrate(crate); return; }

    const animal = state.animals.find(a => a.x === tx && a.y === ty && a.hp > 0);
    if (animal && d <= 1) { attack(animal); return; }

    const building = state.buildings.find(b => b.x === tx && b.y === ty);
    if (building && d <= 1) { interactBuilding(building); return; }

    const tile = map[ty] && map[ty][tx];
    if (tile === T.TREE || tile === T.ROCK || tile === T.PLANE || tile === T.CABIN) {
      interact(tx, ty);
      return;
    }
    if (tile !== undefined && TILE_DATA[tile].walkable) {
      setMoveTarget({ x: tx, y: ty });
    }
  };

  // SETUP SCREENS
  if (!gameStarted) {
    if (setupStep === 'scenario') {
      return (
        <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">❄️</div>
              <h1 className="text-3xl font-bold text-sky-300">Winter's Edge</h1>
              <p className="text-slate-400 mt-2">A survival game in a frozen wilderness</p>
            </div>
            {savedGameMeta && (
              <div className="mb-6">
                <button onClick={continueGame}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold text-lg">
                  ▶ Continue Run
                </button>
                <div className="text-center text-xs text-slate-400 mt-1">
                  Day {savedGameMeta.day} — {PROFESSIONS[savedGameMeta.profession]?.name || 'Survivor'}
                </div>
                <button onClick={() => { clearSave(); setSavedGameMeta(null); }}
                  className="w-full mt-1 text-xs text-slate-500 hover:text-slate-300">
                  Delete saved game
                </button>
              </div>
            )}
            <div className="space-y-3 mb-6">
              <h2 className="text-lg font-bold text-slate-300">Step 1 of 2 — Choose Your Scenario</h2>
              {Object.entries(SCENARIOS).map(([key, sc]) => (
                <button key={key} onClick={() => setChosenScenario(key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${chosenScenario === key ? 'border-sky-400 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{sc.icon}</span>
                    <span className="text-lg font-bold">{sc.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{sc.difficulty}</span>
                  </div>
                  <p className="text-sm text-slate-300">{sc.desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setSetupStep('character')} className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold text-lg">
              Next: Choose Your Survivor →
            </button>
          </div>
        </div>
      );
    }
    if (setupStep === 'character') {
      const prof = PROFESSIONS[chosenProfession];
      return (
        <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
          <div className="max-w-3xl w-full">
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">{prof.playerEmoji}</div>
              <h1 className="text-2xl font-bold text-sky-300">Choose Your Survivor</h1>
              <p className="text-slate-400 text-sm mt-1">Step 2 of 2 — Each profession plays differently</p>
            </div>
            <div className="mb-4">
              <label className="text-sm text-slate-300 mb-1 block">Name your survivor:</label>
              <input type="text" value={charName} onChange={(e) => setCharName(e.target.value.slice(0, 20))}
                placeholder="Survivor"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-sky-500 outline-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {Object.entries(PROFESSIONS).map(([key, p]) => (
                <button key={key} onClick={() => setChosenProfession(key)}
                  className={`text-left p-3 rounded-lg border-2 transition ${chosenProfession === key ? 'border-sky-400 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-bold">{p.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{p.desc}</p>
                  <div className="text-xs text-green-400">
                    {p.bonuses.map((b, i) => <div key={i}>+ {b}</div>)}
                  </div>
                  <div className="text-xs text-orange-400 mt-1">
                    {p.tradeoffs.map((t, i) => <div key={i}>− {t}</div>)}
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-slate-800 rounded p-3 mb-4 text-xs">
              <div className="font-bold text-slate-300 mb-1">Starting inventory for {prof.name}:</div>
              <div className="text-slate-400">
                {Object.entries(prof.startInv).map(([item, qty]) => (
                  <span key={item} className="inline-block mr-3">
                    {(ITEM_INFO[item] && ITEM_INFO[item].icon) || '•'} {qty} {(ITEM_INFO[item] && ITEM_INFO[item].name) || item}
                  </span>
                ))}
              </div>
              <div className="text-slate-500 mt-2 italic">
                🛬 Your plane will crash at a random location.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSetupStep('scenario')} className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg">← Back</button>
              <button onClick={() => { setSetupStep('scenario'); startGame(chosenScenario, chosenProfession, charName); }}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold text-lg">
                Begin Survival
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <div>• Click to move and interact. Click trees to chop, animals to attack.</div>
              <div>• Build a campfire FAST — warmth kills you quickly.</div>
              <div>• Keys: B I K H, Space=Pause, 1/2/3=Speed</div>
            </div>
          </div>
        </div>
      );
    }
  }

  const isNight = state.time < 6 || state.time > 19;
  const timeStr = `${Math.floor(state.time).toString().padStart(2, '0')}:${Math.floor((state.time % 1) * 60).toString().padStart(2, '0')}`;

  let nearbyPredator = null;
  for (const a of state.animals) {
    if (a.hp <= 0) continue;
    const d = Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y);
    if (a.type === 'bear' && d <= 4) { nearbyPredator = 'bear'; break; }
    if (a.type === 'wolf' && d <= 4 && isNight && nearbyPredator !== 'bear') nearbyPredator = 'wolf';
  }

  let skyColor = 'rgba(0,0,0,0)';
  if (state.time < 5) skyColor = 'rgba(15, 25, 55, 0.6)';
  else if (state.time < 6) skyColor = 'rgba(60, 50, 90, 0.4)';
  else if (state.time < 7) skyColor = 'rgba(255, 150, 90, 0.18)';
  else if (state.time < 18) skyColor = 'rgba(255, 230, 150, 0.06)';
  else if (state.time < 19) skyColor = 'rgba(255, 130, 80, 0.22)';
  else if (state.time < 21) skyColor = 'rgba(60, 50, 90, 0.45)';
  else skyColor = 'rgba(15, 25, 55, 0.55)';

  const weatherOverlay = state.weather === 'blizzard' ? 'rgba(255,255,255,0.25)' : state.weather === 'snow' ? 'rgba(255,255,255,0.08)' : 'transparent';

  const towerProgress = state.scenario === 'tower' ? {
    food: state.inventory.food + state.inventory.cooked_meat,
    foodNeeded: 10,
    wood: state.inventory.wood,
    woodNeeded: 5,
    coat: state.equipment.hasCoat,
  } : null;

  const shakeStyle = screenShake > 0 ? {
    transform: `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`,
    transition: 'transform 0.05s',
  } : {};

  return (
    <div className="w-screen h-screen bg-slate-900 text-slate-100 font-mono overflow-hidden flex flex-col">
      <style>{`
        @keyframes glowPulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.6; } }
        @keyframes flicker { 0% { transform: scale(1) rotate(-1deg); } 100% { transform: scale(1.05) rotate(1deg); } }
        @keyframes smokeRise { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 100% { transform: translateY(-20px) scale(1.5); opacity: 0; } }
        @keyframes auroraShift { 0% { transform: translateX(-10%); opacity: 0.6; } 100% { transform: translateX(10%); opacity: 1; } }
      `}</style>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
        <div className="bg-slate-800 px-2 py-1 flex flex-wrap items-center gap-2 text-xs border-b border-slate-700 flex-shrink-0">
          <div className="font-bold text-sky-300">❄️ {PROFESSIONS[state.profession].emoji} {state.player.name}</div>
          <div>Day <span className="text-white font-bold">{state.day}</span>{state.scenario === 'rescue' ? '/30' : ''}</div>
          <div>{timeStr} {isNight ? '🌙' : '☀️'}</div>
          <div>
            {state.weather === 'clear' && '☀️ Clear'}
            {state.weather === 'snow' && '🌨️ Snowing'}
            {state.weather === 'blizzard' && '🌬️ BLIZZARD'}
          </div>
          <div className="flex-1"></div>
          <button onClick={() => setState(s => ({ ...s, paused: !s.paused }))} className="bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">
            {state.paused ? '▶ Play' : '⏸ Pause'}
          </button>
          <div className="flex gap-1">
            {[1,2,3].map(sp => (
              <button key={sp} onClick={() => setState(s => ({...s, gameSpeed: sp}))}
                className={`px-2 py-1 rounded text-xs ${state.gameSpeed===sp?'bg-sky-600':'bg-slate-700 hover:bg-slate-600'}`}>
                {sp}x
              </button>
            ))}
          </div>
          <button onClick={saveAndQuit} className="bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-xs">
            💾 Save &amp; Quit
          </button>
        </div>

        <div className="bg-slate-800 px-2 py-1 flex flex-wrap gap-2 text-xs border-b border-slate-700 flex-shrink-0">
          <Vital label="❤️ HP" value={state.player.hp} color="bg-red-500"
                 criticalLabel={state.player.hp < 30 ? '⚠️ INJURED' : null} />
          <Vital label="🔥 Warmth" value={state.player.warmth} color="bg-orange-400"
                 warning={state.player.warmth < 35}
                 criticalLabel={state.player.warmth < 25 ? '⚠️ FREEZING' : null} />
          <Vital label="🍖 Hunger" value={state.player.hunger} color="bg-yellow-600"
                 warning={state.player.hunger < 30}
                 criticalLabel={state.player.hunger < 20 ? '⚠️ STARVING' : null} />
          <Vital label="⚡ Stamina" value={state.player.stamina} color="bg-green-500" />
        </div>

        <div className="bg-slate-800 px-2 py-1 flex flex-wrap gap-3 text-xs border-b border-slate-700 flex-shrink-0">
          <span>🪵 {state.inventory.wood}</span>
          <span>🪨 {state.inventory.stone}</span>
          <span>🔧 {state.inventory.scrap}</span>
          <span>🥫 {state.inventory.food}</span>
          <span>🍖 {state.inventory.raw_meat}</span>
          <span>🍗 {state.inventory.cooked_meat}</span>
          <span>🟡 {state.inventory.fat}</span>
          <span>🦊 {state.inventory.pelts}</span>
          {state.inventory.medkit > 0 && <span>🏥 {state.inventory.medkit}</span>}
        </div>

        {state.currentEvent && (
          <div className="bg-indigo-900/40 border-b border-indigo-700 px-2 py-1 text-xs flex-shrink-0">
            <span className="font-bold text-indigo-300">📅 Today: {state.currentEvent.name}</span>
            <span className="text-slate-300 ml-2">{state.currentEvent.desc}</span>
          </div>
        )}

        {towerProgress && (
          <div className="bg-slate-800/80 px-2 py-1 text-xs border-b border-slate-700 flex-shrink-0">
            <div className="font-bold text-sky-300 mb-1">📡 Reach the Radio Tower</div>
            <div className="flex flex-wrap gap-3">
              <span className={towerProgress.food >= towerProgress.foodNeeded ? 'text-green-400' : ''}>Food: {towerProgress.food}/{towerProgress.foodNeeded}</span>
              <span className={towerProgress.wood >= towerProgress.woodNeeded ? 'text-green-400' : ''}>Wood: {towerProgress.wood}/{towerProgress.woodNeeded}</span>
              <span className={towerProgress.coat ? 'text-green-400' : 'text-red-400'}>Coat: {towerProgress.coat ? '✓' : '✗'}</span>
              <span className="text-slate-400">→ Reach tower (southwest corner)</span>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0 gap-2 p-1">
          <div className="flex-1 flex items-center justify-center overflow-hidden min-w-0">
          <div className="relative bg-black overflow-hidden flex-shrink-0"
            style={{
              width: VIEW_W * TILE,
              height: VIEW_H * TILE,
              minWidth: VIEW_W * TILE,
              minHeight: VIEW_H * TILE,
              transform: `scale(${mapScale})`,
              transformOrigin: 'center',
              ...shakeStyle,
            }}>

            {Array.from({ length: VIEW_H }).map((_, vy) =>
              Array.from({ length: VIEW_W }).map((_, vx) => {
                const tx = view.x + vx;
                const ty = view.y + vy;
                const tile = map[ty] && map[ty][tx];
                if (tile === undefined) return null;
                const data = TILE_DATA[tile];
                const vis = visibilityAt(fog, state.player.x, state.player.y, tx, ty);
                const depleted = (tile === T.PLANE || tile === T.CABIN)
                  && state.lootCounts && state.lootCounts[`${tx},${ty}`] === 0;
                let filter = 'none';
                if (vis === 1) filter = 'brightness(0.45) saturate(0.5)';
                else if (depleted) filter = 'grayscale(0.7) opacity(0.55)';
                return (
                  <div key={`${tx}-${ty}`}
                    onClick={() => vis > 0 && handleTileClick(tx, ty)}
                    onMouseEnter={() => setHover({ x: tx, y: ty })}
                    onMouseLeave={() => setHover(null)}
                    className={vis > 0 ? "absolute flex items-center justify-center cursor-pointer hover:brightness-125" : "absolute"}
                    style={{
                      left: vx * TILE, top: vy * TILE, width: TILE, height: TILE,
                      background: vis === 0 ? '#0a0a0f' : data.color,
                      fontSize: 22,
                      filter,
                      borderRight: '1px solid rgba(0,0,0,0.05)',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}>
                    {vis > 0 && data.emoji}
                  </div>
                );
              })
            )}

            {footprints.map((fp, i) => {
              if (fp.x < view.x || fp.x >= view.x + VIEW_W || fp.y < view.y || fp.y >= view.y + VIEW_H) return null;
              const age = Date.now() - fp.ts;
              const opacity = Math.max(0, 1 - age / 8000) * 0.3;
              if (opacity <= 0) return null;
              return (
                <div key={`fp-${fp.ts}-${i}`} className="absolute pointer-events-none"
                  style={{
                    left: (fp.x - view.x) * TILE + TILE/2 - 2,
                    top: (fp.y - view.y) * TILE + TILE - 6,
                    width: 4, height: 3,
                    background: `rgba(120, 130, 160, ${opacity})`,
                    borderRadius: '50%',
                  }} />
              );
            })}

            {state.crates.filter(c => !c.looted).map((c, i) => {
              if (c.x < view.x || c.x >= view.x + VIEW_W || c.y < view.y || c.y >= view.y + VIEW_H) return null;
              const vis = visibilityAt(fog, state.player.x, state.player.y, c.x, c.y);
              if (vis === 0) return null;
              return (
                <div key={`crate-${i}`} className="absolute flex items-center justify-center pointer-events-none animate-pulse"
                  style={{ left: (c.x - view.x) * TILE, top: (c.y - view.y) * TILE, width: TILE, height: TILE, fontSize: 24 }}>
                  📦
                </div>
              );
            })}

            {state.pendingCarcass &&
             state.pendingCarcass.x >= view.x && state.pendingCarcass.x < view.x + VIEW_W &&
             state.pendingCarcass.y >= view.y && state.pendingCarcass.y < view.y + VIEW_H &&
             visibilityAt(fog, state.player.x, state.player.y, state.pendingCarcass.x, state.pendingCarcass.y) > 0 && (
              <div className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  left: (state.pendingCarcass.x - view.x) * TILE,
                  top: (state.pendingCarcass.y - view.y) * TILE,
                  width: TILE, height: TILE, fontSize: 24,
                }}>
                💀
              </div>
            )}

            {state.buildings.filter(b => b.x >= view.x && b.x < view.x + VIEW_W && b.y >= view.y && b.y < view.y + VIEW_H).map((b, i) => {
              const vis = visibilityAt(fog, state.player.x, state.player.y, b.x, b.y);
              if (vis === 0) return null;
              const isLitFire = b.type === 'campfire' && b.fuel > 0;
              return (
                <div key={`b-${i}`}>
                  {isLitFire && vis === 2 && (
                    <div className="absolute pointer-events-none" style={{
                      left: (b.x - view.x) * TILE + TILE/2 - 4,
                      top: (b.y - view.y) * TILE - 8,
                      width: 8, height: 16,
                      background: 'radial-gradient(circle at 50% 100%, rgba(200,200,200,0.4), transparent 70%)',
                      filter: 'blur(2px)',
                      animation: 'smokeRise 3s ease-out infinite',
                    }} />
                  )}
                  <div className="absolute flex items-center justify-center pointer-events-none"
                    style={{
                      left: (b.x - view.x) * TILE, top: (b.y - view.y) * TILE, width: TILE, height: TILE, fontSize: 24,
                      filter: vis === 1 ? 'brightness(0.5)' : (b.type === 'campfire' && b.fuel <= 0 ? 'grayscale(1) opacity(0.5)' : 'none'),
                      animation: isLitFire ? 'flicker 0.5s ease-in-out infinite alternate' : 'none',
                    }}>
                    {BUILDINGS[b.type].emoji}
                    {b.type === 'trap' && b.caught && <span className="absolute text-xs">!</span>}
                  </div>
                </div>
              );
            })}

            {state.animals.filter(a => a.hp > 0 && a.x >= view.x && a.x < view.x + VIEW_W && a.y >= view.y && a.y < view.y + VIEW_H).map((a, i) => {
              const vis = visibilityAt(fog, state.player.x, state.player.y, a.x, a.y);
              if (vis < 2) return null;
              return (
                <div key={`a-${i}`} className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    left: (a.x - view.x) * TILE, top: (a.y - view.y) * TILE, width: TILE, height: TILE, fontSize: 22,
                    transition: 'left 0.3s, top 0.3s',
                  }}>
                  {a.type === 'rabbit' && '🐰'}
                  {a.type === 'wolf' && '🐺'}
                  {a.type === 'boar' && '🐗'}
                  {a.type === 'bear' && '🐻'}
                  {a.type === 'deer' && '🦌'}
                  {a.type === 'seal' && '🦭'}
                  {a.type === 'raven' && '🦅'}
                </div>
              );
            })}

            <div className="absolute flex items-center justify-center pointer-events-none z-10"
              style={{
                left: (state.player.x - view.x) * TILE,
                top: (state.player.y - view.y) * TILE + (moveTarget ? Math.sin(playerBob * 0.3) * 2 : 0),
                width: TILE, height: TILE, fontSize: 26,
                transition: 'left 0.2s, top 0.2s',
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
              }}>
              {PROFESSIONS[state.profession].playerEmoji}
            </div>

            {moveTarget && (
              <div className="absolute border-2 border-yellow-400 pointer-events-none animate-pulse"
                style={{ left: (moveTarget.x - view.x) * TILE, top: (moveTarget.y - view.y) * TILE, width: TILE, height: TILE }} />
            )}

            {selectedBuild && hover && (
              <div className="absolute border-2 border-green-400 pointer-events-none flex items-center justify-center"
                style={{
                  left: (hover.x - view.x) * TILE, top: (hover.y - view.y) * TILE, width: TILE, height: TILE,
                  background: 'rgba(0,255,0,0.2)', fontSize: 20,
                }}>
                {BUILDINGS[selectedBuild].emoji}
              </div>
            )}

            {hitFlashes.map(f => {
              if (f.x < view.x || f.x >= view.x + VIEW_W || f.y < view.y || f.y >= view.y + VIEW_H) return null;
              const age = Date.now() - f.ts;
              const opacity = Math.max(0, 1 - age / 500);
              return (
                <div key={`hf-${f.id}`} className="absolute pointer-events-none rounded"
                  style={{
                    left: (f.x - view.x) * TILE, top: (f.y - view.y) * TILE, width: TILE, height: TILE,
                    background: f.color === 'red' ? `rgba(255,40,40,${opacity * 0.6})` : `rgba(255,255,255,${opacity * 0.7})`,
                    mixBlendMode: 'screen',
                  }} />
              );
            })}

            {state.eventEffects.aurora && (state.time < 6 || state.time > 19) && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(180deg, rgba(80,255,180,0.18) 0%, rgba(120,100,255,0.12) 30%, transparent 60%)',
                animation: 'auroraShift 6s ease-in-out infinite alternate',
                mixBlendMode: 'screen',
              }} />
            )}

            {snowflakes.map(f => (
              <div key={`sf-${f.id}`} className="absolute pointer-events-none rounded-full"
                style={{
                  left: f.x, top: f.y, width: f.size, height: f.size,
                  background: `rgba(255,255,255,${f.opacity})`,
                }} />
            ))}

            <div className="absolute inset-0 pointer-events-none" style={{ background: skyColor }}></div>
            <div className="absolute inset-0 pointer-events-none" style={{ background: weatherOverlay }}></div>

            {state.buildings.filter(b => b.type === 'campfire' && b.fuel > 0
                && b.x >= view.x - 8 && b.x < view.x + VIEW_W + 8
                && b.y >= view.y - 8 && b.y < view.y + VIEW_H + 8).map((b, i) => {
              const vis = visibilityAt(fog, state.player.x, state.player.y, b.x, b.y);
              if (vis === 0) return null;
              return (
                <div key={`glow-${i}`} className="absolute pointer-events-none" style={{
                  left: (b.x - view.x) * TILE + TILE / 2 - TILE * 8,
                  top: (b.y - view.y) * TILE + TILE / 2 - TILE * 8,
                  width: TILE * 16, height: TILE * 16,
                  background: 'radial-gradient(circle, rgba(255,190,90,0.75) 0%, rgba(255,150,55,0.5) 20%, rgba(255,120,40,0.22) 45%, rgba(255,90,30,0.06) 70%, rgba(255,80,30,0) 90%)',
                  animation: 'glowPulse 2s ease-in-out infinite',
                  opacity: vis === 2 ? 1 : 0.5,
                }} />
              );
            })}

            {nearbyPredator && (
              <div className="absolute top-2 right-2 pointer-events-none">
                {nearbyPredator === 'bear' ? (
                  <div className="bg-red-900/90 border-2 border-red-500 rounded px-3 py-2 text-sm font-bold text-red-100 animate-pulse shadow-lg shadow-red-500/50">
                    <span className="text-2xl mr-1">🐻</span> BEAR NEARBY — RUN
                  </div>
                ) : (
                  <div className="bg-red-900/80 border border-red-600 rounded px-2 py-1 text-xs font-bold text-red-200 shadow-lg shadow-red-500/30">
                    🐺 Wolf nearby!
                  </div>
                )}
              </div>
            )}

            {tooltipReady && hover && (() => {
              const tile = map[hover.y] && map[hover.y][hover.x];
              if (tile === undefined) return null;
              const key = `${hover.x},${hover.y}`;
              const lc = state.lootCounts || {};
              const remaining = key in lc ? lc[key] : LOOT_BUDGET[tile];
              let text = null;
              if (tile === T.TREE) text = '🌲 Tree — Click to chop for wood';
              else if (tile === T.ROCK) text = '🪨 Rock — Click to mine for stone';
              else if (tile === T.PLANE) text = remaining > 0 ? `✈️ Plane Wreckage — Click to loot (${remaining} uses left)` : 'Picked clean — nothing left here';
              else if (tile === T.CABIN) text = remaining > 0 ? `🏚️ Abandoned Cabin — Click to loot (${remaining} uses left)` : 'Picked clean — nothing left here';
              else if (tile === T.CAVE) text = '🕳️ Cave — Walkable shelter';
              else if (tile === T.TOWER) text = '📡 Radio Tower — Reach with 10 food, 5 wood, coat to win';
              if (!text) return null;
              const left = (hover.x - view.x) * TILE + TILE + 4;
              const top = (hover.y - view.y) * TILE - 4;
              const right = left + 220 > VIEW_W * TILE;
              return (
                <div className="absolute pointer-events-none z-30" style={{
                  left: right ? undefined : left,
                  right: right ? VIEW_W * TILE - ((hover.x - view.x) * TILE) + 4 : undefined,
                  top,
                  maxWidth: 220,
                }}>
                  <div className="bg-slate-900/95 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 shadow-lg whitespace-nowrap">
                    {text}
                  </div>
                </div>
              );
            })()}
          </div>
          </div>

          <div className="flex flex-col gap-1 w-72 flex-shrink-0 min-h-0">
            <div className="bg-slate-800 p-1 grid grid-cols-2 gap-1 text-xs flex-shrink-0">
              <button onClick={() => setMenu(menu === 'build' ? null : 'build')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[B] Build</button>
              <button onClick={() => setMenu(menu === 'inventory' ? null : 'inventory')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[I] Inventory</button>
              <button onClick={() => setMenu(menu === 'skills' ? null : 'skills')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[K] Skills</button>
              <button onClick={() => setMenu(menu === 'help' ? null : 'help')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[H] Help</button>
            </div>

            <div className="bg-slate-800 p-2 text-xs flex-1 overflow-y-auto min-h-0">
              <div className="font-bold mb-1 text-sky-300">📜 Log</div>
              {state.log.slice(0, 30).map((l, i) => (
                <div key={i} className="text-slate-300 mb-0.5">
                  <span className="text-slate-500">D{l.day} {l.time}h:</span> {l.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {menu && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setMenu(null)}>
            <div className="bg-slate-800/95 rounded-lg border border-slate-600 shadow-2xl max-w-md w-[90%] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-3 border-b border-slate-700 sticky top-0 bg-slate-800/95 backdrop-blur-sm">
                <div className="font-bold text-sky-300 text-sm">
                  {menu === 'build' && '🔨 Build'}
                  {menu === 'inventory' && '🎒 Inventory'}
                  {menu === 'skills' && '⭐ Skills'}
                  {menu === 'help' && '❓ How to Play'}
                </div>
                <button onClick={() => setMenu(null)} className="text-slate-400 hover:text-white px-2 leading-none text-lg">✕</button>
              </div>
              <div className="p-3 text-xs">
                {menu === 'build' && (
                  <>
                    <div className="text-slate-400 mb-2">Click a building, then click a snow tile on the map.</div>
                    {Object.entries(BUILDINGS).map(([key, b]) => {
                      const canBuild = state.inventory.wood >= b.wood && state.inventory.stone >= b.stone && state.inventory.scrap >= b.scrap;
                      return (
                        <button key={key} onClick={() => { setSelectedBuild(key === selectedBuild ? null : key); setMenu(null); }} disabled={!canBuild}
                          className={`w-full text-left p-2 mb-1 rounded ${selectedBuild === key ? 'bg-sky-600' : canBuild ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/50 text-slate-500'}`}>
                          <div className="font-bold">{b.emoji} {b.name}</div>
                          <div className="text-slate-300">{b.wood > 0 && `🪵${b.wood} `}{b.stone > 0 && `🪨${b.stone} `}{b.scrap > 0 && `🔧${b.scrap}`}</div>
                          <div className="text-slate-400">{b.desc}</div>
                        </button>
                      );
                    })}
                  </>
                )}
                {menu === 'inventory' && (
                  <>
                    <div className="text-slate-300 mb-2">
                      Gear: {state.equipment.hasKnife && '🔪'} {state.equipment.hasCoat && '🧥'}
                      {state.inventory.fur_coat > 0 && ' 🧥+'}
                      {state.inventory.hatchet > 0 && ' 🪓'}
                      {state.inventory.hunting_bow > 0 && ' 🏹'}
                      {state.inventory.rifle > 0 && ' 🎯'}
                    </div>
                    <div className="space-y-1">
                      <ResourceRow icon="🪵" name="Wood" count={state.inventory.wood} />
                      <ResourceRow icon="🪨" name="Stone" count={state.inventory.stone} />
                      <ResourceRow icon="🔧" name="Scrap" count={state.inventory.scrap} />
                      <ResourceRow icon="🧵" name="Cloth" count={state.inventory.cloth} />
                      <ResourceRow icon="🦊" name="Pelts" count={state.inventory.pelts} />
                      {state.inventory.rare_pelt > 0 && <ResourceRow icon="🐻" name="Bear Pelt" count={state.inventory.rare_pelt} />}
                      <ResourceRow icon="🥫" name="Rations" count={state.inventory.food} action={state.inventory.food > 0 && (() => eat('food'))} actionLabel="Eat +30" />
                      <ResourceRow icon="🍖" name="Raw Meat" count={state.inventory.raw_meat} action={state.inventory.raw_meat > 0 && (() => eat('raw_meat'))} actionLabel="Eat +15" />
                      <ResourceRow icon="🍗" name="Cooked" count={state.inventory.cooked_meat} action={state.inventory.cooked_meat > 0 && (() => eat('cooked_meat'))} actionLabel="Eat +40" />
                      {state.inventory.dried_meat > 0 && <ResourceRow icon="🥓" name="Dried Meat" count={state.inventory.dried_meat} action={() => eat('dried_meat')} actionLabel="Eat +35" />}
                      <ResourceRow icon="🟡" name="Fat" count={state.inventory.fat} action={state.inventory.fat > 0 && (() => eat('fat'))} actionLabel="Eat +25🔥" />
                      {state.inventory.medkit > 0 && <ResourceRow icon="🏥" name="Medkit" count={state.inventory.medkit} action={() => eat('medkit')} actionLabel="Heal" />}
                    </div>
                    <div className="mt-2 text-slate-400 border-t border-slate-700 pt-2">
                      💡 Cook: click an active campfire while you have raw meat.
                    </div>
                  </>
                )}
                {menu === 'skills' && (
                  <>
                    <SkillRow name="Foraging" lvl={state.skills.foraging} xp={state.skills.foragingXp} max={state.skills.foraging * 30} desc="More wood per chop" />
                    <SkillRow name="Hunting" lvl={state.skills.hunting} xp={state.skills.huntingXp} max={state.skills.hunting * 30} desc="More attack damage" />
                    <SkillRow name="Crafting" lvl={state.skills.crafting} xp={state.skills.craftingXp} max={state.skills.crafting * 30} desc="(More uses coming)" />
                  </>
                )}
                {menu === 'help' && (
                  <div className="space-y-1">
                    <div><b>Goal:</b> {SCENARIOS[state.scenario].desc}</div>
                    <div className="border-t border-slate-700 pt-1 mt-1">
                      <div><b>Click</b> tiles to move/interact.</div>
                      <div><b>Trees</b>→wood. <b>Rocks</b>→stone. <b>Plane/Cabin</b>→loot.</div>
                      <div><b>Animals</b> (adjacent)→attack.</div>
                      <div><b>Campfire + raw meat</b>→click to cook.</div>
                      <div><b>Tent</b> at night→sleep.</div>
                    </div>
                    <div className="border-t border-slate-700 pt-1">
                      <b>Keys:</b> B I K H, Space=Pause, 1/2/3=Speed, Esc=Cancel
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {dayBanner && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm border border-amber-700/50 rounded-lg px-10 py-6 text-center animate-pulse">
              <div className="text-5xl font-bold text-amber-300 tracking-widest">DAY {dayBanner.day}</div>
              {dayBanner.event && <div className="text-slate-300 italic text-sm mt-2">{dayBanner.event}</div>}
            </div>
          </div>
        )}

        {state.showIntro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900/95 border-2 border-amber-700/60 rounded-lg shadow-2xl max-w-lg w-[90%] p-6">
              <div className="text-center mb-4">
                <div className="text-3xl mb-1">{PROFESSIONS[state.profession].playerEmoji}</div>
                <div className="text-amber-400/80 text-xs tracking-widest uppercase">Day 1 · {state.crashSiteName}</div>
              </div>
              <p className="text-slate-200 italic text-base leading-relaxed mb-5 text-center">
                The plane went down at dawn. {state.player.name} the {PROFESSIONS[state.profession].name} crawls from the wreckage — alive, cold, alone.
                {' '}
                {state.scenario === 'rescue'
                  ? 'Thirty days until rescue. Maybe.'
                  : 'The radio tower is the only way out. Reach it before the cold takes you.'}
              </p>
              <div className="bg-slate-800/60 border border-slate-700 rounded p-3 mb-5 text-xs space-y-1 text-slate-300">
                <div>🖱️ Click tiles to move and interact</div>
                <div>🔥 Build a campfire FAST — warmth kills you quickly</div>
                <div>⛺ Build a tent so you can sleep through the night</div>
              </div>
              <button
                onClick={() => setState(s => ({ ...s, showIntro: false, paused: false }))}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold text-lg">
                Begin
              </button>
            </div>
          </div>
        )}

        {(state.dead || state.rescued) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-600 text-center max-w-md">
              <div className="text-4xl mb-3">{state.rescued ? (state.scenario === 'tower' ? '📡' : '🚁') : '💀'}</div>
              <div className="text-2xl font-bold mb-2">{state.rescued ? 'SURVIVED' : 'YOU DIED'}</div>
              {state.dead && state.deathCause && (
                <div className="text-red-300 italic text-sm mb-2">{state.deathCause}</div>
              )}
              <div className="text-slate-300 mb-4">
                {state.player.name} the {PROFESSIONS[state.profession].name}<br/>
                {state.rescued ? `Made it on day ${state.day}.` : `Survived ${state.day} days.`}
              </div>
              <button onClick={() => { clearSave(); setSavedGameMeta(null); setGameStarted(false); setSetupStep('scenario'); }} className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded">
                New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

