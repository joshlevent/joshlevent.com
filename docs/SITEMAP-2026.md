# Sitemap, October 2026 restructure

Supersedes the migration-era structure in SITEMAP.md. Navigation is now Current / Past / About:
"Current" is what Josh works on now, "Past" is work that is finished or occasional, "About" is the person.

```
/                                     Home (features: Macroeconomic Outlook, Standortdossier, Unsigned)
│
├── Current
│   ├── /economics                    Research interests, Master thesis (PDF in /files), Macroeconomic Outlook card
│   ├── /power-bi                     Bootcamp, YouTube playlists, architectures, examples
│   │   ├── /power-bi/architectures   Three architectures on one page (PNG + PDF in /images and /files)
│   │   └── /power-bi/examples/<slug> Worked examples with DAX / Power Query code and a .pbix
│   └── /projects                     Card index (Outlook external, pieces, Power BI, Business Design)
│       ├── /projects/<slug>          One page per piece (src/content/pieces)
│       └── /projects/unsigned/live/  The Unsigned walk itself: a raw static page in public/, not Astro
│
├── Past
│   ├── /teaching                     HKB, MDBA, HSLU, viscom, conference facilitation
│   ├── /podcast
│   ├── /talks, /talks/<slug>
│   ├── /consulting                   Experience page, no CTA
│   ├── /coaching                     One experience page, no CTA (the four offer pages are gone)
│   └── /business-design, /business-design/<slug>
│
└── About
    ├── /bio
    ├── /writing, /writing/<slug>, /writing/rss.xml
    ├── /art
    ├── /awards-press
    ├── /now
    └── /contact
```

## Redirects added in astro.config.mjs

| Old | New |
|---|---|
| /research | /economics |
| /coaching/entrepreneurship-trainer, /coaching/tedx-coaching, /coaching/for-therapists, /coaching/general-coaching | /coaching |
| /entrepreneurship-trainer, /tedx-coaching, /for-therapists, /general-coaching (Squarespace-era) | /coaching (previously chained through /coaching/*) |

## Retired external sites

power-bi-architectures.joshlevent.com and power-bi-examples.joshlevent.com are folded into /power-bi.
Their repositories (Power-BI-Model-Architectures, Power-BI-Examples) should be replaced by a single
redirect page each (see docs/retire-power-bi-sites/), kept for a few months, then archived and the
DNS CNAME records removed.

## Where things live

- Power BI page text and playlists: `src/data/power-bi.ts`
- Examples: `src/content/examples/*.md`, files in `public/files/power-bi/examples/`
- Pieces (Projects): `src/content/pieces/*.md`, images in `public/images/projects/<slug>/`
- Unsigned walk: `public/projects/unsigned/live/` (index.html + vendored three.js 0.170.0). Replace the whole folder to update.
- Thesis: `public/files/josh-levent-msc-thesis-2026.pdf`
