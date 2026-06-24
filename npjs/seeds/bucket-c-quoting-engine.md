# SEED — Bucket C: The Quoting Engine

> **How to use this seed:** Paste into a fresh chat. First action: read the `npjs/`
> folder in `zachb44/winters-edge` (README, one-page plan, AND the completed
> `npjs/outputs/bucket-a-powerwashing-research.md`). **Do not launch this chat until
> Bucket A is done** — without A's pricing data this chat will invent numbers, which
> is the one thing it must never do. Drop the finished doc in `npjs/outputs/`, the
> stripped version in `npjs/tommy-facing/`, update bucket-d.

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

## Prerequisite

This chat MUST have `npjs/outputs/bucket-a-powerwashing-research.md` available — it
holds the real power washing pricing (per sq ft, per job type) and the curveball
question list. Build the quoting logic on THAT data. If it's not in the repo yet,
stop and tell me; don't fabricate pricing.

## What to build

1. **The quoting skeleton** — a fill-in-the-blank structure, not freeform. Surface
   type → measure → rate → adjustments → number. Something he physically references
   while standing in someone's driveway. Designed for a brain that freezes, so it
   removes as much live thinking as possible.

2. **Pricing logic** — how to go from "this driveway is ~X sq ft" to a defensible
   number, using Bucket A's data. Include the simple math, and the floor.

3. **The if-they-ask-X-say-Y bank** — the common power washing curveball questions
   (from Bucket A's list) with ready answers. This is the anti-freeze tool. When the
   customer throws the question that used to kill him, he reads the answer.

4. **His hourly-floor math** — what $60/hr actually has to cover (his time, the
   chemicals, gas, wear) so he stops accidentally working for $20/hr. Give him the
   "below this number, walk away" line.

5. **The too-big-for-one-person test** — a quick gut check to recognize the job he
   can't do solo BEFORE he says yes. He raised this fear directly on the call.

## Output

1. **`npjs/outputs/bucket-c-quoting-engine.md`** — the full engine: skeleton +
   curveball bank + pricing logic + floor math.
2. **`npjs/tommy-facing/quoting-skeleton-one-page.md`** — the physically-usable
   version. The thing he prints or pulls up on his phone on a job. Minimal, scannable,
   built to be used live, not read once.

Then update bucket-d. Also note: a future quote-CALCULATOR tool (HTML or spreadsheet)
is parked as a Phase 2 build on top of this logic — flag in the output that the logic
should be structured cleanly enough to drop into a calculator later.
