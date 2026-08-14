# Hosting comparison: GitHub Pages vs Cloudflare (Free plan)

Context: this is a static Astro build (`dist/` is ~900 KB), no server functions, no forms
processing (see `docs/MIGRATION-PLAN.md` §9), on the apex domain `joshlevent.com`, currently
deployed via `.github/workflows/deploy.yml` (GitHub Actions building with `withastro/action`,
publishing to GitHub Pages). This doc evaluates whether Cloudflare's free tier is a better fit.

## 1. The free-tier numbers

| | GitHub Pages | Cloudflare Pages (Free) |
| --- | --- | --- |
| Cost | Free, no paid tier exists | Free, with paid tiers above it |
| Bandwidth | Soft limit ~100 GB/month | Marketed as unlimited, subject to abuse/ToS review |
| Builds | Soft limit 10/hour, but this cap is lifted entirely once you build via a custom GitHub Actions workflow (you already do) | 500 builds/month (~16/day), 1 build at a time, 20-minute build timeout |
| Published site size | 1 GB max | 20,000 files/site, 25 MiB max per file |
| Custom domains | 1 apex + subdomains via CNAME/A records | 100 custom domains per project |
| Serverless/edge functions | None. Static files only | Pages Functions (Workers-based) available on the same free plan |
| CDN | Fastly | Cloudflare's edge network (larger PoP footprint) |
| TLS | Automatic via Let's Encrypt | Automatic, plus optional proxying/WAF/DDoS mitigation |
| Preview deployments | None built in | Unlimited, automatic per-branch |

Sources: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

For a personal site at ~900 KB, both ceilings are irrelevant in practice. You'd need
roughly 100,000 page loads a month before GitHub's soft bandwidth limit even became a
conversation, and it's a soft limit enforced by a polite email, not a hard cutoff. This
comparison isn't decided by the numbers.

## 2. The nuance that matters more than the numbers: Cloudflare Pages is legacy

Cloudflare's own documentation now steers new projects towards **Workers with static
assets**, not Pages. The Pages limits page carries a persistent "Migrate to Workers"
banner, the framework guides for Astro/Next.js/SvelteKit etc. live under `/workers/`, and
Cloudflare publishes a dedicated Pages-to-Workers migration guide. Pages isn't being shut
down and existing projects keep working, but it's not where Cloudflare is investing:
newer capabilities (smarter routing config, Durable Objects bindings, some CI/CD features)
land on Workers first or exclusively.

Practically, this means "Cloudflare Free" for a new static site in 2026 is really two
options, not one:

- **Cloudflare Pages**: the older Git-integration product, closer in spirit to GitHub
  Pages. Fine, but a product Cloudflare is winding down investment in.
- **Workers + static assets**: the current recommended path, using `wrangler.jsonc` with
  an `assets.directory` field and Workers Builds for CI. More setup, more moving parts
  (Wrangler config, a compatibility date to maintain), but the actively developed product.

If you go Cloudflare, go Workers+static-assets, not classic Pages.

## 3. The switching cost that actually matters for this domain

`joshlevent.com` is an apex domain. Cloudflare's free plan only supports apex custom
domains via **full nameserver delegation**: you'd move DNS management for the entire
domain to Cloudflare, not just add a few records at your current registrar. The
Free/Pro-tier "partial (CNAME) setup" that avoids this doesn't cover apex domains.

Compare that to the GitHub Pages path already documented in `docs/MIGRATION-PLAN.md` §6:
four A records, one AAAA set, one CNAME for `www`, added at whatever registrar you use.
No nameserver handoff, and it plugs straight into the DNS you already manage.

So moving to Cloudflare isn't "swap the host," it's "hand over DNS for the whole domain
to a new provider." That's not a bad trade in general (Cloudflare's DNS and dashboard are
good), but it's a materially bigger decision than a hosting swap, and worth separating in
your head from the hosting question itself.

## 4. Where Cloudflare would genuinely help

- **Forms.** `docs/MIGRATION-PLAN.md` §9 already flags that GitHub Pages can't process
  forms and suggests Formspree/Web3Forms. On Workers+static-assets (or Pages Functions)
  you could write a small edge function yourself instead of depending on a third party,
  if you'd rather own that piece.
- **Edge network size and DDoS/WAF.** Cloudflare's network is larger than Fastly's and
  includes free-tier WAF/DDoS mitigation. Irrelevant for a personal site's normal traffic,
  relevant only if you're worried about a targeted attack or a post going unexpectedly
  viral.
- **Preview deployments per branch/PR.** Genuinely convenient for reviewing content
  changes before merging, something GitHub Pages doesn't give you natively (you'd have to
  build it yourself with an Actions matrix or a separate preview branch).

None of these map to a current, stated need for this site.

## 5. Recommendation

Stay on GitHub Pages. The workflow is already built, working, and free with no ceiling
you'll realistically hit. Cloudflare's advantages (bigger edge network, WAF, previews,
optional edge functions) are real but solve problems this site doesn't have, and adopting
them today means either building on a de-emphasised product (Pages) or taking on a second
config system (Workers + Wrangler) for a static site that doesn't need one. The DNS
nameserver handoff required for the apex domain is a real cost that has nothing to do
with the hosting decision itself and shouldn't be paid just to get bandwidth numbers you
don't need.

Revisit this if either becomes true: you add server-side logic (real form handling,
gated content, A/B tests) that static hosting can't do, or traffic grows enough that
Fastly-vs-Cloudflare edge performance becomes measurable rather than theoretical.
