# NPJS — Post-Review Fix Directions (CMD → Fix Chat)

> **For the fix chat:** Read the `npjs/` folder in `zachb44/winters-edge` first —
> README, one-page plan, the three outputs in `npjs/outputs/`, both Tommy-facing
> one-pagers in `npjs/tommy-facing/`, and the task tracker `npjs/seeds/bucket-d-misc-tasks.md`.
> Then apply the fixes below. These come AFTER a full review; the review found no
> pricing or factual failures. Don't re-litigate the build — just apply these fixes.
> Show Zach the changes before committing each one; do not commit silently.

---

## Context: what triggered these fixes

A review chat read the whole build. It surfaced four things. Zach has since made a
judgment call that reframes the most important one. Apply in this order.

---

## FIX 1 — Decouple the money system from the Sunday call (most important)

**The problem:** Bucket B's Rev 2, trying to make the tax mechanic ADHD-proof, welded
it to a weekly "Sunday call" between Zach and Tommy — "the tax cut happens weekly on
the Sunday call with Zach prompting it live." Rev 2 then loaded the stuck-job sweep
onto the same call. This turned a casual brother-to-brother check-in into a
business-critical operational hub, and created a single point of failure: if the call
doesn't happen, taxes stop and stuck jobs stop getting caught.

**Zach's correction (do this):** The Sunday call is JUST a phone call to his brother.
A warm, 10-minute, brother-to-brother update — the three light questions from the
one-page plan (how many jobs, cash number, what's stuck). Nothing operational rides
on it. It is relational, not a system component. The moment it becomes "must happen or
the business breaks," it stops being warm and becomes a chore — which, given how both
brothers are wired, makes it LESS likely to happen, not more.

**So the real fix is in Bucket B, not on the call:**
- **Pull the tax set-aside OFF the call.** Tie it to the MONEY, not to a conversation.
  The tax cut should happen as a function of cash moving — when field cash gets emptied
  into its home (envelope or account), the tax portion comes off THEN, tied to that
  physical money-handling moment, not to whether a phone call happened on a given Sunday.
  Keep it a single can't-fail motion (the Rev 2 instinct of "one motion, not three at
  the truck" was right — preserve that, just don't anchor it to the call).
- **Pull the stuck-job sweep off the call's critical path too.** If noticing a stuck job
  depends on the call, a skipped call means stuck jobs rot. Tie "is anything stuck?" to
  the physical job-card surface Tommy already looks at, so it's visible whether or not
  the brothers talk.
- **The system must survive a week where the call doesn't happen.** That's the test.
  Nothing financial or operational should break if a given Sunday gets missed.

**Then update the docs to match:**
- In Bucket B output AND the operating-basics one-pager: reframe the Sunday call as the
  relational check-in it is. Remove its operational load. The tax and stuck-job mechanics
  now live on the money/card surfaces, not the call.
- In `bucket-d-misc-tasks.md`: KILL the task "Put the recurring Sunday call in Zach's own
  push system" (it's no longer load-bearing — it was a fix for a problem we're removing).
  At most, downgrade to a soft "text/call Tommy on Sundays-ish, brother stuff." Remove the
  "new single point of failure" framing from the D notes, since this fix removes that SPOF.

---

## FIX 2 — Split the quoting one-pager (it fails its own 5-second test)

**The problem:** `tommy-facing/quoting-skeleton-one-page.md` is ~4,858 chars (~2x the
operating one-pager), carrying 6 modules including a 16-row "if they ask X" table. On the
#1 freeze question ("how much?"), Tommy hits a 16-row table — the exact under-pressure
scanning that makes him freeze. The page is trying to be both a carry-in-hand tool AND a
complete reference. Two different jobs.

**The fix — split into two artifacts:**
1. **The glance card** (`tommy-facing/quoting-skeleton-one-page.md`, rebuilt) — what Tommy
   has IN HAND / on the visor during a live quote. Only:
   - the 5-step skeleton
   - the rates (the phone-quotable surfaces only — driveways, standard house washes)
   - the floor line (one line: below ~$50/hr door-to-door = re-quote or walk)
   - the BIG THREE answers only — price / damage / insured — restored to their own clear
     hierarchy (Bucket C's full doc built these "first and tightest"; the one-pager
     flattened them into the uniform table — un-flatten them).
   This is scan-not-read. If it's longer than the operating one-pager, it failed.
2. **The reference sheet** (`tommy-facing/quoting-reference-sheet.md`, new) — what Tommy
   reads AT HOME to get familiar, never on a job. Holds:
   - the full 16-row if-they-ask bank
   - the too-big-for-one-person test
   - the full floor math
   - the in-person-only surfaces (decks/fences/pool decks — quote in person, not by phone)

The freeze happens live, under pressure. The live tool cannot contain the thing that
causes the freeze (the 16-row table). That's the whole point of the split.

---

## FIX 3 — Tighten net/gross language (fold into Fix 2 pass)

There's a seam between the $60/hr "target" (reads like gross) and the $50/hr "floor"
(explicitly net). Tommy could miss the net/gross distinction and think $60 is take-home.
Wherever both numbers appear (Bucket C output + the new glance card), make it unmistakable:
$60/hr is the target on the meter; ~$50/hr NET (after chemicals/gas/wear, real
door-to-door time) is the walk-away floor. Plain words, no jargon.

---

## FIX 4 — Note the local-pricing spot check (no rewrite, just a flag)

Bucket A's local rates were trusted, not independently verified. Before Tommy quotes off
them, Zach will do a 5-min spot check on 803powerwash.com's $395 minimum and the
$0.22/$0.24 siding split, since those anchor the whole floor. This is Zach's task, not the
fix chat's — just add a one-line OPEN item to `bucket-d-misc-tasks.md` so it's captured:
"Spot-check 803powerwash $395 min + siding split before Tommy quotes off these — Zach."

---

## Deliverables summary

1. Bucket B output + operating one-pager: tax & stuck-job mechanics decoupled from the
   Sunday call; call reframed as relational.
2. `bucket-d-misc-tasks.md`: Sunday-call-in-push-system task killed/downgraded; SPOF
   framing removed; spot-check task added.
3. Quoting one-pager split into glance card (rebuilt) + reference sheet (new).
4. Net/gross language tightened wherever both numbers appear.

Show Zach each change before committing. Standard pattern: verdict before rewrite already
happened (this review) — now apply, but still surface the diffs.

*Compiled by CMD chat, Jun 24 2026.*
