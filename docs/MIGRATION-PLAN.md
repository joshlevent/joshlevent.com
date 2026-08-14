# Migration plan: Squarespace → GitHub Pages

This document explains how the new site is built, why those choices were made, how to
extend it, and the exact steps to take it live on `joshlevent.com` without losing search
ranking or breaking inbound links.

## 1. Stack choice and rationale

**Chosen stack: [Astro](https://astro.build) (static output) deployed to GitHub Pages via GitHub Actions.**

The brief asked for the best way to re-create the Squarespace styling with a clean redesign,
while staying easy to extend. Astro is the strongest fit:

- **Content-first.** Astro's content collections turn a folder of Markdown files into a
  typed, validated content set. Each piece of content is one `.md` file with a small
  frontmatter block. That is the closest thing to the Squarespace editing experience without
  the lock-in, and it scales cleanly as sections grow.
- **Total control over styling.** Unlike a Squarespace theme, every pixel is yours. The
  redesign lives in a handful of `.astro` components and one CSS file of design tokens, so
  re-creating or evolving the look is a case of editing variables, not fighting a theme.
- **Near-zero JavaScript.** Astro ships static HTML by default, so the site is fast and
  cheap to host, which suits a personal brand site and is ideal for GitHub Pages.
- **First-class GitHub Pages support.** The official `withastro/action` builds and deploys
  on every push with no extra configuration.

Alternatives considered and why they lost:

| Option | Verdict |
| --- | --- |
| **Jekyll** | GitHub Pages' native generator (no Actions needed), but Ruby-based, slower local dev, and Liquid templating is clumsy for arbitrary sections. Fine for a pure blog, weaker for a multi-section portfolio. |
| **Hugo** | Extremely fast, but its templating is less pleasant than Astro components and the content model is more rigid for mixed page types. |
| **Plain HTML/CSS** | Maximum control, but you would hand-maintain shared layouts and the blog index by hand. Poor on the "easy to extend" requirement. |

GitHub Pages does run Jekyll natively, but using a GitHub Actions build (as configured here)
lets you use any generator and is the modern, supported path.

## 2. Repository structure

```
Personal Website/
├── astro.config.mjs          Site URL, redirects (old → new), sitemap
├── package.json              Scripts and dependencies
├── public/
│   ├── CNAME                 Custom domain (joshlevent.com)
│   └── images/               Semantically organised, self-hosted images
├── docs/
│   └── archive/              Squarespace image provenance (not used at runtime)
├── src/
│   ├── content.config.ts     Content collection schemas (the "shape" of your content)
│   ├── content/              ← ALL YOUR CONTENT LIVES HERE
│   │   ├── pages/            Standalone pages (bio, teaching, research, now, ...)
│   │   ├── writing/          Blog posts
│   │   ├── talks/            Talks
│   │   ├── projects/         Business Design case studies
│   │   └── coaching/         Coaching offers
│   ├── components/           Header, Footer
│   ├── layouts/              BaseLayout (HTML shell + SEO), PageLayout
│   ├── pages/                Routes (URL structure)
│   └── styles/global.css     Design tokens + base styles
└── docs/                     This plan + the sitemap
```

The rule of thumb: **content goes in `src/content/`, look-and-feel goes in
`src/styles/global.css` and `src/components/`, URL structure goes in `src/pages/`.**

## 3. How to extend it

Adding content never requires touching code.

**Publish a blog post.** Create `src/content/writing/my-post.md`:

```markdown
---
title: My New Post
date: 2026-07-01
description: One-line summary used in listings and meta tags.
---

Body in Markdown.
```

It appears automatically on `/writing`, at `/writing/my-post`, and in the RSS feed.
Set `draft: true` to keep it out of the build.

**Add a talk, project or coaching offer.** Drop a `.md` file in `src/content/talks/`,
`src/content/projects/` or `src/content/coaching/`. Use `order:` to position it in the
list. Talks accept a `youtube:` ID to embed the video.

**Add a standalone page** (for example `/speaking`). Create
`src/content/pages/speaking.md` with `title` and `nav` frontmatter. It is served at
`/speaking` by the catch-all route. Add it to the menu in `src/components/Header.astro`.

**Add a whole new section** (for example a Photography gallery with its own index):
1. Add a collection to `src/content.config.ts`.
2. Create `src/pages/photography/index.astro` (the list) and `[slug].astro` (the detail),
   copying the Talks pages as a template.
3. Add the section to the navigation.

**Restyle the site.** Edit the CSS variables at the top of `src/styles/global.css`
(colours, fonts, spacing). Everything inherits from there.

## 4. Local development

Requires Node 22.12 or newer (Astro 7 requirement).

```bash
npm install         # once
npm run dev         # http://localhost:4321 with live reload
npm run build       # production build into dist/
npm run preview     # serve the built site locally
```

## 5. Deployment to GitHub Pages

A workflow is already committed at `.github/workflows/deploy.yml`. It builds with the
official Astro action and publishes on every push to `main`.

One-time setup:
1. Create a GitHub repository (for example `joshlevent/joshlevent.com`) and push this folder
   to the `main` branch.
2. In the repo, go to **Settings → Pages → Build and deployment** and set **Source** to
   **GitHub Actions**.
3. Push any commit. The Actions tab shows the build; when it is green the site is live on
   the temporary `*.github.io` URL.

From then on, every `git push` redeploys automatically.

## 6. Custom domain and DNS

`public/CNAME` already pins the site to `joshlevent.com`, so GitHub serves it on the apex
domain. To point the domain at GitHub Pages, update DNS at your registrar:

- Four **A** records for the apex `@` → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`.
- One **AAAA** set (optional, IPv6) → `2606:50c0:8000::153`, `2606:50c0:8001::153`,
  `2606:50c0:8002::153`, `2606:50c0:8003::153`.
- One **CNAME** for `www` → `joshlevent.github.io`.

Then in **Settings → Pages**, enter `joshlevent.com` as the custom domain and tick
**Enforce HTTPS** once the certificate is issued (can take up to an hour).

Plan the cutover so DNS only changes after the GitHub build is verified on the temporary
URL. Squarespace currently manages this domain, so you will either move the domain's
nameservers/records at the current registrar or transfer the domain out of Squarespace
first. Keep Squarespace live until the new site is confirmed working, then switch DNS.

## 7. Redirects and SEO

Reorganising the site moves 22 URLs. Every move is captured in the `redirects` map in
`astro.config.mjs`, which emits a redirect page for each old path (see `SITEMAP.md` for the
full table). This preserves inbound links and lets search engines follow the move.

After go-live: submit the new `https://joshlevent.com/sitemap-index.xml` in Google Search
Console (and Bing Webmaster Tools) so the new structure is re-indexed quickly.

### Blog URLs

The plan shortens blog URLs from `/writing/2023/4/6/swiss-income-tax-for-high-earners` to
`/writing/swiss-income-tax-for-high-earners` (cleaner, and decouples the URL from the date).
The old paths redirect, so nothing breaks. If you would prefer to keep the exact dated URLs
and avoid even those redirects, rename each file in `src/content/writing/` to include the
date path and adjust the `[slug]` route. Recommendation: take the clean URLs, they are nicer
and the redirects cost nothing.

## 8. Images

The legacy Squarespace images are now ordinary, self-hosted site assets beneath
`public/images/`. Their directories and filenames describe their current content roles;
Squarespace URL hashes are no longer part of the live paths.

Heroes, thumbnails and ordered galleries are declared explicitly in content frontmatter.
Contextual article images stay in Markdown, while the two homepage logo groups are curated
in `src/data/home-logos.ts`. The live site has no crawler or generated image manifest.

## 9. Forms

The Squarespace Contact, Consulting, Research, Teaching and "For Therapists" pages used
Squarespace's built-in form blocks. GitHub Pages is static and cannot process forms, so the
new Contact page lists direct email and social links instead. If you want working forms,
wire them to a free static-friendly service such as **Formspree**, **Web3Forms** or
**Netlify Forms**: each gives you an endpoint you point a plain HTML `<form>` at. A short
form component can then be reused on any page.

## 10. Phased checklist

**Phase 1 — Review (local)**
- [ ] `npm install` then `npm run dev`, click through every page.
- [ ] Tune `src/styles/global.css` (fonts/colours) to taste.
- [x] Localise and semantically organise the legacy images.
- [x] Declare the Visual Art / EOMO / GTFU gallery order in content.

**Phase 2 — Stand up the repo**
- [ ] Push to a new GitHub repo on `main`.
- [ ] Set Pages source to GitHub Actions; confirm a green build.
- [ ] Verify the site on the temporary `*.github.io` URL.

**Phase 3 — Go live**
- [ ] Decide on forms (email-only, or wire up Formspree/Web3Forms).
- [ ] Point DNS at GitHub Pages; set custom domain; enforce HTTPS.
- [ ] Spot-check 5–6 old URLs (for example `/eomo`, `/ted-talk-2013`) redirect correctly.
- [ ] Submit the sitemap to Google Search Console.

**Phase 4 — Decommission**
- [ ] Confirm all images are self-hosted (`rg "squarespace-cdn|/images/squarespace" src`).
- [ ] Monitor for a week, then cancel Squarespace.

## 11. Rollback

Until you cancel Squarespace and change DNS, the old site stays fully live, so rollback is
simply "don't change DNS yet". After cutover, reverting DNS to Squarespace restores the old
site within the TTL window. Keep the Squarespace subscription for one billing cycle after
go-live as insurance.

---

*Note: a `dist/` folder may appear in this directory from a local build. It is the generated
output, is listed in `.gitignore`, and is safe to delete.*
