import React from 'react';
import { SCENARIOS } from '../data/scenarios.js';

export function HelpMenu({ scenario }) {
  return (
    <div className="space-y-1">
      <div><b>Goal:</b> {SCENARIOS[scenario].desc}</div>
      <div className="border-t border-slate-700 pt-1 mt-1">
        <div><b>Click</b> tiles to move/interact.</div>
        <div><b>Trees</b>→wood. <b>Rocks</b>→stone. <b>Plane/Cabin</b>→loot.</div>
        <div><b>Animals</b> (adjacent)→attack.</div>
        <div><b>Campfire + raw meat</b>→click to cook.</div>
        <div><b>Tent</b> at night→sleep.</div>
      </div>
      <div className="border-t border-slate-700 pt-1">
        <b>Keys:</b> B I K H, Space=Pause, 1/2/3=Speed, Esc=Cancel
      </div>
    </div>
  );
}
