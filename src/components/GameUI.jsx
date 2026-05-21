import React from 'react';
import { PROFESSIONS } from '../data/professions.js';
import { levelProgress } from '../data/leveling.js';
import { LevelButton } from './LevelButton.jsx';

// Slim top bar: identity + day/night + clock + weather + pause/speed + save.
// Plus a thin raw-resource ribbon (wood/stone/scrap/cloth) — everything
// edible/medical moved to the bottom-HUD belt or inventory overlay.
export function GameUI({ state, setState, onSaveAndQuit, onOpenStatModal }) {
  const isNight = state.time < 6 || state.time > 19;
  const timeStr = `${Math.floor(state.time).toString().padStart(2, '0')}:${Math.floor((state.time % 1) * 60).toString().padStart(2, '0')}`;
  const towerProgress = state.scenario === 'tower' ? {
    food: state.inventory.food + state.inventory.cooked_meat,
    foodNeeded: 10,
    wood: state.inventory.wood,
    woodNeeded: 5,
    coat: state.equipment.hasCoat,
  } : null;

  return (
    <>
      <div className="bg-slate-800 px-2 py-1 flex flex-wrap items-center gap-2 text-xs border-b border-slate-700 flex-shrink-0">
        <div className="font-bold text-sky-300 flex items-center gap-1">
          ❄️ {PROFESSIONS[state.profession].emoji} {state.player.name}
          <span className="text-amber-300 text-[10px] font-normal">(Lv {state.characterLevel || 1})</span>
          <div className="w-12 h-0.5 bg-slate-700 rounded overflow-hidden ml-1">
            <div className="h-full bg-amber-400" style={{ width: `${levelProgress(state).pct * 100}%` }}></div>
          </div>
        </div>
        <LevelButton pending={state.unspentStatPoints || 0} onClick={onOpenStatModal} />
        {state.mode === 'outbreak' && state.isNightPhase
          ? (
            <div className="text-red-300">Night <span className="text-red-200 font-bold">{state.wave?.nightNumber || state.day}</span>{state.scenario === 'rescue' ? ' / 30' : ''}</div>
          )
          : (
            <div>Day <span className="text-white font-bold">{state.day}</span>{state.mode !== 'outbreak' && state.scenario === 'rescue' ? '/30' : ''}</div>
          )
        }
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
        <button onClick={onSaveAndQuit} className="bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-xs">
          💾 Save &amp; Quit
        </button>
      </div>

      <div className="bg-slate-800/80 px-2 py-0.5 flex flex-wrap gap-3 text-xs border-b border-slate-700 flex-shrink-0">
        <span>🪵 {state.inventory.wood}</span>
        <span>🪨 {state.inventory.stone}</span>
        <span>🔧 {state.inventory.scrap}</span>
        <span>🧵 {state.inventory.cloth || 0}</span>
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
    </>
  );
}
