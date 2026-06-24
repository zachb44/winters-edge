# NPJS LLC — Business Build Workspace

Tommy's handyman business (No Problems Just Solutions). This folder is the
single source of truth so any fresh chat can rehydrate full context by reading
it. Lives inside winters-edge for now; will move to its own repo later.

**Note: this repo is currently PUBLIC. Keep account numbers, SSNs, and anything
truly sensitive OUT of these files.**

---

## Who this is for

Tommy (Thomas Bellar Jr.) — Zach's OLDER brother. Unregulated ADHD. His obstacle
is execution and consistency, NOT knowledge or work ethic. He has trusted Zach
(younger brother, operator background) to help quarterback the business, which
takes real humility. The tone across everything here stays brother-first.

Foundation-first rule governs everything: ONE service line (power washing) before
anything else. Small enough to actually do beats comprehensive every time.

## How this folder works

```
npjs/
├── README.md                         ← you are here
├── NPJS_One_Page_Plan.md             ← the plan everything serves
├── seeds/                            ← launch prompts for individual build/research chats
│   ├── bucket-a-powerwashing-research.md
│   ├── bucket-b-operating-foundation.md
│   ├── bucket-c-quoting-engine.md
│   └── bucket-d-misc-tasks.md
├── outputs/                          ← finished docs each chat produces (land here)
└── tommy-facing/                     ← stripped one-pagers Tommy actually sees
```

## The workflow

1. **Seeds drafted** (here) → steelman → revise
2. **Each seed deployed to its own chat.** That chat reads this repo for context,
   does its work, drops its finished doc in `outputs/`, updates the task list in
   bucket-d.
3. **A→C quality gate (do not skip):** Before launching Bucket C, Zach (or a fresh
   review chat) confirms Bucket A's pricing is REAL LOCAL Columbia/Midlands data —
   not generic national averages. "A returned a file" is not the trigger to fire C;
   "A's pricing is locally grounded" is. C builds Tommy's protective hourly floor on
   A's numbers, so bad pricing here becomes a bad floor that costs Tommy money. If A's
   pricing is thin or national, fix A before C launches.
4. **Fresh review chat** reads the outputs before anything goes to Tommy.
5. **Tommy-facing versions** get stripped down and placed in `tommy-facing/`.

## The buckets

- **A — Power Washing Research** (research chat). Pricing, supplies, technique-safety,
  quoting inputs. ONE service deep. Feeds C. Pricing must be real local Columbia data,
  not national averages. *Launch now.*
- **B — Business Operating Foundation** (build chat). Day-in-the-life, money movement,
  job lifecycle, ADHD-proof tracking. Modeled on Zach's real systems, stripped hard
  against explicit pass/fail tests. *Launch now, parallel to A.*
- **C — Quoting Engine** (build chat). The skeleton + if-they-ask-X-say-Y bank +
  pricing logic. His #1 gap. *Launch AFTER A returns AND passes the A→C quality gate —
  needs A's real local pricing or it invents/national-izes numbers.*
- **D — Misc / Task Tracker** (running list). LLC via Uncle Ron, liability insurance,
  truck financing, business banking, network inventory. The homeless-but-real tasks.

## Downstream / parked ideas

- **Quote calculator tool** (HTML or spreadsheet) built on C's logic. Phase 2.
  Fill in surface + sq ft → outputs a number + floor check. Attacks the live-freeze
  problem by removing live math.

## Current state

- One-page plan: drafted
- Seeds: steelmanned + revised (Jun 24 2026), pending deployment
- Nothing deployed to build chats yet
- Repo: piggybacking on public winters-edge until a private npjs repo is stood up

*Last updated: Jun 24 2026*
