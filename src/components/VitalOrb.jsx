import React from 'react';

// Diablo-style vital orb. Circle with a bottom-up gradient fill that drains
// as `value` drops. Numeric overlay, soft outer glow, optional pulse.
//
// Props:
//   value, max      : numbers (max defaults to 100)
//   gradient        : 'hp' | 'warmth' — controls fill colors
//   label           : small text shown above the orb (e.g. "HP")
//   pulse           : boolean — soft pulsing animation
//   size            : pixels, default 120
export function VitalOrb({ value, max = 100, gradient = 'hp', label, pulse = false, size = 120 }) {
  const v = Math.max(0, Math.min(max, value));
  const pct = max > 0 ? (v / max) * 100 : 0;

  const fillBg = gradient === 'warmth'
    ? 'linear-gradient(to top, #38bdf8 0%, #fb923c 70%, #fde047 100%)'
    : 'linear-gradient(to top, #7f1d1d 0%, #ef4444 70%, #fca5a5 100%)';

  const glowColor = gradient === 'warmth' ? 'rgba(251,146,60,0.55)' : 'rgba(239,68,68,0.55)';

  return (
    <div className="flex flex-col items-center select-none">
      {label && <div className="text-[10px] text-slate-300 mb-0.5">{label}</div>}
      <div
        className="relative rounded-full overflow-hidden border-2 border-slate-700"
        style={{
          width: size, height: size,
          background: '#0f172a',
          boxShadow: `0 0 ${size / 6}px ${glowColor}, inset 0 0 ${size / 8}px rgba(0,0,0,0.7)`,
          animation: pulse ? 'orbPulse 1.4s ease-in-out infinite' : 'none',
        }}
      >
        {/* Fill */}
        <div
          className="absolute left-0 right-0 bottom-0 transition-[height] duration-200 ease-out"
          style={{ height: `${pct}%`, background: fillBg }}
        />
        {/* Inner shine */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), transparent 45%)',
          }}
        />
        {/* Value text */}
        <div
          className="absolute inset-0 flex items-center justify-center font-bold text-white"
          style={{
            fontSize: size / 6,
            textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.6)',
          }}
        >
          {Math.floor(v)}/{max}
        </div>
      </div>
      <style>{`
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 ${size / 6}px ${glowColor}, inset 0 0 ${size / 8}px rgba(0,0,0,0.7); }
          50%      { box-shadow: 0 0 ${size / 3}px ${glowColor}, inset 0 0 ${size / 8}px rgba(0,0,0,0.7); }
        }
      `}</style>
    </div>
  );
}

// Thin horizontal bar used under each orb for hunger / stamina.
export function MiniBar({ label, value, max = 100, color = 'bg-yellow-600', width = 120 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="mt-1" style={{ width }}>
      <div className="flex justify-between text-[10px] text-slate-300 leading-tight">
        <span>{label}</span>
        <span>{Math.floor(value)}/{max}</span>
      </div>
      <div className="h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-700">
        <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
