import React from 'react';

export function LogPanel({ log }) {
  return (
    <div className="bg-slate-800 p-2 text-xs flex-1 overflow-y-auto min-h-0">
      <div className="font-bold mb-1 text-sky-300">📜 Log</div>
      {log.slice(0, 30).map((l, i) => (
        <div key={i} className="text-slate-300 mb-0.5">
          <span className="text-slate-500">D{l.day} {l.time}h:</span> {l.msg}
        </div>
      ))}
    </div>
  );
}
