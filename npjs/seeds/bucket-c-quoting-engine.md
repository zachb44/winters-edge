# SEED — Bucket C: The Quoting Engine

> **How to use this seed:** Paste into a fresh chat. First action: read the `npjs/`
> folder in `zachb44/winters-edge` (README, one-page plan, AND the completed
> `npjs/outputs/bucket-a-powerwashing-research.md`). **Do not launch this chat until
> Bucket A is done.** Drop the finished doc in `npjs/outputs/`, the stripped version
> in `npjs/tommy-facing/`, update bucket-d.
>
> **If you cannot read the `npjs/` folder, or it appears incomplete or stale, STOP
> and tell Zach — do not proceed on this seed alone. If `bucket-a-powerwashing-research.md`
> is missing or unreadable, STOP — do not proceed.**

---

## Who you're helping

I'm Zach. My OLDER brother Tommy (Thomas Bellar Jr.) runs NPJS LLC, a handyman
business in Columbia SC, starting with power washing. Strong unregulated ADHD;
obstacle is execution, not knowledge. He trusted his younger brother to help build
this — keep the tone brother-first.

## Why this is the most important build

Quoting is Tommy's #1 NAMED gap and his #1 explicit ask. Twice on our call he said
the biggest non-vehicle blocker was "quoting jobs better." He freezes on curveball
questions live and loses the job — his words: a customer asked something he didn't
expect, "looked like an idiot," and "they're like yeah we're going with somebody
else." He asked specifically for "a skeletal structure... checkpoints I can actually
register and remember." Not a freeform method. A skeleton he can hold in his hand.

Critical detail: he wants to run cheap to win work — around **$60/hr** when good
local contractors charge ~$120/hr. He UNDER-quotes and eats the loss, sometimes
ending up effectively working for ~$20/hr because he didn't factor how long a job
takes. The engine has to protect him from himself.

## Prerequisite — and a quality gate, not just a presence check

This chat MUST have `npjs/outputs/bucket-a-powerwashing-research.md` available — it
holds the power washing pricing (per sq ft, per job type) and the curveball question
list. Build the quoting logic on THAT data.

**Before you build, check the QUALITY of A's pricing, not just that the file exists:**

- A's pricing must be grounded in real **Columbia / Midlands-SC** data (A was required
  to cite 2–3 actual local operators and label "Columbia vs. national" per surface).
- **If A's pricing is missing, OR is generic national averages with no real local
  grounding, OR A flagged that it couldn't find local data — STOP and flag to Zach.
  Do NOT build Tommy's hourly floor on national averages.** The floor is the number
  that protects him from working for $20/hr; building it on the wrong market is the
  one failure this engine cannot ship with.

If A's local pricing is solid, proceed.

## What to build

1. **The quoting skeleton** — a fill-in-the-blank structure, not freeform. Surface
   type → measure → rate → adjustments → number. Something he physically references
   while standing in someone's driveway. Designed for a brain that freezes, so it
   removes as much live thinking as possible.

2. **Pricing logic** — how to go from "this driveway is ~X sq ft" to a defensible
   number, using Bucket A's REAL LOCAL data. Include the simple math, and the floor.

3. **The if-they-ask-X-say-Y bank** — the common power washing curveball questions
   (from Bucket A's list) with ready answers. This is the anti-freeze tool. When the
   customer throws the question that used to kill him, he reads the answer. Cover the
   full list A surfaced — this is the single most important live tool, so don't trim it.

4. **His hourly-floor math** — what $60/hr actually has to cover (his time, the
   chemicals, gas, wear) so he stops accidentally working for $20/hr. Give him the
   "below this number, walk away" line. Built on A's real local rates, not national.

5. **The too-big-for-one-person test** — a quick gut check to recognize the job he
   can't do solo BEFORE he says yes. He raised this fear directly on the call.

## Output

1. **`npjs/outputs/bucket-c-quoting-engine.md`** — the full engine: skeleton +
   curveball bank + pricing logic + floor math.
2. **`npjs/tommy-facing/quoting-skeleton-one-page.md`** — the physically-usable
   version. The thing he prints or pulls up on his phone on a job.

   **Tommy usability bar (this is a pass/fail spec, not just a length cap):**
   Built for a brain that freezes live and won't re-read. Test: Tommy can find any
   single answer in under 5 seconds without reading top-to-bottom. Labels and headers
   he scans, not paragraphs he reads. If he'd have to READ it to use it, it failed.
   One page is the ceiling, but usable-live is the real bar.

Then update bucket-d. Also note: a future quote-CALCULATOR tool (HTML or spreadsheet)
is parked as a Phase 2 build on top of this logic — flag in the output that the logic
should be structured cleanly enough to drop into a calculator later.
