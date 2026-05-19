import React from 'react';

export function Vital({ label, value, color, warning, criticalLabel }) {
  const critical = !!criticalLabel;
  return (
    <div className={`flex-1 min-w-32 ${critical ? 'p-1 -m-1 rounded ring-2 ring-red-500/70 animate-pulse' : warning ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between text-xs mb-0.5">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          {critical && <span className="text-red-300 text-[10px] font-bold">{criticalLabel}</span>}
          <span>{Math.floor(value)}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
