# Mode Selection Screen

**Phase 1 — Outbreak Mode core. Run this FIRST before 02, 03, or 04.**

Copy this entire block into Claude Code as a single prompt.

---

Update the character creation flow to add a Mode selection step before the existing Scenario step. This is the entry point for the entire two-mode design (see `docs/PIVOT.md`).

## Current flow

`SetupScreen.jsx` has two steps managed by `setupStep` state:
1. `'scenario'` — pick Wait for Rescue or Reach the Radio Tower (from `src/data/scenarios.js`)
2. `'character'` — pick profession, name, then start

## New flow

1. **`'mode'`** — pick Wilderness Mode or Outbreak Mode *(NEW)*
2. `'scenario'` — pick scenario (labels change per mode)
3. `'character'` — pick profession, name, then start

## What to build

### Step 1: Mode data

Create `src/data/modes.js`:

```js
export const MODES = {
  wilderness: {
    name: 'Wilderness Mode',
    icon: '❄️',
    tagline: 'The cold is hunting you.',
    desc: 'Classic survival against nature. Hunger and warmth are your enemies. Wildlife is the threat. Slow-burn, contemplative, deadly.',
    tone: 'The Long Dark meets Don\'t Starve',
  },
  outbreak: {
    name: 'Outbreak Mode',
    icon: '☠️',
    tagline: 'The dead walk at night.',
    desc: 'Action-survival at a military outpost. Zombies come every night in growing waves. Day = gather and fortify. Night = defend. Hunger and warmth are background concerns.',
    tone: 'State of Decay meets They Are Billions',
  },
};
```

### Step 2: Update scenarios to be mode-aware

Update `src/data/scenarios.js` to include mode-specific naming:

```js
export const SCENARIOS = {
  rescue: {
    name: { wilderness: 'Wait for Rescue', outbreak: 'Hold the Line' },
    desc: { wilderness: 'Survive 30 days. A rescue chopper is coming.', outbreak: 'Survive 30 nights. Hold your position until extraction arrives.' },
    difficulty: 'Medium',
    icon: '🚁',
    days: 30,
  },
  tower: {
    name: { wilderness: 'Reach the Radio Tower', outbreak: 'Reach the Radio Tower' },
    desc: { wilderness: 'Bring 10 food, 5 wood, and your coat to the radio tower.', outbreak: 'Fight through the horde to reach the radio tower and call for extraction.' },
    difficulty: 'Medium-Hard',
    icon: '📡',
  },
};
```

**Important:** Update all references to `SCENARIOS[key].name` and `SCENARIOS[key].desc` throughout the codebase to use the mode-aware format: `SCENARIOS[key].name[state.mode]` or fallback to a string check. Search for every usage of `SCENARIOS` in `src/` and update accordingly. Key places to check:
- `SetupScreen.jsx` — scenario selection display
- `App.jsx` — anywhere scenario name is rendered (day banner, win condition check, etc.)
- `GameUI.jsx` — if scenario name appears in the UI

### Step 3: Update SetupScreen.jsx

Add a new `'mode'` step as the first screen. The `setupStep` state should default to `'mode'` instead of `'scenario'`.

**Mode selection screen layout:**
- Title: "❄️ Winter's Edge" (same branding as current)
- Subtitle: "Choose your survival"
- Continue button (if saved game exists) — same as current, stays at top
- Two large mode cards side by side (or stacked on mobile):
  - Each shows: icon, mode name, tagline, description, tone reference
  - Click to select (highlight border like current scenario cards)
- "Next" button → advances to scenario step

**Scenario step updates:**
- Header changes to show selected mode: "Step 2 of 3 — Choose Your Scenario"
- Scenario cards show mode-appropriate names and descriptions
- Back button returns to mode selection

**Character step updates:**
- Header: "Step 3 of 3 — Choose Your Survivor"
- Back button returns to scenario
- The crash site flavor text at the bottom should be mode-aware:
  - Wilderness: "🛬 Your plane will crash at a random location."
  - Outbreak: "🛬 Your plane will crash near a military outpost."

### Step 4: Store mode in game state

Add `state.mode` (string: `'wilderness'` or `'outbreak'`) to the game state object. Set it during `onStartGame`. It must persist through save/load.

**In `src/logic/saveLoad.js`:** Add `mode: 'wilderness'` as the default migration value for older saves that don't have it.

### Step 5: Mode-dependent config constants

Create `src/data/modeConfig.js`:

```js
export const MODE_CONFIG = {
  wilderness: {
    hungerDrain: 0.15,
    warmthDrain: 0.3,
    winLabel: 'Survive 30 days',
    dayLabel: (day) => `Day ${day}`,
    zombiesEnabled: false,
  },
  outbreak: {
    hungerDrain: 0.04,
    warmthDrain: 0.08,
    winLabel: 'Survive 30 nights',
    dayLabel: (day) => `Day ${day}`,  // Night label format added in seed 03
    zombiesEnabled: true,
  },
};
```

**Do NOT wire these config values into the game loop yet.** That happens in seeds 03 (wave spawner) and 04 (vitals rebalance). This seed only creates the data and stores the mode selection. The game should play identically in both modes after this seed — the differences come later.

## What this does NOT do

- Does NOT add zombies (that's seed 02)
- Does NOT change hunger/warmth drain rates in gameplay (that's seed 04)
- Does NOT change the day banner to night format (that's seed 03)
- Does NOT change the map or crash site positioning (that's seeds 05/06)

This seed is purely: mode selection UI + data structures + state persistence. The game plays identically in both modes until subsequent seeds wire in the differences.

## Acceptance criteria

- [ ] New game flow: Mode → Scenario → Character → Start
- [ ] `state.mode` is set and persists through save/load
- [ ] Old saves load with `mode: 'wilderness'` default
- [ ] Scenario names/descriptions change based on selected mode
- [ ] All existing functionality unchanged — no gameplay differences yet
- [ ] `src/data/modes.js` and `src/data/modeConfig.js` exist with correct data

## Constraints

- Don't break any existing game logic
- Don't change how the game plays — this is setup-screen-only
- Keep the visual style consistent with existing SetupScreen (slate-900 bg, sky-300 accents, mono font)

Commit message: `feat: mode selection screen (Wilderness vs Outbreak) in character creation`

## Plan before executing

1. Read `src/components/SetupScreen.jsx`, `src/data/scenarios.js`, `src/logic/saveLoad.js`
2. Search for all `SCENARIOS` references in `src/`
3. Propose the flow changes
4. Wait for go-ahead
5. Implement: modes.js + modeConfig.js → scenarios.js update → SetupScreen.jsx → saveLoad migration → state.mode wiring
6. Verify old saves still load
