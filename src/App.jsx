import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TILE, MAP_W, MAP_H, VIEW_W, VIEW_H, VISION_RADIUS } from './constants.js';
import { T, TILE_DATA } from './data/tiles.js';
import { BUILDINGS } from './data/buildings.js';
import { PROFESSIONS } from './data/professions.js';
import { ITEM_INFO, LOOT_BUDGET, rollFromTable } from './data/loot.js';
import { genMap } from './logic/mapGen.js';
import { visibilityAt } from './logic/visibility.js';
import { spawnInitialAnimals } from './logic/animals.js';
import { applyAttack } from './logic/combat.js';
import { gainXp } from './logic/progression.js';
import { pushLog } from './logic/log.js';
import { applyXp, XP_REWARDS, STAT_UPGRADES, levelProgress } from './data/leveling.js';
import { saveGame, loadGame, clearSave } from './logic/saveLoad.js';
import { SetupScreen } from './components/SetupScreen.jsx';
import { IntroOverlay } from './components/IntroOverlay.jsx';
import { GameUI } from './components/GameUI.jsx';
import { MapView } from './components/MapView.jsx';
import { LogPanel } from './components/LogPanel.jsx';
import { BuildMenu } from './components/BuildMenu.jsx';
import { InventoryMenu } from './components/InventoryMenu.jsx';
import { SkillsMenu } from './components/SkillsMenu.jsx';
import { HelpMenu } from './components/HelpMenu.jsx';
import { DeathScreen } from './components/DeathScreen.jsx';
import { DayBanner } from './components/DayBanner.jsx';
import { LevelUpOverlay } from './components/LevelUpOverlay.jsx';
import { StatUpgradeModal } from './components/StatUpgradeModal.jsx';
import { useGameLoop } from './hooks/useGameLoop.js';

const initialState = (mode = 'wilderness', scenario = 'rescue', startPos = { x: 28, y: 22 }, profession = 'lumberjack', charName = 'Survivor') => {
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
    player: {
      x: startPos.x + 2, y: startPos.y,
      hp: 100, warmth: startWarmth, hunger: 80, stamina: 100,
      maxHp: 100, maxWarmth: 100, maxHunger: 100, maxStamina: 100,
      lastAttackMs: 0, lungeUntil: 0,
      name: charName,
    },
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
    mode,
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
    combatTarget: null,
    combatTargetType: null,
    zombies: [],
    wave: { nightNumber: 0, totalToSpawn: 0, spawned: 0, subWaveIndex: 0, nextSubWaveTime: null, active: false },
    isNightPhase: false,
    harvestTarget: null,
    tileHp: {},
    characterXp: 0,
    characterLevel: 1,
    unspentStatPoints: 0,
    statUpgrades: { vitality: 0, insulation: 0, endurance: 0, power: 0 },
  };
};

export default function WintersEdge() {
  const [gameStarted, setGameStarted] = useState(false);
  const [setupStep, setSetupStep] = useState('mode');
  const [chosenMode, setChosenMode] = useState('wilderness');
  const [chosenScenario, setChosenScenario] = useState('rescue');
  const [chosenProfession, setChosenProfession] = useState('lumberjack');
  const [charName, setCharName] = useState('');
  const [mapData, setMapData] = useState(() => genMap());
  const [map, setMap] = useState(mapData.map);
  const [state, setState] = useState(() => initialState('wilderness', 'rescue', { x: mapData.startX, y: mapData.startY }, 'lumberjack', 'Survivor'));
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
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [levelUpBanner, setLevelUpBanner] = useState(null);
  const [statModalOpen, setStatModalOpen] = useState(false);
  const damageIdRef = useRef(0);
  const [savedGameMeta, setSavedGameMeta] = useState(() => {
    const s = loadGame();
    return s ? { day: s.state.day, profession: s.state.profession } : null;
  });
  const refreshSavedMeta = useCallback((stateLike) => {
    setSavedGameMeta({ day: stateLike.day, profession: stateLike.profession });
  }, []);

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

  const startGame = (mode, scenario, profession, name) => {
    const md = genMap(null, mode);
    setMapData(md);
    setMap(md.map);
    const finalName = name && name.trim() ? name.trim() : 'Survivor';
    const fresh = initialState(mode, scenario, { x: md.startX, y: md.startY }, profession, finalName);
    fresh.animals = spawnInitialAnimals();
    fresh.crates = md.outpostCrates || [];
    fresh.crashSiteName = md.siteName;
    fresh.showIntro = true;
    fresh.log = [
      { msg: `Crash site: ${md.siteName}.`, day: 1, time: 8 },
      { msg: `${finalName} the ${PROFESSIONS[profession].name} wakes in the wreckage. Cold. Alone.`, day: 1, time: 8 },
    ];
    setState(fresh);
    setFog(Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false)));
    resetTick();
    setGameStarted(true);
  };

  const continueGame = () => {
    const save = loadGame();
    if (!save) return;
    setMap(save.map);
    setState({ ...save.state, paused: true, showIntro: false });
    setFog(save.fog);
    resetTick();
    setGameStarted(true);
  };

  const saveAndQuit = () => {
    saveGame(state, map, fog);
    refreshSavedMeta(state);
    setGameStarted(false);
    setSetupStep('mode');
  };

  useEffect(() => {
    if (!gameStarted) return;
    // Dynamic dims so old (smaller) saves clamp to their actual map size
    // rather than the new constants.
    const mw = map[0]?.length ?? MAP_W;
    const mh = map.length || MAP_H;
    setView({
      x: Math.max(0, Math.min(mw - VIEW_W, state.player.x - Math.floor(VIEW_W / 2))),
      y: Math.max(0, Math.min(mh - VIEW_H, state.player.y - Math.floor(VIEW_H / 2))),
    });
    setFog(prev => {
      const nf = prev.map(r => [...r]);
      const fh = nf.length;
      const fw = nf[0]?.length ?? 0;
      for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
        for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
          if (dx*dx + dy*dy <= VISION_RADIUS * VISION_RADIUS) {
            const x = state.player.x + dx;
            const y = state.player.y + dy;
            if (x >= 0 && x < fw && y >= 0 && y < fh) nf[y][x] = true;
          }
        }
      }
      return nf;
    });
  }, [state.player.x, state.player.y, gameStarted, map]);

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
      setDamageNumbers(prev => prev.filter(f => now - f.ts < 800));
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

  // Sundown banner (Outbreak only). Fires when a new wave activates.
  useEffect(() => {
    if (!gameStarted || state.showIntro) return;
    if (state.mode !== 'outbreak') return;
    if (!state.wave?.active || !state.wave.nightNumber) return;
    setDayBanner({
      type: 'night',
      nightNumber: state.wave.nightNumber,
      waveSize: state.wave.totalToSpawn,
    });
    const t = setTimeout(() => setDayBanner(null), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wave?.nightNumber, state.wave?.active]);

  // Level-up banner (fires on any change to characterLevel, skipping the
  // initial 1 → 1 render at game start)
  useEffect(() => {
    if (!gameStarted) return;
    if ((state.characterLevel || 1) <= 1) return;
    setLevelUpBanner({ level: state.characterLevel });
    const t = setTimeout(() => setLevelUpBanner(null), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.characterLevel]);

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


  useEffect(() => {
    if (!moveTarget || !gameStarted || state.paused || state.dead) return;
    const moveInterval = setInterval(() => {
      setState(prev => {
        if (!moveTarget) return prev;
        const tx = moveTarget.x, ty = moveTarget.y;
        // If we're chasing a combat target, stop walking once we're in attack range.
        if (prev.combatTarget !== null) {
          const tgt = prev.combatTargetType === 'zombie'
            ? prev.zombies.find(z => z.id === prev.combatTarget)
            : prev.animals.find(a => a.id === prev.combatTarget);
          if (tgt) {
            const td = Math.abs(tgt.x - prev.player.x) + Math.abs(tgt.y - prev.player.y);
            const range = (prev.inventory.hunting_bow > 0 || prev.inventory.rifle > 0) ? 3 : 1;
            if (td <= range) {
              setMoveTarget(null);
              return prev;
            }
          }
        }
        // If we're walking to a harvest target, stop once adjacent.
        if (prev.harvestTarget) {
          const ht = prev.harvestTarget;
          const td = Math.abs(ht.x - prev.player.x) + Math.abs(ht.y - prev.player.y);
          if (td <= 1) {
            setMoveTarget(null);
            return prev;
          }
        }
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

      if (tile === T.PLANE || tile === T.CABIN || tile === T.ARMORY || tile === T.BARRACKS) {
        const key = `${tx},${ty}`;
        const lootCounts = { ...(s.lootCounts || {}) };
        const max = LOOT_BUDGET[tile];
        const remaining = key in lootCounts ? lootCounts[key] : max;
        if (remaining <= 0) {
          s = addLog(s, 'Picked clean — nothing left here.');
          return s;
        }
        const lootMeta = {
          [T.PLANE]:    { table: 'plane',    label: 'Found' },
          [T.CABIN]:    { table: 'cabin',    label: 'Cabin' },
          [T.ARMORY]:   { table: 'armory',   label: 'Armory' },
          [T.BARRACKS]: { table: 'barracks', label: 'Barracks' },
        }[tile];
        const tableName = lootMeta.table;
        const label = lootMeta.label;
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
          s = applyXp(s, XP_REWARDS.lootRoll);
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
      s = applyXp(s, XP_REWARDS.lootCrate);
      return s;
    });
  };

  const engage = (animal) => {
    setState(prev => ({ ...prev, combatTarget: animal.id, combatTargetType: 'animal', harvestTarget: null }));
    const d = Math.abs(animal.x - state.player.x) + Math.abs(animal.y - state.player.y);
    const range = (state.inventory.hunting_bow > 0 || state.inventory.rifle > 0) ? 3 : 1;
    if (d > range) setMoveTarget({ x: animal.x, y: animal.y });
    else setMoveTarget(null);
  };

  const engageZombie = (zombie) => {
    setState(prev => ({ ...prev, combatTarget: zombie.id, combatTargetType: 'zombie', harvestTarget: null }));
    const d = Math.abs(zombie.x - state.player.x) + Math.abs(zombie.y - state.player.y);
    const range = (state.inventory.hunting_bow > 0 || state.inventory.rifle > 0) ? 3 : 1;
    if (d > range) setMoveTarget({ x: zombie.x, y: zombie.y });
    else setMoveTarget(null);
  };

  const engageHarvest = (tx, ty, tile) => {
    setState(prev => ({ ...prev, harvestTarget: { x: tx, y: ty, tile }, combatTarget: null, combatTargetType: null }));
    const d = Math.abs(tx - state.player.x) + Math.abs(ty - state.player.y);
    if (d > 1) setMoveTarget({ x: tx, y: ty });
    else setMoveTarget(null);
  };

  const addDamageNumber = useCallback((opts) => {
    setDamageNumbers(prev => [...prev.slice(-30), { id: damageIdRef.current++, ts: Date.now(), ...opts }]);
  }, []);

  const addHitFlash = useCallback((opts) => {
    setHitFlashes(prev => [...prev, { id: flashIdRef.current++, ts: Date.now(), ...opts }]);
  }, []);

  const onPlayerSwing = useCallback((hit) => {
    addDamageNumber({ x: hit.x, y: hit.y, value: hit.dmg, color: 'white' });
    addHitFlash({ x: hit.x, y: hit.y, color: 'white' });
  }, [addDamageNumber, addHitFlash]);

  const onAnimalSwing = useCallback((hit) => {
    addDamageNumber({ x: hit.px, y: hit.py, value: hit.dmg, color: 'red' });
  }, [addDamageNumber]);

  const { resetTick } = useGameLoop({
    gameStarted, state, setState, map, setMap, moveTarget, addLog,
    onPlayerSwing, onAnimalSwing,
  });

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
      s = applyXp(s, XP_REWARDS.buildStructure);
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
          s.buildings = s.buildings.map(x => x === b ? { ...x, fuel: Math.min(20, x.fuel + 4), wentOutLogged: false } : x);
          s = addLog(s, '🔥 Added wood to fire');
        } else {
          s = addLog(s, 'No wood and no raw meat to cook.');
        }
      } else if (b.type === 'tent') {
        if (s.time > 19 || s.time < 6) {
          s.player.warmth = Math.min(s.player.maxWarmth ?? 100, s.player.warmth + 30);
          s.player.hp = Math.min(s.player.maxHp ?? 100, s.player.hp + 20);
          s = addLog(s, '😴 You rest at the tent. (+30 warmth, +20 HP)');
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

  const pickStat = (key) => {
    setState(prev => {
      if ((prev.unspentStatPoints || 0) <= 0) return prev;
      const def = STAT_UPGRADES[key];
      if (!def) return prev;
      const next = def.apply({ ...prev, statUpgrades: { ...(prev.statUpgrades || {}) } });
      return { ...next, unspentStatPoints: (prev.unspentStatPoints || 0) - 1 };
    });
    setStatModalOpen(false);
  };

  const eat = (type) => {
    setState(prev => {
      let s = { ...prev, inventory: { ...prev.inventory } };
      const prof = PROFESSIONS[s.profession];
      if (type === 'food' && s.inventory.food > 0) {
        s.inventory.food -= 1;
        s.player.hunger = Math.min(s.player.maxHunger ?? 100, s.player.hunger + 30);
        s = addLog(s, '🥫 Ate a ration (+30 hunger)');
      } else if (type === 'raw_meat' && s.inventory.raw_meat > 0) {
        s.inventory.raw_meat -= 1;
        s.player.hunger = Math.min(s.player.maxHunger ?? 100, s.player.hunger + 15);
        s = addLog(s, '🍖 Ate raw meat (+15 hunger)');
      } else if (type === 'cooked_meat' && s.inventory.cooked_meat > 0) {
        s.inventory.cooked_meat -= 1;
        s.player.hunger = Math.min(s.player.maxHunger ?? 100, s.player.hunger + 40);
        s = addLog(s, '🍗 Ate cooked meat (+40 hunger)');
      } else if (type === 'fat' && s.inventory.fat > 0) {
        s.inventory.fat -= 1;
        s.player.warmth = Math.min(s.player.maxWarmth ?? 100, s.player.warmth + 25);
        s.player.hunger = Math.min(s.player.maxHunger ?? 100, s.player.hunger + 15);
        s = addLog(s, '🟡 Ate fat (+25 warmth, +15 hunger)');
      } else if (type === 'medkit' && s.inventory.medkit > 0) {
        s.inventory.medkit -= 1;
        const healAmount = 50 + (prof.mods.medkitBonus || 0);
        s.player.hp = Math.min(s.player.maxHp ?? 100, s.player.hp + healAmount);
        s = addLog(s, `🏥 Used medkit (+${healAmount} HP)`);
      } else if (type === 'dried_meat' && s.inventory.dried_meat > 0) {
        s.inventory.dried_meat -= 1;
        s.player.hunger = Math.min(s.player.maxHunger ?? 100, s.player.hunger + 35);
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
      else if (e.key === 'Escape') {
        setMenu(null);
        setSelectedBuild(null);
        setStatModalOpen(false);
        setState(s => (s.combatTarget !== null || s.harvestTarget !== null)
          ? ({ ...s, combatTarget: null, combatTargetType: null, harvestTarget: null })
          : s);
      }
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

    const zombie = state.zombies?.find(z => z.x === tx && z.y === ty && z.hp > 0);
    if (zombie) { engageZombie(zombie); return; }

    const animal = state.animals.find(a => a.x === tx && a.y === ty && a.hp > 0);
    if (animal) { engage(animal); return; }

    const tile = map[ty] && map[ty][tx];
    if (tile === T.TREE || tile === T.ROCK) {
      engageHarvest(tx, ty, tile);
      return;
    }

    // Non-engageable click: disengage both combat and harvest
    if (state.combatTarget !== null || state.harvestTarget !== null) {
      setState(prev => ({ ...prev, combatTarget: null, combatTargetType: null, harvestTarget: null }));
    }

    const building = state.buildings.find(b => b.x === tx && b.y === ty);
    if (building && d <= 1) { interactBuilding(building); return; }

    if (tile === T.PLANE || tile === T.CABIN || tile === T.ARMORY || tile === T.BARRACKS) {
      interact(tx, ty);
      return;
    }
    if (tile !== undefined && TILE_DATA[tile].walkable) {
      setMoveTarget({ x: tx, y: ty });
    }
  };

  if (!gameStarted) {
    return (
      <SetupScreen
        setupStep={setupStep} setSetupStep={setSetupStep}
        chosenMode={chosenMode} setChosenMode={setChosenMode}
        chosenScenario={chosenScenario} setChosenScenario={setChosenScenario}
        chosenProfession={chosenProfession} setChosenProfession={setChosenProfession}
        charName={charName} setCharName={setCharName}
        savedGameMeta={savedGameMeta}
        onContinue={continueGame}
        onDeleteSave={() => { clearSave(); setSavedGameMeta(null); }}
        onStartGame={startGame}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-900 text-slate-100 font-mono overflow-hidden flex flex-col">
      <style>{`
        @keyframes glowPulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.6; } }
        @keyframes flicker { 0% { transform: scale(1) rotate(-1deg); } 100% { transform: scale(1.05) rotate(1deg); } }
        @keyframes smokeRise { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 100% { transform: translateY(-20px) scale(1.5); opacity: 0; } }
        @keyframes auroraShift { 0% { transform: translateX(-10%); opacity: 0.6; } 100% { transform: translateX(10%); opacity: 1; } }
      `}</style>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
        <GameUI state={state} setState={setState} onSaveAndQuit={saveAndQuit} onOpenStatModal={() => setStatModalOpen(true)} />

        <div className="flex flex-1 min-h-0 gap-2 p-1">
          <MapView
            state={state} map={map} view={view} fog={fog} mapScale={mapScale}
            snowflakes={snowflakes} hitFlashes={hitFlashes} footprints={footprints}
            screenShake={screenShake} playerBob={playerBob} moveTarget={moveTarget}
            hover={hover} setHover={setHover}
            tooltipReady={tooltipReady} selectedBuild={selectedBuild}
            onTileClick={handleTileClick}
            damageNumbers={damageNumbers}
          />

          <div className="flex flex-col gap-1 w-72 flex-shrink-0 min-h-0">
            <div className="bg-slate-800 p-1 grid grid-cols-2 gap-1 text-xs flex-shrink-0">
              <button onClick={() => setMenu(menu === 'build' ? null : 'build')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[B] Build</button>
              <button onClick={() => setMenu(menu === 'inventory' ? null : 'inventory')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[I] Inventory</button>
              <button onClick={() => setMenu(menu === 'skills' ? null : 'skills')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[K] Skills</button>
              <button onClick={() => setMenu(menu === 'help' ? null : 'help')} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">[H] Help</button>
            </div>

            <LogPanel log={state.log} />
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
                  <BuildMenu inventory={state.inventory} selectedBuild={selectedBuild}
                    onSelectBuild={(k) => { setSelectedBuild(k === selectedBuild ? null : k); setMenu(null); }} />
                )}
                {menu === 'inventory' && (
                  <InventoryMenu equipment={state.equipment} inventory={state.inventory} onEat={eat} />
                )}
                {menu === 'skills' && <SkillsMenu skills={state.skills} />}
                {menu === 'help' && <HelpMenu scenario={state.scenario} mode={state.mode} />}
              </div>
            </div>
          </div>
        )}

        <DayBanner banner={dayBanner} />
        <LevelUpOverlay banner={levelUpBanner} />
        <StatUpgradeModal open={statModalOpen} state={state} onPick={pickStat} onClose={() => setStatModalOpen(false)} />

        <IntroOverlay
          show={state.showIntro}
          crashSiteName={state.crashSiteName}
          playerName={state.player.name}
          profession={state.profession}
          scenario={state.scenario}
          onBegin={() => setState(s => ({ ...s, showIntro: false, paused: false }))}
        />

        <DeathScreen
          dead={state.dead} rescued={state.rescued}
          scenario={state.scenario}
          playerName={state.player.name}
          profession={state.profession}
          day={state.day}
          deathCause={state.deathCause}
          onNewGame={() => { clearSave(); setSavedGameMeta(null); setGameStarted(false); setSetupStep('mode'); }}
        />
      </div>
    </div>
  );
}

