# Design Decisions

Why we made specific calls. Captures the *reasoning* behind choices, not just the result.

When you (or future Claude) wonders "why did we do it this way?", the answer should be here.

---

## Genre + perspective

### Single survivor, not colony

**Decision:** Player controls one character, not a group/colony.

**Why:** The "personal stakes" of one life makes cold and hunger feel real. Colony-style (like RimWorld) is more strategic but less immersive. For our scope and audience, single-survivor lands harder.

**Alternative considered:** Group of survivors RTS-style. Rejected for v1 — could be revisited if multiplayer is added (each player controls one of multiple survivors).

### Top-down 2D over 3D

**Decision:** Top-down 2D tile-based.

**Why:** Realistic to ship in months, not years. Doesn't require an engine swap. Can still feel atmospheric with good lighting/effects.

**Alternative considered:** 3/4 perspective like Stardew. Possible later as visual upgrade without re-architecture.

**Alternative considered:** 3D over-the-shoulder like Valheim. Effectively starting over. Aspirational only.

### Point-and-click RTS-style, not WASD character

**Decision:** Click tiles to move/interact.

**Why:** Honors the original RTS instinct. Scales to multi-unit if we add helpers/companions. ADHD-friendly UX (everything's visible). Easier to nail in artifact-first development.

---

## World + map

### Permanent fog reveal (vs. line-of-sight refresh)

**Decision:** Once you've seen a tile, it stays remembered (dimmed). Animals only visible in current vision radius.

**Why:** Vision-only fog (D2 / NetHack style) can feel unfair — wolves appear out of nowhere. Permanent reveal keeps map navigation rewarding without feeling cheap. Animals still vanishing into fog preserves tension.

### Territorial bear at the cave (vs. wandering bear)

**Decision:** Bear lives near the cave and chases within 5 tiles. Returns home if you leave.

**Why:** Gives the cave zone real character — "don't go there yet." Rewards late-game players who come back with a rifle. Wandering bear felt arbitrary; territorial bear creates a known landmark.

### Random crash sites (5 fixed locations)

**Decision:** Plane crashes at one of 5 plausible locations randomly each run.

**Why:** Replay variety without unfair starts. Pure random would sometimes drop you into the bear's lap. Hand-curated sites guarantee playable starts but each plays differently.

---

## Time + pacing

### ~5 minutes per in-game day at 1x speed

**Decision:** Slow time scale (0.04 time units per 100ms tick). Full 30-day run is ~2.5 hours at 1x.

**Why:** Survival games need breathing room to plan, gather, build, manage warmth. Initial pacing of 60 seconds/day was demo-friendly but didn't feel survival-y. 2x and 3x speeds exist for stretches of waiting.

### Safe first night

**Decision:** Wolf/bear attack damage suppressed from 18:00 day 1 to 06:00 day 2. Animals still path toward player but don't deal damage.

**Why:** Without this, new players die in their first 5 minutes and quit. The "visual scare" still happens (a wolf still walks at you), but the player gets to learn the game. Day 2 onward, full danger.

### Early game pacing bonus

**Decision:** Days 1-3 give bonus wood per chop, slower warmth drain, more rabbits.

**Why:** Ramps difficulty. New players need a window to get their footing. Veterans speed past it quickly.

---

## Combat + leveling

### Auto-attack combat, not click-per-swing

**Decision:** Click target, swings happen automatically on attack-speed timer.

**Why:** Click-spam isn't fun. Auto-attack means combat is *tactical* — choose your target, position, when to disengage — rather than mechanical input. Same swing engine powers harvesting trees/rocks.

### Per-creature attack speeds

**Decision:** Each creature has its own attack speed. Wolves bite fast (1000ms), bears slow but devastating (1700ms).

**Why:** Creates creature *personality*. A wolf feels different to fight than a bear. Encourages weapon/strategy variety per enemy type.

### Character level separate from skill levels

**Decision:** Skills (Foraging, Hunting, Crafting) level on their own. Character Level is a separate XP track.

**Why:** Cleaner mental model. Skills progress through use. Character progression is more general and gives chosen stat upgrades. Two systems, different dopamine loops.

### 4 stat upgrade options (not generic stat points)

**Decision:** Each level grants 1 point to spend on: Vitality (HP), Insulation (Warmth), Endurance (Hunger+Stamina), Power (combat damage).

**Why:** Limited choice = meaningful choice. More options would dilute identity. Power compounds for "combat build" players; Insulation for "long survival" players. Different builds for different runs.

---

## UI + UX

### Hidden inventory (vs. always-visible)

**Decision:** Resources show in top bar, full inventory opens with `I`.

**Why:** Compromise between WC3-style (everything visible) and D2-style (everything hidden). Resources need glance-ability for planning. Detailed inventory only matters when you're deciding to use something.

### Tile tooltips on hover

**Decision:** Hovering interactive tiles shows tooltip with action hint.

**Why:** Onboarding for new players. Veterans can ignore them; new players learn the game without a tutorial. Especially important for finite-loot cabins/wreckage where the "X uses left" matters.

### Level Up button in top bar (not floating)

**Decision:** Level Up notification lives in the top bar between character info and day/time. Restyled to match other top-bar buttons.

**Why:** Original floating-overlay version felt like an out-of-place pop-up. Top bar placement makes it feel native to the UI. Gold pulse keeps it eye-catching without being aggressive.

---

## Architecture

### Pure functions for game logic

**Decision:** Combat, leveling, progression logic in `logic/` and `data/` files — no React imports, just functions that transform state.

**Why:** Future-proofs against engine swap. If we move to Phaser or Unity later, the math/rules port directly. UI is just rendering. Also makes the logic unit-testable.

### Sparse tileHp map

**Decision:** Tile HP only tracked for tiles that have been struck. Stored as `{ "x,y": hp }`.

**Why:** Avoids tracking HP for 2,700 map tiles when only 3-4 are being chopped at any time. Performance + simplicity.

### Single swing engine for combat + harvest

**Decision:** Combat target and harvest target share one swing timer (`player.lastAttackMs`).

**Why:** No duplicated timing code. Same lunge animation. Same stamina drain. Future "active abilities" can plug into the same system. Architectural consistency.

---

## Multiplayer (deferred)

### Not building multiplayer in Winter's Edge

**Decision:** Stay single-player for the main game.

**Why:** Multiplayer is a different engineering project (server, sync, anti-cheat). Adding it to Winter's Edge would derail the goal of shipping a finished single-player game. Co-op + werewolf modes live in a future separate project (Blood Moon).

### Supabase will be the eventual backend

**Decision:** When multiplayer happens, Supabase is the choice.

**Why:** Real-time sync is built-in. Auth is handled. Already authorized on Zach's account. No need to build a custom server.

---

## What we explicitly chose NOT to do

- **Sickness/injury system** — Deferred. Could add later but introduces bookkeeping. Game is tense enough without it.
- **Procedural item stats** (Borderlands-style "+15% rare hatchet") — Adds UI complexity for low gameplay payoff. Stick with fixed item bonuses.
- **TypeScript migration** — Premature on a fast-iterating prototype. Maybe later when architecture stabilizes.
- **Save games between sessions for real (cross-device)** — Local localStorage is fine for solo. Cross-device save needs accounts + backend.
- **Achievements / leaderboards** — Premature. Once the game is shippable and fun, then.
- **Mobile support** — Game runs in browser, so technically yes, but UI isn't optimized. Defer to post-v1.
