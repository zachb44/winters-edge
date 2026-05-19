import React from 'react';

export function PredatorAlert({ predator }) {
  if (!predator) return null;
  return (
    <div className="absolute top-2 right-2 pointer-events-none">
      {predator === 'bear' ? (
        <div className="bg-red-900/90 border-2 border-red-500 rounded px-3 py-2 text-sm font-bold text-red-100 animate-pulse shadow-lg shadow-red-500/50">
          <span className="text-2xl mr-1">🐻</span> BEAR NEARBY — RUN
        </div>
      ) : (
        <div className="bg-red-900/80 border border-red-600 rounded px-2 py-1 text-xs font-bold text-red-200 shadow-lg shadow-red-500/30">
          🐺 Wolf nearby!
        </div>
      )}
    </div>
  );
}
