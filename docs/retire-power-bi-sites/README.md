# Retiring the two Power BI GitHub Pages sites

For each repository (Power-BI-Model-Architectures, Power-BI-Examples): delete everything except CNAME and LICENSE,
copy the matching folder here into the repository root, add `.nojekyll`, commit and push. GitHub Pages then serves
plain redirect pages at the old URLs. Keep for a few months, then archive the repository and remove the CNAME DNS record.

The Jekyll URL layout used `/architectures/<name>/` and `/examples/<name>/`; check the live sitemap before replacing,
and add any paths that differ.
