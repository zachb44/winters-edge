import React from 'react';
import { VitalOrb, MiniBar } from './VitalOrb.jsx';
import { PlayerPanel } from './PlayerPanel.jsx';
import { BuildingPanel } from './BuildingPanel.jsx';

// Bottom HUD: HP orb + hunger (left) | center zone (player or building) |
// Warmth orb + stamina (right) | utility + menu strip (far right).
//
// The utility strip holds pause/speed/save (formerly in the top bar) plus
// the overlay-menu buttons (Build, Inventory, Skills, Help).
export function BottomHud({
  state,
  setState,
  selectedBuilding,
  onConsume,
  onActivateAbility,
  onBuildingAction,
  onCraft,
  onCloseBuildingPanel,
  onOpenMenu,
  onSaveAndQuit,
  onOpenStatModal,
}) {
  const hp = state.player.hp;
  const hpMax = state.player.maxHp ?? 100;
  const warmth = state.player.warmth;
  const warmthMax = state.player.maxWarmth ?? 100;
  const hunger = state.player.hunger;
  const hungerMax = state.player.maxHunger ?? 100;
  const stamina = state.player.stamina;
  const staminaMax = state.player.maxStamina ?? 100;

  return (
    <div className="flex items-end gap-3 px-3 py-2 bg-slate-900/90 border-t border-slate-700 flex-shrink-0">
      {/* Left: HP orb + hunger bar */}
      <div className="flex flex-col items-center">
        <VitalOrb value={hp} max={hpMax} gradient="hp" label="❤️ HP" size={110} />
        <MiniBar label="🍖 Hunger" value={hunger} max={hungerMax} color="bg-yellow-600" width={110} />
      </div>

      {/* Center: player portrait or selected building */}
      <div className="flex-1 flex justify-center">
        {selectedBuilding ? (
          <BuildingPanel
            state={state}
            selectedBuilding={selectedBuilding}
            onAction={onBuildingAction}
            onCraft={onCraft}
            onClose={onCloseBuildingPanel}
          />
        ) : (
          <PlayerPanel
            state={state}
            onConsume={onConsume}
            onActivateAbility={onActivateAbility}
            onOpenStatModal={onOpenStatModal}
          />
        )}
      </div>

      {/* Right: Warmth orb + stamina bar */}
      <div className="flex flex-col items-center">
        <VitalOrb
          value={warmth}
          max={warmthMax}
          gradient="warmth"
          label="🔥 Warmth"
          size={110}
          pulse={warmth < 30}
        />
        <MiniBar label="⚡ Stamina" value={stamina} max={staminaMax} color="bg-green-500" width={110} />
      </div>

      {/* Far right: utility + menu strip */}
      <div className="flex flex-col gap-1 items-stretch">
        <div className="flex gap-1">
          <button
            onClick={() => setState(s => ({ ...s, paused: !s.paused }))}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[11px]"
            title="Pause [Space]"
          >
            {state.paused ? '▶' : '⏸'}
          </button>
          {[1, 2, 3].map(sp => (
            <button
              key={sp}
              onClick={() => setState(s => ({ ...s, gameSpeed: sp }))}
              className={`px-2 py-1 rounded text-[11px] border ${state.gameSpeed === sp
                ? 'bg-sky-600 border-sky-400'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600'}`}
            >
              {sp}x
            </button>
          ))}
        </div>
        <button
          onClick={onSaveAndQuit}
          className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 rounded px-2 py-1 text-[11px]"
          title="Save & Quit"
        >
          💾 Save
        </button>
        <div className="h-px bg-slate-700 my-0.5" />
        <button
          onClick={() => onOpenMenu('build')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[11px]"
          title="Build [B]"
        >
          🔨 Build
        </button>
        <button
          onClick={() => onOpenMenu('inventory')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[11px]"
          title="Inventory [I]"
        >
          🎒 Inv
        </button>
        <button
          onClick={() => onOpenMenu('skills')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[11px]"
          title="Skills [K]"
        >
          ⭐ Skills
        </button>
        <button
          onClick={() => onOpenMenu('help')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[11px]"
          title="Help [H]"
        >
          ❓ Help
        </button>
      </div>
    </div>
  );
}
