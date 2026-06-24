#!/usr/bin/env python3
# NPJS Tommy-facing teaching docs — styled PDF renderer.
# Renders the three markdown sources (01/02/03) into branded, color-coded PDFs.
# Requires: markdown, playwright (chromium). The NPJS logo (logo_card_dark.png)
# must sit alongside this script; it is embedded as a data URI on each cover.
#
# Usage: place 01_powerwashing_primer.md, 02_business_structure.md,
# 03_quoting_guide.md, and logo_card_dark.png next to this script, then run it.
# Output PDFs land in ./out/.
import markdown, re, html as htmllib
import base64
from playwright.sync_api import sync_playwright

# Encode the dark logo card as a data URI so Chromium loads it inline
with open("logo_card_dark.png","rb") as _f:
    LOGO_URI = "data:image/png;base64," + base64.b64encode(_f.read()).decode()

DOCS = [
    {
        "src": "01_powerwashing_primer.md",
        "out": "NPJS_1_Power_Washing_Primer.pdf",
        "kicker": "DOCUMENT 1 OF 3",
        "title": "So You Want to Run a<br>Power Washing Business",
        "subtitle": "The trade, the work, and what it pays — start here.",
        "accent": "#0f6b6b",      # teal
        "accent2": "#13807d",
        "wash": "#e9f3f2",
    },
    {
        "src": "02_business_structure.md",
        "out": "NPJS_2_How_To_Run_The_Business.pdf",
        "kicker": "DOCUMENT 2 OF 3",
        "title": "How to Run<br>the Business",
        "subtitle": "Leads, winning the job, and getting paid — the whole funnel.",
        "accent": "#1d4e89",      # blue
        "accent2": "#2660a4",
        "wash": "#e9eff6",
    },
    {
        "src": "03_quoting_guide.md",
        "out": "NPJS_3_Quoting_Guide.pdf",
        "kicker": "DOCUMENT 3 OF 3",
        "title": "How to Quote<br>a Job",
        "subtitle": "The five-step tool that makes the money.",
        "accent": "#b5651d",      # warm ochre/rust
        "accent2": "#c8761f",
        "wash": "#f7efe4",
    },
]

def preprocess_lists(text):
    lines = text.split("\n")
    fixed = []
    for i, ln in enumerate(lines):
        fixed.append(ln)
        nxt = lines[i+1] if i+1 < len(lines) else ""
        if ln.strip() and not re.match(r"^\s*([-*+]|\d+\.)\s", ln) and re.match(r"^\s*[-*+]\s", nxt):
            fixed.append("")
    return "\n".join(fixed)

def strip_cites(html):
    # remove any <cite ...>...</cite> wrappers, keep inner text
    html = re.sub(r'</?cite[^>]*>', '', html)
    return html

def md_to_html(text):
    text = preprocess_lists(text)
    h = markdown.markdown(text, extensions=["tables", "sane_lists"])
    return strip_cites(h)

# ---- the funnel SVG for doc 2 ----
FUNNEL_SVG = """
<div class="funnel">
<svg viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">
  <defs></defs>
  <!-- top band -->
  <polygon points="20,30 500,30 430,110 90,110" fill="#2660a4"/>
  <text x="260" y="62" text-anchor="middle" fill="#fff" font-size="19" font-weight="800" font-family="sans-serif">TOP — LEADS</text>
  <text x="260" y="88" text-anchor="middle" fill="#dce8f6" font-size="13" font-family="sans-serif">Get people to know you exist</text>
  <!-- middle band -->
  <polygon points="78,118 442,118 388,198 132,198" fill="#1d4e89"/>
  <text x="260" y="150" text-anchor="middle" fill="#fff" font-size="19" font-weight="800" font-family="sans-serif">MIDDLE — WIN THE JOB</text>
  <text x="260" y="176" text-anchor="middle" fill="#dce8f6" font-size="13" font-family="sans-serif">Turn interest into a booked job</text>
  <!-- bottom band -->
  <polygon points="132,206 388,206 344,282 176,282" fill="#13315c"/>
  <text x="260" y="240" text-anchor="middle" fill="#fff" font-size="18" font-weight="800" font-family="sans-serif">BOTTOM — GET PAID</text>
  <text x="260" y="264" text-anchor="middle" fill="#dce8f6" font-size="12" font-family="sans-serif">Do the work, collect the money</text>
</svg>
</div>
"""

CSS_TMPL = """
@page {{ size: Letter; margin: 0.7in 0.75in; }}
@page :first {{ margin: 0; }}
* {{ box-sizing: border-box; }}
body {{
  font-family: 'Noto Sans','Segoe UI',-apple-system,'DejaVu Sans',sans-serif;
  font-size: 13px; line-height: 1.62; color: #232a31; margin: 0;
  -webkit-font-smoothing: antialiased;
}}

/* ---------- COVER ---------- */
.cover {{
  height: 100vh; padding: 0; margin: 0; position: relative;
  background: {accent}; color: #fff; page-break-after: always;
  display: flex; flex-direction: column;
}}
.cover-logoband {{
  background: #14181c; padding: 40px 50px 38px; text-align: center;
  border-bottom: 5px solid {accent2};
}}
.cover-logoband img {{ width: 420px; max-width: 80%; height: auto; border-radius: 8px; }}
.cover-body {{ padding: 58px 60px 0; flex: 1; }}
.cover-kicker {{
  font-size: 13px; font-weight: 700; letter-spacing: 4px;
  color: rgba(255,255,255,0.82);
}}
.cover-title {{
  font-size: 43px; font-weight: 800; line-height: 1.08; margin: 18px 0 0;
  letter-spacing: -0.5px;
}}
.cover-sub {{
  font-size: 16.5px; font-weight: 400; line-height:1.4; margin-top: 22px;
  color: rgba(255,255,255,0.92); max-width: 82%;
}}
.cover-bottom {{
  padding: 0 60px 56px; font-size: 13px; color: rgba(255,255,255,0.82);
}}
.cover-bottom .rule {{ height:3px; width:60px; background:rgba(255,255,255,0.6); margin-bottom:18px;}}
.cover-bottom strong {{ color:#fff; }}

/* ---------- BODY ---------- */
.content {{ padding: 0; }}
h1 {{ /* section numbers like "1. Why..." */
  font-size: 21px; color: {accent}; font-weight: 800; margin: 30px 0 4px;
  letter-spacing: -0.2px;
}}
h2 {{
  font-size: 19px; color: {accent}; font-weight: 800; margin: 34px 0 12px;
  padding-bottom: 8px; border-bottom: 3px solid {accent}; letter-spacing:-0.2px;
}}
h3 {{
  font-size: 15px; color: {accent2}; font-weight: 800; margin: 20px 0 6px;
}}
p {{ margin: 9px 0; }}
strong {{ color: #14323a; font-weight: 700; }}
a {{ color: {accent}; }}
ul, ol {{ margin: 9px 0; padding-left: 24px; }}
li {{ margin: 6px 0; }}
li::marker {{ color: {accent}; font-weight: 700; }}
hr {{ border: none; border-top: 1px solid #e2e7ea; margin: 22px 0; }}

/* first heading after cover shouldn't have huge top margin */
.content > h1:first-child, .content > h2:first-child {{ margin-top: 8px; }}

/* ---------- TABLES ---------- */
table {{ border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 12.5px; }}
th {{ background: {accent}; color:#fff; text-align:left; padding: 9px 11px; font-weight:700; font-size:12px; }}
td {{ border:1px solid #dfe4e7; padding: 8px 11px; vertical-align: top; }}
tr:nth-child(even) td {{ background: {wash}; }}

/* ---------- BLOCKQUOTE AS CALLOUT ---------- */
blockquote {{
  margin: 16px 0; padding: 14px 18px; background: {wash};
  border-left: 5px solid {accent}; border-radius: 8px; color:#222;
}}
blockquote p {{ margin: 6px 0; }}
blockquote p:first-child {{ margin-top: 0; }}
blockquote p:last-child {{ margin-bottom: 0; }}
blockquote strong {{ color: {accent2}; }}

code {{ background:#eef1f3; padding:1px 5px; border-radius:4px; font-size:0.9em; }}

/* funnel graphic */
.funnel {{ margin: 20px auto; max-width: 480px; }}
.funnel svg {{ width: 100%; height: auto; }}

/* keep section headings from orphaning */
h1, h2, h3 {{ page-break-after: avoid; }}
table, blockquote, .funnel {{ page-break-inside: avoid; }}
img.logo {{ height: 46px; }}
"""

def build_cover(d):
    return f"""
<div class="cover">
  <div class="cover-logoband">
    <img src="{LOGO_URI}" alt="NPJS LLC"/>
  </div>
  <div class="cover-body">
    <div class="cover-kicker">{d['kicker']}</div>
    <div class="cover-title">{d['title']}</div>
    <div class="cover-sub">{d['subtitle']}</div>
  </div>
  <div class="cover-bottom">
    <div class="rule"></div>
    Written for <strong>Tommy</strong>, by your brother.<br>
    Power washing · Columbia, SC
  </div>
</div>
"""

def render(d):
    raw = open(d["src"], encoding="utf-8").read()
    body = md_to_html(raw)
    # inject funnel after the funnel intro paragraph in doc 2
    if d["src"].startswith("02"):
        anchor = "<p>That's it. That's the entire business."
        if anchor in body:
            body = body.replace(anchor, FUNNEL_SVG + anchor, 1)
    css = CSS_TMPL.format(accent=d["accent"], accent2=d["accent2"], wash=d["wash"])
    full = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{css}</style></head>
<body>{build_cover(d)}<div class="content">{body}</div></body></html>"""
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.set_content(full, wait_until="networkidle")
        pg.pdf(path="out/"+d["out"], format="Letter", print_background=True,
               margin={"top":"0","bottom":"0","left":"0","right":"0"},
               prefer_css_page_size=True)
        b.close()
    print("wrote", d["out"])

import os
os.makedirs("out", exist_ok=True)
for d in DOCS:
    render(d)
print("done")
