---
title: Standortdossier
order: 2
year: "2026"
description: "A location report on any Swiss residential address, built from public registers and federal geodata in a quarter of an hour."
status: "Demo coming"
thumbnail:
  src: "/images/projects/standortdossier/plan.png"
  alt: "Parcel map with the addressed parcel highlighted and neighbouring parcels' possible building envelopes hatched"
hero:
  src: "/images/projects/standortdossier/plan.png"
  alt: "Parcel map with the addressed parcel highlighted and neighbouring parcels' possible building envelopes hatched"
gallery:
  - src: "/images/projects/standortdossier/horizon.png"
    alt: "Sun paths on 21 June, 21 March and 21 December against the real horizon of the address, showing where terrain and buildings block the winter sun"
---

A buyer enters a Swiss address. A quarter of an hour later they have a PDF dossier on that location: everything that can be established from public registers and federal geodata, without a single document from the seller.

The idea is that the first look at a property should not depend on what the seller chooses to show. Switzerland publishes an unusual amount of open data about every parcel: the building register, the cadastre of public-law restrictions, noise maps, hazard maps, zoning plans, the national surface model, tax rates by commune, building applications in the cantonal gazettes. Almost none of it is used by buyers, because it sits in twenty different places and speaks twenty different dialects of bureaucracy.

## What the dossier finds

Two outputs carry it, and both are things a buyer cannot work out for themselves:

- **Shading and direct sun, as built today.** Computed from the national surface model: when the sun actually reaches the house on the 21st of December, March and June, given the real horizon of terrain and neighbouring buildings. The image above shows the result for an address in Grindelwald, where the mountains take the winter sun entirely.
- **What the neighbours could build.** An empirical massing envelope: what comparable parcels in the same zone of the same commune have actually been built to, applied as a plausible future mass next door, and the resulting loss of light. The plan at the top shows this for an address in Liebefeld, with the possible envelopes hatched in red.

Around those two sit the supporting findings: noise against the legal limits for living rooms, natural hazards, contaminated sites, the heating system and its replacement obligations, the tax burden for a reference household compared with neighbouring communes, pending building applications nearby, distances to stations, shops, schools and childcare, and a list of questions to put to the seller and things to check on site.

## How it is built

Python, PostGIS and Typst. The address is resolved to its parcel and building through the federal registers (EGRID and EGID); every module then queries the relevant cantonal or federal service live, writes its findings into one fact set, and the report renders from that. Coverage of the neighbour-development analysis depends on which cantons publish open cadastral and zoning data; the dossier says so where a section is unavailable rather than guessing.

A demo with pre-built dossiers for a handful of showcase addresses will appear here.
