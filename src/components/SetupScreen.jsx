import React from 'react';
import { SCENARIOS } from '../data/scenarios.js';
import { PROFESSIONS } from '../data/professions.js';
import { ITEM_INFO } from '../data/loot.js';

export function SetupScreen({
  setupStep, setSetupStep,
  chosenScenario, setChosenScenario,
  chosenProfession, setChosenProfession,
  charName, setCharName,
  savedGameMeta, onContinue, onDeleteSave,
  onStartGame,
}) {
  if (setupStep === 'scenario') {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">❄️</div>
            <h1 className="text-3xl font-bold text-sky-300">Winter's Edge</h1>
            <p className="text-slate-400 mt-2">A survival game in a frozen wilderness</p>
          </div>
          {savedGameMeta && (
            <div className="mb-6">
              <button onClick={onContinue}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold text-lg">
                ▶ Continue Run
              </button>
              <div className="text-center text-xs text-slate-400 mt-1">
                Day {savedGameMeta.day} — {PROFESSIONS[savedGameMeta.profession]?.name || 'Survivor'}
              </div>
              <button onClick={onDeleteSave}
                className="w-full mt-1 text-xs text-slate-500 hover:text-slate-300">
                Delete saved game
              </button>
            </div>
          )}
          <div className="space-y-3 mb-6">
            <h2 className="text-lg font-bold text-slate-300">Step 1 of 2 — Choose Your Scenario</h2>
            {Object.entries(SCENARIOS).map(([key, sc]) => (
              <button key={key} onClick={() => setChosenScenario(key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${chosenScenario === key ? 'border-sky-400 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{sc.icon}</span>
                  <span className="text-lg font-bold">{sc.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{sc.difficulty}</span>
                </div>
                <p className="text-sm text-slate-300">{sc.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setSetupStep('character')} className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold text-lg">
            Next: Choose Your Survivor →
          </button>
        </div>
      </div>
    );
  }

  const prof = PROFESSIONS[chosenProfession];
  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 p-4 font-mono flex items-center justify-center">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">{prof.playerEmoji}</div>
          <h1 className="text-2xl font-bold text-sky-300">Choose Your Survivor</h1>
          <p className="text-slate-400 text-sm mt-1">Step 2 of 2 — Each profession plays differently</p>
        </div>
        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-1 block">Name your survivor:</label>
          <input type="text" value={charName} onChange={(e) => setCharName(e.target.value.slice(0, 20))}
            placeholder="Survivor"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-sky-500 outline-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {Object.entries(PROFESSIONS).map(([key, p]) => (
            <button key={key} onClick={() => setChosenProfession(key)}
              className={`text-left p-3 rounded-lg border-2 transition ${chosenProfession === key ? 'border-sky-400 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-bold">{p.name}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{p.desc}</p>
              <div className="text-xs text-green-400">
                {p.bonuses.map((b, i) => <div key={i}>+ {b}</div>)}
              </div>
              <div className="text-xs text-orange-400 mt-1">
                {p.tradeoffs.map((t, i) => <div key={i}>− {t}</div>)}
              </div>
            </button>
          ))}
        </div>
        <div className="bg-slate-800 rounded p-3 mb-4 text-xs">
          <div className="font-bold text-slate-300 mb-1">Starting inventory for {prof.name}:</div>
          <div className="text-slate-400">
            {Object.entries(prof.startInv).map(([item, qty]) => (
              <span key={item} className="inline-block mr-3">
                {(ITEM_INFO[item] && ITEM_INFO[item].icon) || '•'} {qty} {(ITEM_INFO[item] && ITEM_INFO[item].name) || item}
              </span>
            ))}
          </div>
          <div className="text-slate-500 mt-2 italic">
            🛬 Your plane will crash at a random location.
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSetupStep('scenario')} className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg">← Back</button>
          <button onClick={() => { setSetupStep('scenario'); onStartGame(chosenScenario, chosenProfession, charName); }}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-lg font-bold text-lg">
            Begin Survival
          </button>
        </div>
        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <div>• Click to move and interact. Click trees to chop, animals to attack.</div>
          <div>• Build a campfire FAST — warmth kills you quickly.</div>
          <div>• Keys: B I K H, Space=Pause, 1/2/3=Speed</div>
        </div>
      </div>
    </div>
  );
}
