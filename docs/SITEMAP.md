# Sitemap — joshlevent.com

A full inventory of the current Squarespace site and the new GitHub Pages structure.
37 content pages were found and captured (16 in the XML sitemap, plus 21 collection
sub-pages that Squarespace did not list but were linked from Coaching, Talks and Business Design).

## New information architecture

The redesign keeps the original three-group navigation (Work / About / Creative Output)
and groups the orphaned sub-pages under their parent section.

```
/                                     Home
│
├── Work
│   ├── /coaching                     Coaching (overview + cards)
│   │   ├── /coaching/entrepreneurship-trainer
│   │   ├── /coaching/for-therapists
│   │   ├── /coaching/tedx-coaching
│   │   └── /coaching/general-coaching
│   ├── /teaching
│   ├── /research
│   └── /consulting
│
├── About
│   ├── /bio
│   ├── /awards-press
│   ├── /contact
│   └── /now
│
├── Creative Output
│   ├── /podcast
│   ├── /talks                        Talks (overview + cards)
│   │   ├── /talks/ted-talk-2016
│   │   ├── /talks/the-red-pill
│   │   ├── /talks/ted-talk-2013
│   │   └── /talks/stories-define-our-lives
│   ├── /art                          Visual Art
│   ├── /writing                      Blog index
│   │   └── /writing/<slug>           9 posts (see table)
│   └── /business-design              Portfolio (overview + cards)
│       ├── /business-design/eomo
│       ├── /business-design/made-in-italy-designed-in-india
│       ├── /business-design/gtfu
│       ├── /business-design/muutu
│       └── /business-design/data-center-automation
│
├── /how-to-prepare-for-a-ted-talk    Resource (linked from TEDx coaching)
├── /404                              Custom "Fail Whale" page
├── /sitemap-index.xml                Auto-generated
└── /writing/rss.xml                  Auto-generated blog feed
```

## URL change map (for 301 redirects)

Every moved URL has a redirect defined in `astro.config.mjs`, so old inbound links and
search-engine results keep working. Pages not listed below keep their exact current URL.

### Pages that keep their URL (no redirect needed)

`/`, `/coaching`, `/teaching`, `/research`, `/consulting`, `/bio`, `/awards-press`,
`/contact`, `/now`, `/podcast`, `/talks`, `/art`, `/writing`, `/business-design`,
`/how-to-prepare-for-a-ted-talk`.

### Pages that moved

| Old URL (Squarespace) | New URL | Reason |
| --- | --- | --- |
| `/home` | `/` | Home lives at the root |
| `/ted-talk-2016` | `/talks/ted-talk-2016` | Grouped under Talks |
| `/the-red-pill` | `/talks/the-red-pill` | Grouped under Talks |
| `/ted-talk-2013` | `/talks/ted-talk-2013` | Grouped under Talks |
| `/stories-define-our-lives` | `/talks/stories-define-our-lives` | Grouped under Talks |
| `/eomo` | `/business-design/eomo` | Grouped under Business Design |
| `/made-in-italy-designed-in-india` | `/business-design/made-in-italy-designed-in-india` | Grouped under Business Design |
| `/gtfu` | `/business-design/gtfu` | Grouped under Business Design |
| `/muutu` | `/business-design/muutu` | Grouped under Business Design |
| `/cassarius` | `/business-design/data-center-automation` | Grouped + readable slug |
| `/entrepreneurship-trainer` | `/coaching/entrepreneurship-trainer` | Grouped under Coaching |
| `/for-therapists` | `/coaching/for-therapists` | Grouped under Coaching |
| `/tedx-coaching` | `/coaching/tedx-coaching` | Grouped under Coaching |
| `/general-coaching` | `/coaching/general-coaching` | Grouped under Coaching |

### Blog posts (date segments dropped)

| Old URL | New URL |
| --- | --- |
| `/writing/2023/4/6/swiss-income-tax-for-high-earners` | `/writing/swiss-income-tax-for-high-earners` |
| `/writing/2023/3/17/party-in-the-land-of-babel` | `/writing/party-in-the-land-of-babel` |
| `/writing/2021/07/04/we-need-bold-new-ideas-for-the-great-reset` | `/writing/we-need-bold-new-ideas-for-the-great-reset` |
| `/writing/2019/9/21/no-self-worth-required` | `/writing/no-self-worth-required` |
| `/writing/2019/9/5/choose-discomfort` | `/writing/choose-discomfort` |
| `/writing/2018/8/4/a-memory-from-2006` | `/writing/a-memory-from-2006` |
| `/writing/2018/8/4/self-acceptance` | `/writing/self-acceptance` |
| `/writing/2016/4/26/what-is-business-design` | `/writing/what-is-business-design` |

If you would rather keep the exact dated blog URLs (zero redirects), see the note in
`MIGRATION-PLAN.md` under "Blog URLs".

## Content captured per page

All 37 pages were converted to Markdown and live in `src/content/`. Image references that
Squarespace served from a JavaScript gallery (the Visual Art page, the EOMO and GTFU slide
decks) could not be extracted as direct files and are flagged inline for re-upload. See
`MIGRATION-PLAN.md` under "Images".
