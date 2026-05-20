# Mission B: Animated Day/Night Dial

**Run AFTER Mission A (the D2 bottom HUD) ships.**

Copy this entire block into Claude Code as a single prompt.

---

Replace the current "Day 3/30 — 14:23 ☔️" text with a proper animated day-night dial in the top bar, inspired by the Warcraft 3 world clock.

## What it should look like

A circular dial roughly 60-80px in diameter, placed in the center of the top bar.

- Circle divided into 24 segments (one per in-game hour)
- As time passes, segments fill in clockwise — starting empty at midnight, fully filled by 11:59 PM
- In the center: a sun icon (☀️) during day hours (6 AM – 6 PM) and a moon icon (🌙) during night hours (6 PM – 6 AM)
- During transition hours (5–7 AM and 5–7 PM), the icon fades/morphs between sun and moon

## Visual style

- Filled segments are a warm amber color during the day, shifting to a cool blue during the night
- Empty segments are dark slate
- Subtle glow around the active icon (warm glow on sun, cool glow on moon)
- The whole dial pulses gently — slow breathing effect

## Surrounding text

Next to the dial:
- "Day 3 / 30" — current day, larger text
- "14:23" — current time, smaller text below
- Weather indicator (snow / blizzard / clear) — small icon

## Implementation notes

- Use inline SVG for the dial. SVG is cleaner for circular segments.
- The dial re-renders every tick (every 100ms in the game loop) — use efficient rendering (memoize if needed).
- Position it in the top center of the top bar, replacing the existing time/day text block.

## Constraints

- Don't break any existing game state. Time and day mechanics work identically — this is purely visual.
- Should work on both desktop and tablet-sized screens.

Commit message: `feat: animated day/night dial in top bar`
