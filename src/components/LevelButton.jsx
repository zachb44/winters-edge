import React from 'react';

// Persistent button in the top-right when the player has unspent
// stat points. Pulses gently to draw attention. Shows the count
// as "(×N)" when more than one is pending.
export function LevelButton({ pending, onClick }) {
  if (!pending || pending <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="fixed top-2 right-2 z-30 bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold animate-pulse shadow-lg shadow-amber-500/40 border border-amber-300"
    >
      ⭐ Level Up Available{pending > 1 ? ` (×${pending})` : ''} — choose a stat
    </button>
  );
}
