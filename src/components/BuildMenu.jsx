import React from 'react';
import { BUILDINGS } from '../data/buildings.js';

export function BuildMenu({ inventory, selectedBuild, onSelectBuild }) {
  return (
    <>
      <div className="text-slate-400 mb-2">Click a building, then click a snow tile on the map.</div>
      {Object.entries(BUILDINGS).map(([key, b]) => {
        const canBuild = inventory.wood >= b.wood && inventory.stone >= b.stone && inventory.scrap >= b.scrap;
        return (
          <button key={key} onClick={() => onSelectBuild(key)} disabled={!canBuild}
            className={`w-full text-left p-2 mb-1 rounded ${selectedBuild === key ? 'bg-sky-600' : canBuild ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/50 text-slate-500'}`}>
            <div className="font-bold">{b.emoji} {b.name}</div>
            <div className="text-slate-300">{b.wood > 0 && `🪵${b.wood} `}{b.stone > 0 && `🪨${b.stone} `}{b.scrap > 0 && `🔧${b.scrap}`}</div>
            <div className="text-slate-400">{b.desc}</div>
          </button>
        );
      })}
    </>
  );
}
