import React from 'react';

export function SkillRow({ name, lvl, xp, max, desc }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between"><span><b>{name}</b> Lv.{lvl}</span><span className="text-slate-400">{xp}/{max}</span></div>
      <div className="h-1 bg-slate-700 rounded overflow-hidden">
        <div className="h-full bg-sky-500" style={{ width: `${(xp/max)*100}%` }}></div>
      </div>
      <div className="text-slate-400 text-xs">{desc}</div>
    </div>
  );
}
