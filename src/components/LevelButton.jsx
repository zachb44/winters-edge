import React from 'react';

// Inline top-bar button shown when the player has unspent stat points.
// Styled to match the slate Pause/Speed buttons with a gold accent +
// soft 2-second pulse so it invites a click without being frantic.
// Hidden when there's nothing to spend.
export function LevelButton({ pending, onClick }) {
  if (!pending || pending <= 0) return null;
  return (
    <>
      <button
        onClick={onClick}
        className="bg-slate-700 hover:bg-slate-600 text-amber-300 border border-amber-600/40 px-2 py-1 rounded text-xs font-bold"
        style={{ animation: 'levelButtonPulse 2s ease-in-out infinite' }}
      >
        ⭐ Lv Up{pending > 1 ? ` ×${pending}` : ''} — Choose
      </button>
      <style>{`
        @keyframes levelButtonPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          50%      { box-shadow: 0 0 12px rgba(251, 191, 36, 0.55); }
        }
      `}</style>
    </>
  );
}
