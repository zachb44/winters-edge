import React from 'react';
import { PROFESSIONS } from '../data/professions.js';

export function IntroOverlay({ show, crashSiteName, playerName, profession, scenario, onBegin }) {
  if (!show) return null;
  const prof = PROFESSIONS[profession];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900/95 border-2 border-amber-700/60 rounded-lg shadow-2xl max-w-lg w-[90%] p-6">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">{prof.playerEmoji}</div>
          <div className="text-amber-400/80 text-xs tracking-widest uppercase">Day 1 · {crashSiteName}</div>
        </div>
        <p className="text-slate-200 italic text-base leading-relaxed mb-5 text-center">
          The plane went down at dawn. {playerName} the {prof.name} crawls from the wreckage — alive, cold, alone.
          {' '}
          {scenario === 'rescue'
            ? 'Thirty days until rescue. Maybe.'
            : 'The radio tower is the only way out. Reach it before the cold takes you.'}
        </p>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3 mb-5 text-xs space-y-1 text-slate-300">
          <div>🖱️ Click tiles to move and interact</div>
          <div>🔥 Build a campfire FAST — warmth kills you quickly</div>
          <div>⛺ Build a tent so you can sleep through the night</div>
        </div>
        <button
          onClick={onBegin}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold text-lg">
          Begin
        </button>
      </div>
    </div>
  );
}
