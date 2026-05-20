import React from 'react';
import { TILE, VIEW_W, VIEW_H } from '../constants.js';
import { T, TILE_DATA } from '../data/tiles.js';
import { BUILDINGS } from '../data/buildings.js';
import { PROFESSIONS } from '../data/professions.js';
import { LOOT_BUDGET } from '../data/loot.js';
import { visibilityAt } from '../logic/visibility.js';
import { PredatorAlert } from './PredatorAlert.jsx';
import { FloatingDamage } from './FloatingDamage.jsx';
import { CombatOverlay } from './CombatOverlay.jsx';
import { HarvestHpBars } from './HarvestHpBars.jsx';

export function MapView({
  state, map, view, fog, mapScale,
  snowflakes, hitFlashes, footprints, screenShake, playerBob, moveTarget,
  hover, setHover, tooltipReady, selectedBuild,
  onTileClick,
  damageNumbers,
}) {
  const now = Date.now();
  const target = state.combatTarget != null
    ? (state.combatTargetType === 'zombie'
        ? state.zombies.find(z => z.id === state.combatTarget)
        : state.animals.find(a => a.id === state.combatTarget))
    : null;
  const lungeAimAt = target || state.harvestTarget || null;
  const playerLungeOff = (state.player.lungeUntil > now && lungeAimAt)
    ? { dx: Math.sign(lungeAimAt.x - state.player.x) * 4, dy: Math.sign(lungeAimAt.y - state.player.y) * 4 }
    : { dx: 0, dy: 0 };
  let skyColor = 'rgba(0,0,0,0)';
  if (state.time < 5) skyColor = 'rgba(15, 25, 55, 0.6)';
  else if (state.time < 6) skyColor = 'rgba(60, 50, 90, 0.4)';
  else if (state.time < 7) skyColor = 'rgba(255, 150, 90, 0.18)';
  else if (state.time < 18) skyColor = 'rgba(255, 230, 150, 0.06)';
  else if (state.time < 19) skyColor = 'rgba(255, 130, 80, 0.22)';
  else if (state.time < 21) skyColor = 'rgba(60, 50, 90, 0.45)';
  else skyColor = 'rgba(15, 25, 55, 0.55)';

  const weatherOverlay = state.weather === 'blizzard' ? 'rgba(255,255,255,0.25)'
    : state.weather === 'snow' ? 'rgba(255,255,255,0.08)'
    : 'transparent';

  const isNight = state.time < 6 || state.time > 19;
  let nearbyPredator = null;
  for (const a of state.animals) {
    if (a.hp <= 0) continue;
    const d = Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y);
    if (a.type === 'bear' && d <= 4) { nearbyPredator = 'bear'; break; }
    if (a.type === 'wolf' && d <= 4 && isNight && nearbyPredator !== 'bear') nearbyPredator = 'wolf';
  }

  const shakeStyle = screenShake > 0 ? {
    transform: `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`,
    transition: 'transform 0.05s',
  } : {};

  return (
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
            const depleted = (tile === T.PLANE || tile === T.CABIN || tile === T.ARMORY || tile === T.BARRACKS)
              && state.lootCounts && state.lootCounts[`${tx},${ty}`] === 0;
            let filter = 'none';
            if (vis === 1) filter = 'brightness(0.45) saturate(0.5)';
            else if (depleted) filter = 'grayscale(0.7) opacity(0.55)';
            return (
              <div key={`${tx}-${ty}`}
                onClick={() => vis > 0 && onTileClick(tx, ty)}
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

        {(() => {
          const counts = {};
          for (const z of (state.zombies || [])) {
            if (z.hp <= 0) continue;
            if (z.x < view.x || z.x >= view.x + VIEW_W || z.y < view.y || z.y >= view.y + VIEW_H) continue;
            const vis = visibilityAt(fog, state.player.x, state.player.y, z.x, z.y);
            if (vis < 2) continue;
            const key = `${z.x},${z.y}`;
            if (!counts[key]) counts[key] = { x: z.x, y: z.y, n: 0, lead: z };
            counts[key].n += 1;
          }
          return Object.values(counts).map(({ x, y, n, lead }) => {
            const lunging = lead.lungeUntil > now;
            const lx = lunging ? Math.sign(state.player.x - x) * 4 : 0;
            const ly = lunging ? Math.sign(state.player.y - y) * 4 : 0;
            return (
              <div key={`z-${x}-${y}`} className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  left: (x - view.x) * TILE + lx, top: (y - view.y) * TILE + ly, width: TILE, height: TILE, fontSize: 22,
                  transition: 'left 0.1s, top 0.1s',
                }}>
                🧟
                {n > 1 && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[10px] bg-red-700/90 text-white px-1 rounded leading-tight">×{n}</span>
                )}
              </div>
            );
          });
        })()}

        {state.animals.filter(a => a.hp > 0 && a.x >= view.x && a.x < view.x + VIEW_W && a.y >= view.y && a.y < view.y + VIEW_H).map((a, i) => {
          const vis = visibilityAt(fog, state.player.x, state.player.y, a.x, a.y);
          if (vis < 2) return null;
          const lunging = a.lungeUntil > now;
          const lx = lunging ? Math.sign(state.player.x - a.x) * 4 : 0;
          const ly = lunging ? Math.sign(state.player.y - a.y) * 4 : 0;
          return (
            <div key={`a-${a.id ?? i}`} className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: (a.x - view.x) * TILE + lx, top: (a.y - view.y) * TILE + ly, width: TILE, height: TILE, fontSize: 22,
                transition: 'left 0.1s, top 0.1s',
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
            left: (state.player.x - view.x) * TILE + playerLungeOff.dx,
            top: (state.player.y - view.y) * TILE + playerLungeOff.dy + (moveTarget ? Math.sin(playerBob * 0.3) * 2 : 0),
            width: TILE, height: TILE, fontSize: 26,
            transition: 'left 0.1s, top 0.1s',
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

        <CombatOverlay combatTarget={state.combatTarget} combatTargetType={state.combatTargetType} animals={state.animals} zombies={state.zombies || []} player={state.player} view={view} />
        <HarvestHpBars tileHp={state.tileHp} map={map} view={view} />
        <FloatingDamage items={damageNumbers} view={view} />
        <PredatorAlert predator={nearbyPredator} />

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
          else if (tile === T.ARMORY) text = remaining > 0 ? `🪖 Armory — Click to search (${remaining} uses left)` : 'Armory — Searched';
          else if (tile === T.BARRACKS) text = remaining > 0 ? `🛏️ Barracks — Click to search (${remaining} uses left)` : 'Barracks — Searched';
          else if (tile === T.WATCHTOWER) text = '🏗️ Watchtower';
          else if (tile === T.SANDBAG) text = '🟤 Sandbag Wall';
          else if (tile === T.MILITARY_FLOOR) text = '🟫 Concrete Floor';
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
  );
}
