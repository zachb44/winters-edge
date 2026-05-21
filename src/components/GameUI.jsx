import React from 'react';
import { DayNightDial } from './DayNightDial.jsx';

// Slim top bar: just the day/night dial with its labels, plus a thin raw-
// resource ribbon underneath. Identity, level-up button, pause/speed,
// and save all live in the bottom HUD now.
export function GameUI({ state }) {
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
      <div className="bg-slate-800 px-2 py-1 flex items-center justify-center gap-3 text-xs border-b border-slate-700 flex-shrink-0">
        <DayNightDial time={state.time} />
        <div className="flex flex-col leading-tight">
          {state.mode === 'outbreak' && state.isNightPhase
            ? (
              <span className="text-red-300 font-semibold">
                Night <span className="text-red-200 font-bold">{state.wave?.nightNumber || state.day}</span>{state.scenario === 'rescue' ? ' / 30' : ''}
              </span>
            )
            : (
              <span className="font-semibold">
                Day <span className="text-white font-bold">{state.day}</span>{state.mode !== 'outbreak' && state.scenario === 'rescue' ? ' / 30' : ''}
              </span>
            )
          }
          <span className="text-[11px] text-slate-300">{timeStr}</span>
          <span className="text-[11px] text-slate-300">
            {state.weather === 'clear' && '☀️ Clear'}
            {state.weather === 'snow' && '🌨️ Snowing'}
            {state.weather === 'blizzard' && '🌬️ BLIZZARD'}
          </span>
        </div>
      </div>

      <div className="bg-slate-800/80 px-2 py-0.5 flex flex-wrap justify-center gap-4 text-xs border-b border-slate-700 flex-shrink-0">
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
