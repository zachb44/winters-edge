import React, { memo } from 'react';

// 24-segment circular dial that fills in clockwise as the day progresses.
// Day-hour slices (06-17) are amber; night-hour slices (00-05, 18-23) are
// cool blue. The active hour fades in via opacity to read as "filling".
// Center swaps between sun and moon, with a two-hour cross-fade at dawn
// (05-07) and dusk (17-19). A breathing outer glow tracks the active icon.
//
// Pure visual — driven by the existing state.time tick (every 100ms).

const SIZE = 72;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = SIZE / 2 - 2;
const R_INNER = SIZE / 4;

function slicePath(idx) {
  // 24 slices, 15° each, starting at -90° (12 o'clock) and sweeping clockwise.
  const startDeg = idx * 15 - 90;
  const endDeg = (idx + 1) * 15 - 90;
  const startRad = startDeg * Math.PI / 180;
  const endRad = endDeg * Math.PI / 180;
  const x1 = CX + R_OUTER * Math.cos(startRad);
  const y1 = CY + R_OUTER * Math.sin(startRad);
  const x2 = CX + R_OUTER * Math.cos(endRad);
  const y2 = CY + R_OUTER * Math.sin(endRad);
  const xi1 = CX + R_INNER * Math.cos(startRad);
  const yi1 = CY + R_INNER * Math.sin(startRad);
  const xi2 = CX + R_INNER * Math.cos(endRad);
  const yi2 = CY + R_INNER * Math.sin(endRad);
  return `M ${xi1} ${yi1} L ${x1} ${y1} A ${R_OUTER} ${R_OUTER} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${R_INNER} ${R_INNER} 0 0 0 ${xi1} ${yi1} Z`;
}

const SLICE_PATHS = Array.from({ length: 24 }, (_, i) => slicePath(i));

function isDayHour(idx) {
  return idx >= 6 && idx < 18;
}

function DayNightDialInner({ time }) {
  const t = Math.max(0, Math.min(24, time));
  const currentHour = Math.floor(t);
  const partial = t - currentHour;

  // Sun visibility: 1 when full day, 0 when full night, blended in transition.
  // Dawn 05-07 → sun fades in. Dusk 17-19 → sun fades out.
  let sunOpacity;
  if (t >= 7 && t < 17) sunOpacity = 1;
  else if (t >= 19 || t < 5) sunOpacity = 0;
  else if (t >= 5 && t < 7) sunOpacity = (t - 5) / 2;
  else /* 17..19 */ sunOpacity = 1 - (t - 17) / 2;
  const moonOpacity = 1 - sunOpacity;

  const isNightFeel = sunOpacity < 0.5;
  const glowColor = isNightFeel ? 'rgba(96,165,250,0.55)' : 'rgba(251,191,36,0.55)';

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 12px ${glowColor}`,
          animation: 'dialBreath 4s ease-in-out infinite',
        }}
      />
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative">
        {SLICE_PATHS.map((d, i) => {
          const dayHour = isDayHour(i);
          const baseColor = dayHour ? '#f59e0b' : '#3b82f6';
          const dim = '#1e293b';
          let fill = dim;
          let opacity = 1;
          if (i < currentHour) {
            fill = baseColor;
          } else if (i === currentHour) {
            fill = baseColor;
            opacity = Math.max(0.1, partial);
          }
          return (
            <path
              key={i}
              d={d}
              fill={fill}
              opacity={opacity}
              stroke="#0f172a"
              strokeWidth="0.4"
            />
          );
        })}
        {/* Outer ring for definition */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#334155" strokeWidth="1" />
        {/* Inner hub */}
        <circle cx={CX} cy={CY} r={R_INNER - 0.5} fill="#0f172a" stroke="#334155" strokeWidth="0.6" />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ fontSize: SIZE / 3.2 }}
      >
        <span className="absolute" style={{ opacity: sunOpacity, filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))' }}>☀️</span>
        <span className="absolute" style={{ opacity: moonOpacity, filter: 'drop-shadow(0 0 4px rgba(148,163,184,0.7))' }}>🌙</span>
      </div>
      <style>{`
        @keyframes dialBreath {
          0%, 100% { box-shadow: 0 0 8px ${glowColor}; }
          50%      { box-shadow: 0 0 18px ${glowColor}; }
        }
      `}</style>
    </div>
  );
}

export const DayNightDial = memo(DayNightDialInner, (a, b) => Math.abs(a.time - b.time) < 0.01);
