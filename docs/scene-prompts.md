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

Classic Rock Hall of Fame version. Attach the three reference images (Led Zeppelin Hermit, Grateful Dead Golden Road, KISS poster) with the ground prompt so the model takes their drawing style and symbols from them.

### Ground

Create a wide landscape banner for the bottom of a website background: the "Rock" scene, a street outside a legendary rock club at night, full of loving homages to the great classic rock bands. Match the layout of the other attached ground image. The attached Led Zeppelin, Grateful Dead and KISS artworks are references for the symbols and the poster style only. Do not copy them exactly. A separate sky layer will sit behind this image.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe or glow halo around outlines, and no smoke or haze floating above the skyline. Lamp light falls in crisp-edged cones.

Style: flat cel-shaded illustration with clean dark ink outlines, flat colour shapes with soft gradients and subtle paper grain, like a screen-printed gig poster. Flat, straight-on side view with no perspective. All horizontal lines (wall top, poster rows, kerb) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth, never flat silhouettes. Build it in three layers. The foreground (end landmarks, lamp posts, pavement) has the darkest, richest colours and the crispest linework. The midground (the poster wall and buildings) is fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges and awnings, and warm light spilling from lamps and windows onto the walls and pavement. Use three or four related colours across the buildings so neighbouring buildings read as separate. Add texture where it fits: brick courses, window frames, drainpipes, fire escapes, rooftop water tanks, vents and antennas. Vary the windows: most warm and lit, some dim, a few dark. Everything stays fully opaque, with no haze.

The homage idea: a passer-by should be able to spot the great rock acts from their famous visual signatures, drawn as stylised poster art. Show faces only as graphic, illustrated poster art in the flat style of the attached KISS poster, recognisable through the iconic costume, make-up, hair and props. Do not draw photographic or realistic portraits of real people. There is no text, lettering or band names anywhere, so the symbols must do the work.

The image has three zones:

1. Left end, the left 28% of the width: the corner of the legendary club, a tall dark brick venue with a glowing marquee made only of round bulbs (no letters), an iron fire escape and a rooftop water tank. A giant painted mural covers its side wall: a face with a red and blue lightning bolt across it and a bright orange feathered haircut (the Bowie look). Beside the door, a gig poster in the style of the attached KISS poster shows four face-painted rockers with lightning bolts and stars. By the entrance stands a tall street lamp topped with the attached Led Zeppelin hermit: a hooded, bearded old man in a robe, leaning on his staff and holding up a glowing lantern. The hermit's lantern is the tallest point in the image.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A long low brick wall covered in pasted gig posters, divided by identical stone pillars, exactly one every 13% of the image width. Each pillar carries a short lamp post topped with a small glowing lantern, a simple echo of the hermit's lantern.
- Between each pair of pillars the posters repeat in the same order. Poster one: a red tongue sticking out of big red lips (the Rolling Stones look). Poster two: a winged emblem with a star (the Aerosmith look). Poster three: a curly-haired man in dark sunglasses with a harmonica on a neck rack (the Dylan look). Poster four: a woman with round rose-tinted glasses, long hair and beads (the Janis Joplin look). Poster five: a red asterisk (the Red Hot Chili Peppers look). Poster six: a skull in a circle with a lightning bolt through it, ringed by roses (the Grateful Dead look). Add a few smaller stickers: a prism splitting light into a rainbow, a bullseye target roundel, a crowned crest, a lightning bolt, and a dancing bear.
- Above the wall, a band of low dark brick buildings with small lit windows, rooftop antennas and a few hanging neon guitar-shaped signs with no text. No tall tower or landmark.
- Across the bottom, a street of golden cobblestones like the yellow road in the attached Grateful Dead artwork, with evenly spaced vertical amber and red-orange reflections.
- No unique objects in the middle: no one-off landmark such as a bus, tower, statue, fountain or stage, not even as a small decoration. Detail and variety are welcome, but the same arrangement repeats in each bay. Standout features belong in the end zones.

3. Right end, the right 20% of the width: a painted psychedelic VW camper van parked at the kerb, with swirling purple and magenta patterns, a drum kit tied to its roof and a small number plate. A tree beside it has a few tiny dancing bears (in green, blue and gold) climbing its branches, and sunflowers and a red rose grow at its base. A tall pole carries a faded poster of a spread-winged guitar-shaped silhouette. The scene runs off the right side of the frame.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent, except the hermit's lamp.

Colours: plum night #2c2030, aubergine #43203a, brick #5a2e33, steel #3a2a40, red-orange glow #ff5a36, ember red #f05050, amber bulbs #ffb347, plus small accents of gold #f4c542, teal #2fb8a8 and violet #8a4fc8 in the posters, the bus and the bears.

No sky, clouds, smoke, moon, stars, text, lettering, band names, border or vignette.

### Sky

Create the psychedelic sunset sky that goes behind the attached "Rock" street scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky. The attached Grateful Dead poster is a reference for the sun style only.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached ground image. Flat cel-shaded illustration like a screen-printed gig poster, flat colour shapes with soft gradients, subtle paper grain. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: near-black plum #1d132b at the top, through #43203a and #7a2d5e, to glowing red-orange #c2452f at the bottom edge.

In the sky:
- One huge sun low in the right-hand half of the image, drawn as a round emblem: a pale gold circle with a lightning bolt through it and a faint skull in its lower half, surrounded by long flowing flame-like rays that fan out across the sky. Keep it soft and low-contrast, in warm gold #f4c542 and amber #ffb347 on the deep sky.
- Thin wavy bands of cloud in magenta #a24a7e and violet #6a2f8f, drifting across the middle of the sky.
- A few small four-point stars and one or two tiny lightning bolts in pale gold, scattered in the upper sky.

Composition rules:
- The bottom 40% is calm, with only the gradient and a red-orange glow rising from the bottom edge. Buildings cover this area.
- Keep the top-left and top-centre quiet, with no rays or emblem, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No moon, buildings, skyline, ground, birds, people, faces, text, lettering, border or vignette.

---

### Sky (alternative: prism)

Use this instead of the sunset sky above. Attach the finished ground image and the prism reference.

Create a near-black night sky that goes behind the attached "Rock" street scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky. The attached prism artwork is a reference for the idea only. Make a small, subtle homage, not a copy.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: flat, minimal, clean vector look with subtle paper grain, matching the attached ground image. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: pure black #050308 for the top 75%, easing into very deep plum #1d132b and then a faint dusky plum #2c1a33 at the bottom edge. It should read as essentially black.

In the sky, one small prism motif in the upper right quarter of the image, placed about 70% of the way across and 22% of the way down:
- A small triangle outline, roughly 9% of the image width, drawn as a thin glass-like edge in cool grey-teal #5f7d86 with a barely visible lighter edge on one side. The inside is the same black as the sky.
- A thin white beam #e8e8f0 comes in from the left edge of the triangle, running slightly upward from the left, and fades out softly before it gets far.
- On the right of the triangle the beam spreads into a narrow rainbow band of seven flat stripes (red, orange, yellow, green, blue, indigo, violet) that widens slightly as it runs off toward the right edge of the image. Keep the rainbow muted and slightly dim, about 60% of full brightness, so it glows quietly against the black.

Composition rules:
- Everything else is empty black. No stars, clouds, moon, sun, glow or haze.
- The bottom 40% is calm, with only the gradient. Buildings cover this area.
- Keep the top-left and top-centre completely black, because the site title sits there.
- Keep the motif low-contrast and small, so text and buttons stay readable on top.
- No buildings, skyline, ground, birds, people, faces, text, lettering, border or vignette.

If it comes back too bright or too large, ask: "Make the prism about 30% smaller, dim the rainbow a little, and keep the rest of the sky pure black."

---

## Alternative

Indie, punk and post-punk version: a lo-fi photocopied zine of a downtown club block, set apart from Rock by its look (xerox grain, torn paper, two-colour print) and by its colours (cold slate and ice blue with hot pink and safety orange). Attach the Smiths, Radiohead and Sonic Youth covers and the punk logo chart with the ground prompt, as references for mood and symbols only.

### Ground

Create a wide landscape banner for the bottom of a website background: the "Alternative" scene, a gritty downtown club block at night, covered in homages to indie, alternative and punk bands. Match the layout of the other attached ground image. The attached album covers and punk logo chart are references for mood, colour and symbols only. Do not copy any cover or logo exactly. A separate sky layer will sit behind this image.

Size and format: landscape 1536×1024, PNG with a transparent background. Every solid element is fully opaque with crisp, clean, anti-aliased edges. There is no fringe, no glow halo around lamps or windows, and no haze or smoke floating above the skyline. Lamp light falls in crisp-edged cones.

Style: a lo-fi photocopied zine collage, clearly different from a polished screen-print. Rough hand-inked outlines, visible halftone dot shading, xerox grain, slightly off-register two-colour printing, torn and taped paper edges, hand-cut stencil shapes and spray-paint drips. Flat, straight-on side view with no perspective. All horizontal lines (wall top, fence rail, kerb) are perfectly level and straight across the full width.

Depth and detail: give the scene rich depth, never flat silhouettes. Build it in three layers. The foreground (end landmarks, fence posts, kerb) has the darkest, richest colours and the crispest linework. The midground (the graffiti wall and buildings) is fully detailed. The background skyline uses lighter, cooler, less saturated tones and simpler shapes. Shade every building with a lit front face and a darker side or recessed face. Add cast shadows under cornices, ledges and awnings, and warm light spilling from windows onto the walls and pavement. Use three or four related colours across the buildings so neighbouring buildings read as separate. Add texture where it fits: crumbling brick and concrete, layers of peeling flyers, spray-paint tags made of abstract scribbles (no readable letters), metal doors, fire escapes, rooftop vents and antennas. Vary the windows: some lit, some dim, many dark. Everything stays fully opaque.

The homage idea: a passer-by should be able to spot great alternative and punk acts from their famous visual signatures, drawn as stencils, stickers and wheat-pasted flyers. Show faces and figures only as graphic, illustrated art in the photocopy style, never photographic portraits of real people. There is no text, lettering, band names or readable words anywhere, so the symbols must do the work.

The image has three zones:

1. Left end, the left 28% of the width: the corner of a narrow, grimy punk club in the style of the famous New York dive on the Bowery. It has a flat dark-green awning, a heavy black door, a boarded window and a payphone on its front, and the whole front is layered with peeling flyers, band stickers and spray tags. Around the door, stencilled punk symbols: a skull with a spooky grin (Misfits look), four thick black bars in a row (Black Flag look), a circle with a lightning bolt through it (Bad Brains look), a crossed-out cross in a circle (Bad Religion look), a presidential eagle seal in a ring (Ramones look), and a stick figure mid-stride inside a circle. High on the wall, a big wheat-pasted poster of a pale, green-tinted face resting in shadow with an open hand over it (Smiths look, in murky green halftone). On the corner, a tall iron lamp post. The club's flat roof carries a rusted vent stack and a few antennas.

2. Middle, from 28% to 80% of the width. This section must be repeatable, like wallpaper:
- A long concrete and brick wall covered in flyers and spray tags, fronted by a chain-link fence on identical steel posts, exactly one post every 14% of the image width. Each post is a thin round steel pipe with a small flat cap, with a plain cone-shaped street lamp bracketed to it.
- Keep the flyers and graffiti inside the bays between the posts. Nothing overlaps or hides a post. Each bay holds the same arrangement: a row of three torn flyers (a stitched orange crocheted doll's head with button eyes in the Sonic Youth look, a spiky-haired shouting cartoon face in a square, a skull inside a heart) and below them a few stickers (a lightning bolt, a four-bar flag, a star, a safety pin).
- Behind the wall, a low band of dark brick tenement roofs with water-stained walls, a few lit and many dark windows, short chimneys and antennas, with a few colourful hand-painted block signs on the roofs made only of flat colour rectangles (no letters). No tall tower or landmark.
- Across the bottom, a wet cracked pavement with a concrete kerb and evenly spaced vertical reflections of the lamps.
- No unique objects in the middle: no one-off landmark such as a water tank, tower, van, tree, statue or stage, not even as a small decoration. Detail and variety are welcome, but the same arrangement repeats in each bay. Standout features belong in the end zones.

3. Right end, the right 20% of the width: the corner of a record shop with a big hand-painted mural of jagged icy white mountain peaks under a flat red sky, with two little orange volcano tips (Radiohead look). In front of it a giant crocheted orange doll with antennae sits on a stoop beside a stack of milk crates full of records. A rooftop sign made of rows of flat colour blocks and no letters sits on top. The scene runs off the right side of the frame.

All artwork sits in the bottom 55% of the canvas. The top 45% is completely empty and transparent.

Colours: slate night #1c2b3f, steel blue #2f4a63, ice blue #8fb2cc, pale grey-blue #c7d8e4, murky Smiths green #2f5a40, hot pink #ff4f9a, safety orange #ff6a1f, signal red #d93b2f, off-black #0d1118, flyer paper #e8dcc0.

No sky, clouds, smoke, moon, stars, text, lettering, band names, border or vignette.

### Sky

Create the cold night sky that goes behind the attached "Alternative" club-block scene. It will be a full-screen website background, and the attached image sits on top of it along the bottom of the screen, so this image is only sky.

Size: landscape 1536×1024, no transparency. The whole canvas is filled with sky.

Style: match the attached ground image. A lo-fi photocopy look: flat colour with halftone dot shading, coarse xerox grain, torn-paper edges on the clouds, slightly off-register layers. Not photorealistic, no lens flare, no bloom.

Sky gradient, top to bottom: near-black slate #0f1822 at the top, through #1c2b3f and #2f4a63, to a pale ice-blue glow #8fb2cc at the bottom edge.

In the sky:
- A few big, flat, torn-paper clouds in steel blue #3f6280 and ice blue #6f93ae, with ragged cut edges and halftone-dot shadows, drifting across the middle of the sky.
- One small pale moon disc in pale grey-blue #c7d8e4, low in the right third, with a faint halftone ring around it.
- A scatter of tiny halftone dots and small hand-drawn crosses as stars in the upper sky, and one thin pink #ff4f9a torn-paper strip floating among the clouds as a small accent.

Composition rules:
- The bottom 40% is calm, with only the gradient. Buildings cover this area.
- Keep the top-left and top-centre quiet, with no clouds or moon, because the site title sits there.
- Keep everything low-contrast, so text and buttons stay readable on top.
- No buildings, skyline, ground, birds, people, faces, text, lettering, border or vignette.

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
