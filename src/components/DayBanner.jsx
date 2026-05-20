import React from 'react';

export function DayBanner({ banner }) {
  if (!banner) return null;
  if (banner.type === 'night') {
    const zones = banner.activeZoneNames || [];
    let subtitle = `${banner.waveSize} shamblers approaching...`;
    if (zones.length === 2) {
      subtitle = `${banner.waveSize} shamblers from the ${zones[0]} and ${zones[1]}`;
    } else if (zones.length >= 3) {
      subtitle = `${banner.waveSize} shamblers from ${zones.slice(0, -1).join(', ')}, and ${zones[zones.length - 1]}`;
    } else if (zones.length === 1) {
      subtitle = `${banner.waveSize} shamblers from the ${zones[0]}`;
    }
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm border border-red-700/70 rounded-lg px-10 py-6 text-center animate-pulse">
          <div className="text-5xl font-bold text-red-400 tracking-widest">NIGHT {banner.nightNumber}</div>
          <div className="text-red-200 italic text-sm mt-2">{subtitle}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm border border-amber-700/50 rounded-lg px-10 py-6 text-center animate-pulse">
        <div className="text-5xl font-bold text-amber-300 tracking-widest">DAY {banner.day}</div>
        {banner.event && <div className="text-slate-300 italic text-sm mt-2">{banner.event}</div>}
      </div>
    </div>
  );
}
