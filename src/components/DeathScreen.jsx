import React from 'react';
import { PROFESSIONS } from '../data/professions.js';

export function DeathScreen({ dead, rescued, scenario, playerName, profession, day, deathCause, onNewGame }) {
  if (!dead && !rescued) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-lg border border-slate-600 text-center max-w-md">
        <div className="text-4xl mb-3">{rescued ? (scenario === 'tower' ? '📡' : '🚁') : '💀'}</div>
        <div className="text-2xl font-bold mb-2">{rescued ? 'SURVIVED' : 'YOU DIED'}</div>
        {dead && deathCause && (
          <div className="text-red-300 italic text-sm mb-2">{deathCause}</div>
        )}
        <div className="text-slate-300 mb-4">
          {playerName} the {PROFESSIONS[profession].name}<br/>
          {rescued ? `Made it on day ${day}.` : `Survived ${day} days.`}
        </div>
        <button onClick={onNewGame} className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded">
          New Game
        </button>
      </div>
    </div>
  );
}
