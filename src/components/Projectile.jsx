import React from 'react';
import { TILE } from '../constants.js';

// Renders one in-flight projectile as a CSS-animated element. Positioned in
// the same transformed coordinate space as MapView content (tiles).
//
// Props:
//   p           = { id, fromX, fromY, toX, toY, type, startTime, duration }
//   view        = current map viewport { x, y } (top-left tile in view)
export function Projectile({ p, view }) {
  const fromPx = {
    left: (p.fromX - view.x) * TILE + TILE / 2,
    top: (p.fromY - view.y) * TILE + TILE / 2,
  };
  const toPx = {
    left: (p.toX - view.x) * TILE + TILE / 2,
    top: (p.toY - view.y) * TILE + TILE / 2,
  };
  const dx = toPx.left - fromPx.left;
  const dy = toPx.top - fromPx.top;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const isRifle = p.type === 'rifle';
  const size = isRifle ? 6 : 10;
  const color = isRifle ? '#fde047' : '#e5e7eb';
  const glow = isRifle
    ? '0 0 6px 2px rgba(253,224,71,0.7)'
    : '0 0 4px 1px rgba(229,231,235,0.6)';

  const elapsed = Date.now() - p.startTime;
  const progress = Math.min(1, elapsed / p.duration);
  const x = fromPx.left + dx * progress;
  const y = fromPx.top + dy * progress;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: isRifle ? size : 2,
        background: color,
        borderRadius: isRifle ? '50%' : '1px',
        boxShadow: glow,
        transform: `rotate(${angle}deg)`,
        opacity: progress < 0.95 ? 1 : 0.3,
      }}
    />
  );
}
