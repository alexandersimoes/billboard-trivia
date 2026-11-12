# Genre scene prompts

Image-generation prompts for each genre's background. Every genre needs two images:

- **Ground**: the street scene pinned to the bottom of the screen, on a transparent background. The site repeats its middle section to fill any screen width, so the middle has to work like wallpaper.
- **Sky**: a full-screen image behind everything, showing through above and between the buildings.

Done so far: Pop (ground), and Streaming, Spotify, Global, Rock, Alternative, Country, R&B, Rap and Dance (ground + sky). Pop still needs its sky; that prompt is at the end.

Streaming and R&B swapped looks: the riverside scene made from the R&B prompts below is now Streaming (`velvet` palette, `public/scenes/streaming/`), and the original neon rooftop Streaming scene is now R&B (`neon` palette, `public/scenes/rnb/`). Remaining: Latin.

## How to use

1. **Ground first.** Attach that genre's card from the concept board, plus one finished ground (for example `public/scenes/spotify/left.webp`, or the full Spotify ground PNG) as the layout and style reference. Paste the ground prompt.
2. **Then the sky.** Attach the finished ground image and the concept card. Paste the sky prompt.
3. Each prompt is self-contained, so copy it from "Create..." to the end of its section.
4. If something comes back wrong, use the follow-ups at the bottom.
5. Hand the images to Claude, or process them yourself (see "After generating").

| Genre | Theme in `globals.css` | Folder |
|---|---|---|
| Global | `harbor` | `public/scenes/global/` |
| Rock | `garage` | `public/scenes/rock/` |
| Alternative | `rain` | `public/scenes/alternative/` |
| Country | `prairie` | `public/scenes/country/` |
| R&B (used for Streaming, see above) | `velvet` | `public/scenes/streaming/` |
| Rap | `brownstone` | `public/scenes/rap/` |
| Dance | `disco` | `public/scenes/dance/` |
| Latin | `plaza` | `public/scenes/latin/` |

---

## Global

### Ground

Create a wide landscape banner for the bottom of a website background: the "Global" scene from the attached concept card, a glittering river city at blue hour. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no semi-transparent haze floating above the skyline.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (bridge parapet, waterline, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 26% of the width: a grand domed civic building on the riverbank. It has a teal-green copper dome with a small lantern cupola, a glowing amber colonnade of tall arched windows, and a stone balustrade, and it is cut off by the left side of the frame. The top of the dome is the tallest point in the image.

2. Middle, from 26% to 80% of the width. This section must be repeatable, like wallpaper:
- A long stone arch bridge crossing the full middle, with identical round arches and one pier exactly every 12% of the image width.
- On top of every pier, an identical iron lamp post with a warm amber globe. The bridge parapet is one level line.
- Behind the bridge, a band of navy-blue towers with similar heights and small amber windows. No tower, spire or landmark stands out.
- Below the bridge, calm river water showing through each arch, with evenly spaced vertical amber and blue reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a slim needle-shaped observation tower with a rounded pod near the top, plus two or three modern glass towers, cut off by the right side of the frame. The needle tower may rise above the rest of the skyline.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the dome and the needle tower.

Colours: deep navy #0a2f5c and #12395b, city blue #1f5fa8, lit blue highlights #50a0f0, copper-dome teal #2f7a72, stone blue-grey #6d86a8, warm lamps and windows #ffc857.

No sky, clouds, sun, moon, stars, text, signs with words, logos, border or vignette.

### Sky

Create the blue-hour sky that goes behind the attached "Global" city scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain, calm and clean. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep blue #082f6b at the top, through #0d4f9c and #1377ca, to bright blue #44a2e8 at the bottom edge.

In the sky:
- A large soft bank of rounded cumulus clouds on the right half, in lighter blue #3d8fd9 with pale #8cc4f2 sunlit tops and slightly darker undersides.
- A few long thin cloud streaks drifting across the middle.
- Three or four tiny faint cream stars in the top 15%.

Composition rules:
- The bottom 40% is calm, with only the gradient and a very faint pale haze (#6fb3ec) along the bottom edge. A skyline covers this area, and the sky only shows through the gaps.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No sun, moon, buildings, skyline, ground, water, birds, planes, people, text, border or vignette.

---

## Rock

### Ground

Create a wide landscape banner for the bottom of a website background: the "Rock" scene from the attached concept card, an old industrial district at night. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no smoke or haze floating above the skyline. Lamp light falls in crisp-edged cones.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (wall top, railing, kerb, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 28% of the width: the corner of an old brick warehouse in dark plum-brown brick. Its big multi-pane factory windows glow red-orange. It has two black gooseneck wall lamps, a zig-zag iron fire escape and a wooden water tower on stilts on its roof, and it is cut off by the left side of the frame. The water tower is the tallest point in the image. Red and coral tropical leaves grow at the base.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A long low brick wall with identical square brick pillars, exactly one every 12% of the image width. Each pillar has a small caged amber bulb on top, and a simple black iron railing runs along the wall top.
- Behind the wall, a band of low dark-purple industrial buildings of similar height, with sawtooth roofs, short chimneys and small amber and red-orange windows. No tall tower or landmark.
- Across the bottom, wet asphalt with evenly spaced vertical red-orange and amber reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a rusted steel water tank on a tall lattice frame, and a clump of red and coral tropical leaves running off the right side of the frame. The tank may rise above the rest of the skyline.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the two water towers.

Colours: plum night #2c2030, aubergine #43203a, brick #5a2e33, steel #3a2a40, red-orange window glow #ff5a36, ember red #f05050, amber bulbs #ffb347.

No sky, clouds, smoke, moon, stars, text, signs with words, logos, border or vignette.

### Sky

Create the stormy night sky that goes behind the attached "Rock" industrial scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: near-black plum #1d132b at the top, through #361b3d and #55275d, to dusky purple #6a2f63 at the bottom edge.

In the sky:
- Big billowing storm clouds massed over the right half, in plum #5a2a55 with magenta-lit edges (#a24a7e) and darker undersides.
- One thin winding wisp of smoke curling diagonally across the upper middle, in muted mauve #7a3a6e.
- No stars.

Composition rules:
- The bottom 40% is calm, with only the gradient and a faint red-orange city underglow (#8a3a4a) rising from the bottom edge. Buildings cover this area, and the sky only shows through the gaps.
- Keep the top-left and top-centre quieter than the right, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, sun, lightning, buildings, skyline, ground, birds, people, text, border or vignette.

---

## Alternative

### Ground

Create a wide landscape banner for the bottom of a website background: the "Alternative" scene from the attached concept card, an overgrown city park at night with fireflies. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no haze floating above the skyline. Fireflies are small solid amber dots, not glows.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (wall top, path edge, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 26% of the width: a thick old tree trunk with a leafy canopy whose crown reaches only a little above the skyline, cut off by the left side of the frame. Giant tropical leaves in yellow-green and teal grow at its base. The tree crown is the tallest point on the left.

2. Middle, from 26% to 80% of the width. This section must be repeatable, like wallpaper:
- A low mossy stone wall with identical square stone pillars, exactly one every 12% of the image width, each with a small round stone cap.
- Between each pair of pillars, an identical clump of ferns and leafy bushes.
- Behind the wall, a teal skyline band of apartment blocks with similar heights and small amber windows. No tower or landmark.
- Tiny solid amber firefly dots scattered evenly across the bushes.
- Across the bottom, a dark damp garden path with soft evenly spaced amber reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a cluster of three tall, slender, dark cypress trees, the tallest point on the right, with big yellow-green leaves at their base running off the right side of the frame.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the left tree crown and the cypress tops.

Colours: deep teal #0e4a5c, teal #127978, sea green #229992, skyline teal #1f6f6f, dark foliage #0b3a3a, bright leaves #c8d84a and #8fbf3a, amber windows and fireflies #ffb347.

No sky, clouds, moon, stars, swirls, text, signs with words, logos, border or vignette.

### Sky

Create the dreamy night sky that goes behind the attached "Alternative" park scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep teal #0b3f4f at the top, through #127978 and #229992, to pale sea green #5ccec0 at the bottom edge.

In the sky:
- A full round cream moon (#f6eccd) in the upper right, at about 80% across and 15% down, with a small soft halo.
- Flowing, swirling wind ribbons in the style of a painted starry night, in lighter teal (#4fb0a0 to #7ad0c0), sweeping across the upper middle. They are semi-transparent and low-contrast.
- A few tiny cream stars.

Composition rules:
- The bottom 40% is calm, with only the gradient. The skyline covers this area, and the sky only shows through the gaps.
- Keep the top-left and top-centre quiet, with the swirls lighter there, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No sun, buildings, trees, skyline, ground, fireflies, birds, people, text, border or vignette.

---

## Country

### Ground

Create a wide landscape banner for the bottom of a website background: the "Country" scene from the attached concept card, golden farmland at sunset. There is no city in this one. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no dust or haze floating above the hills.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm sunset light, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (fence rails, road, hill base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 28% of the width: a big autumn tree with a thick dark trunk and an orange-gold canopy whose crown reaches only a little above the hills. Beside it is a weathered red-brown wooden barn with a gambrel roof, one warm glowing window and a couple of round hay bales, cut off by the left side of the frame. The tree crown is the tallest point in the image.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A weathered wooden post-and-rail fence with identical posts, exactly one every 12% of the image width, and two level horizontal rails.
- Tall golden wheat grass in front of and behind the fence, even in height and density.
- Behind it, a band of soft rolling hills in dusty orange-brown with a gentle, regular, low undulation, plus a distant row of small round trees of equal size. No barn, silo or landmark.
- Across the very bottom, a straight gravel country road running horizontally with a faint dashed centre line.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a tall farm windmill (a lattice steel tower with a round bladed wheel and tail vane) and tall grass running off the right side of the frame. The windmill may rise above the hills.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the tree crown and the windmill.

Colours: burnt sienna #7a3f14, rust #c2621c, amber #e8a33a, gold #f4c55a, wheat #ffb33a, hill browns #a8653a and #8a4e2a, dark wood #4a2a14, barn red-brown #8a3a22, warm window #ffd27a.

No sky, sun, clouds, birds, text, signs with words, logos, border or vignette.

### Sky

Create the sunset sky that goes behind the attached "Country" farmland scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain, warm and calm. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep brown-red #5a2a12 at the top, through #a8522a, #d27938 and #f2913e, to golden #feac4a at the bottom edge.

In the sky:
- A large glowing pale-yellow sun (#ffe08a) low on the right, at about 62% across. Its lower half sits in the bottom 30% of the image, where the hills will cover it as if it is setting behind them, with a soft warm halo.
- Long layered sunset clouds across the middle and right, in peach #f6b26b with golden rims (#ffd27a) and rust undersides (#c2621c).

Composition rules:
- Apart from the sun, the bottom 40% is calm, with only the warm gradient. The hills cover this area.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, stars, birds, trees, hills, ground, buildings, people, text, border or vignette.

---

## R&B

### Ground

Create a wide landscape banner for the bottom of a website background: the "R&B" scene from the attached concept card, a romantic riverside promenade at night. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no haze floating above the skyline.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (railing, promenade edge, waterline, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 28% of the width: a dark violet brownstone townhouse with tall arched windows glowing amber, a wrought-iron balcony and lush magenta-pink flowering bushes at its base, cut off by the left side of the frame. An ornate iron street lamp with a warm glowing lantern stands at the right edge of this zone. The townhouse roof is the tallest point in the image.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A riverside wrought-iron railing with identical posts with round finials, exactly one every 12% of the image width.
- Between each pair of posts, an identical round magenta flowering bush.
- Behind the railing, a band of violet skyline with similar heights and small warm windows. No tower or landmark.
- Across the bottom, a calm river along the promenade with evenly spaced vertical amber and magenta reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a large flowering tree with magenta blossoms and dark violet leaves running off the right side of the frame, with one small lit cottage window peeking through.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the townhouse roof and the lamp top.

Colours: deep plum #40154a, purple #5e2173, violet #8c3098, skyline violet #4a2a6e, magenta flowers #ff4fb4 and #c850c8, warm lamp and windows #f0c850, coral accents #ff9e8a.

No sky, clouds, moon, stars, overhanging branches, text, signs with words, logos, border or vignette.

### Sky

Create the night sky that goes behind the attached "R&B" riverside scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain, soft and romantic. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep plum #2a0f38 at the top, through #5e2173 and #8c3098, to soft violet #9e3daa at the bottom edge.

In the sky:
- Soft rounded clouds in lighter violet (#a24fb8) with pale lavender rims (#d9a6e6) drifting across the middle band.
- A cluster of dark purple leaf silhouettes (#2a0f38, with a few magenta #c850c8 leaves) hanging into the top-right corner from the edge, covering no more than the top 15% and right 25%.
- A few tiny faint stars in the top 20%.

Composition rules:
- The bottom 40% is calm, with only the gradient. The skyline covers this area.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, sun, buildings, skyline, ground, water, birds, people, text, border or vignette.

---

## Rap

### Ground

Create a wide landscape banner for the bottom of a website background: the "Rap" scene from the attached concept card, a city block under an elevated train line at night. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no smog or haze floating above the skyline. Lamp light falls in crisp-edged cones.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm and teal lights, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (train deck, kerb, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 26% of the width: a corner brick tenement building with iron fire escapes, a few warm-lit windows and a corner shop awning glowing teal (no lettering), cut off by the left side of the frame. Its roofline is the tallest point in the image.

2. Middle, from 26% to 80% of the width. This section must be repeatable, like wallpaper:
- An elevated railway viaduct running straight across the middle, with identical riveted steel columns exactly one every 12% of the image width, and a deep steel girder deck with a simple railing on top as one level line.
- Under the deck, centred between every pair of columns, an identical hanging lamp glowing teal-white.
- Under the viaduct, a concrete wall covered with abstract, colourful graffiti shapes (bubbly forms and splashes in teal, orange and cream, absolutely no letters or words), evenly patterned along the wall.
- Above and behind the deck, a band of brown and rust skyline with similar heights and small amber and teal windows. No tower or landmark.
- Across the bottom, wet asphalt with evenly spaced vertical teal and amber reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a brick rooftop with a wooden water tank on stilts, and a leafy tree silhouette running off the right side of the frame. The water tank may rise above the rest of the skyline.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the tenement roof and the water tank.

Colours: espresso #3d2318, umber #5e3224, rust #7b4531, steel #2a1c18, teal lamps #45d0c6, graffiti teal #3fc9b5, orange #f08a3c and cream #f3e2c4, amber windows #f2a65a.

No sky, smog, clouds, moon, stars, text, letters, signs with words, logos, border or vignette.

### Sky

Create the smoggy evening sky that goes behind the attached "Rap" city scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain, moody and warm. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: dark espresso #2a1712 at the top, through #5e3224 and #7b4531, to hazy amber-rust #a0582d at the bottom edge.

In the sky:
- Long flat layers of smoggy cloud drifting horizontally, in darker brown bands (#4a2a1e) with dusty orange undersides (#b5683a). They are low-contrast and mostly in the upper and middle bands.
- A small cluster of dark leaf silhouettes (#2a1712) hanging into the top-right corner from the edge, covering no more than the top 12% and right 20%.
- No stars, because the smog hides them.

Composition rules:
- The bottom 40% is calm, with only the gradient and a faint warm city glow rising from the bottom edge. The skyline covers this area.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, sun, buildings, trains, skyline, ground, birds, people, text, border or vignette.

---

## Dance

### Ground

Create a wide landscape banner for the bottom of a website background: the "Dance" scene from the attached concept card, a palm-lined waterfront nightclub strip. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe, glow halo or bloom around outlines, and no light beams or haze above the skyline. Neon stays tight on the surfaces it lights.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (boardwalk railing, waterline, skyline base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 28% of the width: a curved art-deco nightclub with a rounded corner, horizontal bands of neon yellow-green tubing, tall glowing amber windows and a flat roof with a small deco fin, cut off by the left side of the frame. Two tall palm trees rise beside it, and their crowns are the tallest point in the image.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A waterfront boardwalk railing with identical short lamp posts, exactly one every 12% of the image width, each with a warm yellow globe.
- An identical small palm tree, all the same height, centred between every pair of lamp posts.
- Behind it, a band of violet skyline with similar heights and small yellow windows. No tower or landmark.
- Across the bottom, calm bay water with evenly spaced vertical yellow and magenta reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a cluster of tall palm trees and the rounded corner of a smaller deco building with a neon band, running off the right side of the frame. The palm crowns may rise above the skyline.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the palm crowns.

Colours: indigo #2c1b70, violet #4d22a3, purple #6b2dc1, magenta #c04fd8, neon yellow-green #e8f45a, warm lamps and windows #ffd166, palm silhouettes #1a0f40.

No sky, searchlights, beams, clouds, moon, stars, text, signs with words, logos, border or vignette.

### Sky

Create the party-night sky that goes behind the attached "Dance" waterfront scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep indigo #1d0f55 at the top, through #3b1987 and #4d22a3, to bright violet #8c36da at the bottom edge.

In the sky:
- Three or four straight searchlight beams fanning upward from below the bottom-right edge, as if from a club behind the skyline. They are pale lavender (#c9a8ff), semi-transparent, with crisp straight edges, and fade toward the top.
- A few thin streaky clouds in lighter violet (#6b3ad0).
- Some tiny faint stars in the top 20%.

Composition rules:
- Apart from where the beams start, the bottom 40% is calm, with only the gradient. The skyline covers this area.
- The beams angle up and to the left but stay out of the top-left corner, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, sun, buildings, palms, skyline, ground, water, birds, people, text, border or vignette.

---

## Latin

### Ground

Create a wide landscape banner for the bottom of a website background: the "Latin" scene from the attached concept card, a colonial plaza at sunset with bougainvillea. Match the layout of the other attached ground image. A separate sky layer will sit behind it.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no haze floating above the rooftops.

Style: flat cel-shaded illustration, clean dark ink outlines, flat colour shapes with soft gradients, subtle paper grain, warm glowing windows, matching the attached concept card. Flat, straight-on side view with no perspective. All horizontal lines (balustrade, plaza edge, rooftop base) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth like the attached concept card, never flat silhouettes. Build it in three layers. The foreground (the end landmarks, the fence or railing, plants) has the darkest, richest colours and the crispest linework. The midground buildings are fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes, so it reads as far away. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges, balconies, awnings and window sills, and warm light spilling from lamps and windows onto nearby walls, plants and pavement. Use three or four related colours across the buildings instead of one flat colour, so neighbouring buildings read as separate and overlapping. Add texture and small details where they fit: brick or stone courses, window frames and mullions, sills, awnings, drainpipes, fire escapes, rooftop water tanks, vents, chimneys and antennas. Vary the windows: most warm and lit, some dim, a few dark, a few with curtains or silhouettes. Depth comes from layering, overlap, shading and colour, not from perspective lines, and everything stays fully opaque, with no haze.

The image has three zones:

1. Left end, the left 28% of the width: the corner of a Spanish-colonial building in warm stucco and carved stone. It has a tall arched doorway glowing amber inside, stone steps, an iron wall lantern and a wrought-iron balcony overflowing with magenta bougainvillea, and it is cut off by the left side of the frame. The building's roof is the tallest point in the image.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- The edge of a plaza: a low stone balustrade with identical square stone pillars, exactly one every 12% of the image width, each topped with an identical terracotta pot of magenta bougainvillea.
- Between the pillars, identical turned stone balusters.
- Behind it, a band of low stucco houses with terracotta tile roofs, similar heights and small warm windows. No church, tower or dome.
- Across the bottom, a warm terracotta-tiled plaza floor with evenly spaced soft amber and pink reflections.
- No unique objects in the middle: no one-off landmark such as a windmill, gazebo, dome, tower, statue or fountain, not even as a small decoration. Detail and variety are welcome; standout features belong in the end zones.

3. Right end, the right 20% of the width: a church bell tower with a small dome, and a tall palm tree, running off the right side of the frame. The bell tower may rise above the rooftops.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the building roof, the bell tower and the palm crown.

Colours: wine #4a0f2a, magenta #8a1846, rose #c00d4c, bougainvillea pink #e8306e, coral #ff6a4d, gold lantern #ffd23f, terracotta #c2532f, stucco #e0956a with shadows #9c4a3a.

No sky, sun, clouds, moon, stars, text, signs with words, logos, border or vignette.

### Sky

Create the sunset sky that goes behind the attached "Latin" plaza scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, flat colour shapes with soft gradients, subtle paper grain, warm and festive. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep wine #3a0d24 at the top, through #8a1846, #b02b57 and #e04a5a, to sunset coral #ff7a5a at the bottom edge.

In the sky:
- Soft rounded sunset clouds in rose #d8486a with peach tops (#ffb08a) and wine undersides (#7a1a3e), drifting across the middle band.
- Dark palm frond silhouettes (#3a0d24) hanging into the top-right corner from the edge, covering no more than the top 15% and right 25%.

Composition rules:
- The bottom 40% is calm, with only the warm gradient. The rooftops cover this area.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No sun, moon, stars, buildings, rooftops, ground, birds, people, text, border or vignette.

---

## Pop (sky only, still to do)

Attach the finished Pop ground (`Pop Street City Garden Banner.png`) and the Pop card.

Create the sunset sky that goes behind the attached "Pop" street scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached image exactly. Flat cel-shaded illustration, clean confident ink outlines, flat colour shapes with soft gradients, subtle paper grain. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: deep crimson #be3438 at the top, through warm red #dd4a47 and coral #f76658, to soft peach #fd937b at the bottom edge.

In the sky:
- A large pale cream sun (#fae2b9) low on the right, at about 70% across. Its bottom third sits in the bottom 30% of the image, where the skyline will cover it, with a soft warm peach halo.
- A few long layered stylised clouds drifting horizontally, with coral #f76658 bodies, peach #fd937b and cream #fae2b9 sunlit undersides, and crimson #a83034 shadow bands on top.
- A small loose flock of dark birds in the upper right.
- A handful of faint cream pinpoint stars just appearing in the top 15%.

Composition rules:
- Apart from the sun, the bottom 40% is calm, with only the gradient. The skyline covers this area.
- Keep the top-left and top-centre quiet, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, buildings, horizon line, ground, text, border or vignette.

---

## Follow-ups

Send these as a second message when something comes back wrong.

- **Fake transparency (a drawn grey checkerboard):** "The background is a drawn checkerboard, not transparent. Replace everything above the buildings with one plain flat colour, [the genre's darkest sky colour], with nothing else in it." The cut-out script removes a flat sky cleanly too.
- **Uneven middle:** "The posts in the middle are unevenly spaced. Make them identical and exactly evenly spaced, with the same bush or object between each pair."
- **Something unique in the middle:** "Move the [tall tower / lamp / tree] out of the middle into the right end. The middle should only contain the repeating pattern."
- **Crooked lines:** "Make the railing, kerb and skyline base perfectly level and straight from the left edge to the right edge."
- **Busy sky:** "Make the clouds fainter and lower-contrast, and keep the top-left corner and the bottom 40% plain."
- **Flat-looking buildings:** "Add more depth and detail to the buildings, like the attached concept card: a lit front face and a shadowed side, cast shadows under ledges and cornices, three or four different building colours, brick and window detail, and a lighter, cooler background skyline behind a darker, richer foreground."
- **Glow or haze in the ground:** "Remove the glow above the skyline. Light should stay crisp on the surfaces it hits."

## After generating

Give the images to Claude, or run the scripts yourself:

```
node scripts/scene_slices.mjs <ground.png> <genre> --left <x> --right <x> --hard <y0:y1> --preview 3000
```

- `--left` and `--right` are the x positions of the centres of two posts in the middle (pick the second post from the left and the second from the right).
- `--hard` is the row range from the top of the posts to their base.
- Check `public/scenes/<genre>/slices-preview.png`, then delete it.
- The script prints the CSS variables to add to that theme in `app/globals.css`.

For the sky image, convert it to WebP at quality 90 and save it as `public/scenes/<genre>/sky.webp` and add `url("/scenes/<genre>/sky.webp")` in front of the theme's gradient in the `.sky` rule.
