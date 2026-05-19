import React from 'react';

// 2-second celebratory overlay. Pure presentational; the parent
// passes `banner = { level }` to show it, or null to hide.
export function LevelUpOverlay({ banner }) {
  if (!banner) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/40">
      <div className="text-center" style={{ animation: 'levelUpPulse 2s ease-out forwards' }}>
        <div className="text-6xl font-bold tracking-widest"
          style={{ color: '#fbbf24', textShadow: '0 0 30px #f59e0b, 0 0 60px #f59e0b' }}>
          LEVEL UP!
        </div>
        <div className="text-amber-200 text-xl mt-3 italic">You are now Level {banner.level}</div>
      </div>
      <style>{`
        @keyframes levelUpPulse {
          0%   { transform: scale(0.6); opacity: 0; }
          15%  { transform: scale(1.15); opacity: 1; }
          25%  { transform: scale(1); opacity: 1; }
          85%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.05); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
