import React from 'react';

export function DayBanner({ banner }) {
  if (!banner) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm border border-amber-700/50 rounded-lg px-10 py-6 text-center animate-pulse">
        <div className="text-5xl font-bold text-amber-300 tracking-widest">DAY {banner.day}</div>
        {banner.event && <div className="text-slate-300 italic text-sm mt-2">{banner.event}</div>}
      </div>
    </div>
  );
}
