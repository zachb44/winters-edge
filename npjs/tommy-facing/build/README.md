# Build — Tommy-facing teaching PDFs

This folder holds the reproducible build for the three NPJS teaching documents
(`../01_powerwashing_primer.md`, `../02_business_structure.md`,
`../03_quoting_guide.md`).

## Files
- `render_styled.py` — converts the three markdown sources into branded,
  color-coded PDFs (teal / blue / ochre), with the logo cover band, the funnel
  graphic in doc 2, callout boxes, and styled tables.

## The logo asset (not committed)
The script expects `logo_card_dark.png` to sit alongside it at build time. That
file is the clean NPJS chrome wordmark on its native black, cropped from the
**print-ready business card front** (the watermark-free GotPrint print file).

It is intentionally **not** committed here:
- it's a binary brand asset, not source, and
- it lives with Zach's card files already.

To rebuild: drop `logo_card_dark.png` next to `render_styled.py`, ensure
`markdown` and `playwright` (chromium) are installed, and run the script.
Output PDFs land in `./out/`.

## Why the PDFs aren't committed
The PDFs are build *outputs*, regenerated from the markdown any time. Committing
them would bloat repo history with large binaries on every edit. The markdown
sources + this script are the source of truth.

## Provenance of the content
- Pricing, materials, chemistry, technique: `../../outputs/bucket-a-powerwashing-research.md`
- Day-in-the-life, house-wash sequence, customer acquisition: fresh web research (June 2026)
- Voice and structure: brother-to-brother, teaching-first
