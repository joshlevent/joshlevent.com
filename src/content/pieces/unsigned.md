---
title: Unsigned
order: 1
year: "2026"
description: "A walk through a building whose signs thin out room by room until there are none."
launch:
  href: "/projects/unsigned/live/"
  label: "Start the walk"
thumbnail:
  src: "/images/projects/unsigned/street.jpg"
  alt: "A street front saturated with signs, screens and posters"
gallery:
  - src: "/images/projects/unsigned/atrium.jpg"
    alt: "The entrance hall of the building, with wayfinding, screens and barriers"
  - src: "/images/projects/unsigned/cave.jpg"
    alt: "The cave at the end of the walk, lit by a single shaft of light, with no signs at all"
---

Unsigned is a building you walk through in your browser. It begins on a street where every surface carries a message: shop signs, screens, posters, arrows, warnings, the phone in your hand. Inside, the building takes you through six stages, and at each one there is a little less to read. By the last room there is nothing: a cave, rock and water and a shaft of light. The way out is a dark passage back to the street.

The piece grew out of a question about symbol density. We spend our days in environments that are almost completely covered in signs addressed to us, and we have stopped noticing. What would it be like to leave that behind gradually, rather than all at once? Not a retreat to nature, but an architecture that sheds its signage floor by floor, so that you can feel the weight of it coming off.

## Walking it

You walk it yourself: W or the up arrow to walk, the mouse to look, Shift to hurry, C to sit down on a bench, E to use things. It takes about five minutes with sound on. A phone appears in your hand on the street and buzzes with notifications; its battery runs down as you go deeper, and it goes quiet before the end.

It runs best in Chrome on a laptop or desktop. There is no loading screen beyond the first few seconds because the whole building is generated in the browser: every sign, texture and room is built procedurally when the page opens, so no two walks are pixel-identical.

## Making of

Built with three.js. The building is laid out by a turtle walk over a list of room specifications, so the route and the rooms are generated together; signs are composed from typographic templates and placed by density rules per stage; the textures are software noise rather than image files; and the cave is a displaced sphere with its floor and mouths carved and smoothed. The whole thing is a single HTML file and a copy of three.js.
