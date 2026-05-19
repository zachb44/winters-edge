import React from 'react';

export function ResourceRow({ icon, name, count, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between bg-slate-700/50 p-1 rounded">
      <span>{icon} {name}: <b>{count}</b></span>
      {action && <button onClick={action} className="bg-sky-700 hover:bg-sky-600 px-2 py-0.5 rounded text-xs">{actionLabel}</button>}
    </div>
  );
}
