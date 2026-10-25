# Cinematic and art direction

References: Yorushika, "That's Why I Gave Up on Music" (MV) for **characters and motion**; the two pixel-art "Need a game like this"
screenshots (a glowing crystal forest, a lived-in castle courtyard) for **environments**.
Rule of thumb from the author: *a good character tells more story than words or actions; details tell more than the plot.*

No video. Everything below is code, drawn at runtime, cheap enough for an i5-7th gen with HD 620.

## Characters: identity first, then colour

Every character is readable as a black silhouette before you see a colour. Identity lives in what **moves**.

| Character | Silhouette identity | Where |
|---|---|---|
| Hero | warm red scarf (the only warm colour on him), two hair tufts, short coat tails, all lag behind movement. After the lava: hunched posture and glowing ember cracks (`burned_lost_part`) | `TG.Rig.presets.hero` |
| The Mirror | the hero with every colour inverted (pale scarf, red rim) and **no face**: a soft white glow where the eye is | `faceless: true` |
| Guide girl | a bow with two long ribbons, a waist sash with two ends, long hair that streams when she walks, and a pink **core** on her chest that beats slowly (the bomb she carries). She is the only character with ribbons | `js/data/girl_look.js` |
| Hollow Attendant | kerchief tails at the head, apron strings at the back | `js/bosses/girl_guard.js` |
| Ashen Warden | horns, heavy tattered cape edged with ember light | `TG.Rig.presets.cape` |
| Ash Husk | smoke rising off the shoulders instead of cloth, ember cracks (`burn: true`) | `js/bosses/ash_husk.js` |

### Cloth system (`TG.Rig` `trails`)
```js
rig: { trails: [{ at: 'neck', dx: -2, dy: 2, n: 6, seg: 9, w: 10, color: 0xc4553a, edge: 0xffd0e4, k: 24, fork: true }] }
```
`at` = `neck | head | sh | hip | hand`. Points chase the anchor with a delay that grows toward the tip, so cloth streams behind a run, swings on a turn and
settles when still. Width `>= 5` draws a flat twisting strip; thinner draws a round stroke (hair). `front: true` draws over the body. `a` sets alpha.
`TG.Rig.trail(g, state, x, y, facing, opts, scale, alpha)` can be called directly (the girl does this). Other rig flags: `faceless`, `burn`.

### Acting rules (what the animation should say)
- The one who lies is **too composed**: the guide stops breathing in the ring scene, and her *shadow* raises an arm before her body does (`TG.Stage.shadow`
  can draw a shadow wearing a different pose than the body).
- Withhold the face at emotional beats (back to camera, glow instead of eye, close-up on a silhouette lit from below).
- Colour carries state: lava orange = crisis, washed white = release, cold blue = the ruins, pink = the guide.
- Same place, two states: props tell what happened (see the ruins and the ash basin).

## Cinematic toolkit (`js/core/cinematic.js`)
Cutscenes get `scene.cine` automatically; fights get a reduced set (no camera zoom).
```js
cine.bars(true, ms, height)      // letterbox
cine.shot({x, y, z}, ms, ease)   // slow push / pull / pan.   cine.cut({...}) hard cut.   cine.track(fn, k) follow.   cine.handheld(amp)
cine.grade('lava'|'cold'|'ash'|'dusk'|'grey'|'white'|colour, alpha, ms)    cine.vignette(a, ms)    cine.flash(colour, ms, peak)
cine.shafts(colour, alpha)       // additive light shafts
cine.motes('petal'|'butterfly'|'ash'|'ember'|'dust'|'snow', n)           // capped at 90 total
cine.slowmo(scale, ms)   cine.hitstop(ms)   cine.shake(i, ms)
cine.title('Place', 'sub')       cine.timeline([[ms, fn], ...])
```
All of it runs on the scene's tweens/timers, so pause and hold-to-skip keep working. Screen-space UI (`scrollFactor 0`) is kept at the same size while the
camera zooms, so give subtitles and prompts `setScrollFactor(0)`.

Fights use it for: an establishing beat (bars, place card, 2 s hold), a heavy vignette and desaturation on death, bars + flash on a boss falling,
a white-out for the Mirror's outcomes. Skipped with `?cine=0` and for bots.

### Staging helpers (`js/cutscenes/stage.js`)
`TG.Stage.layer(scene, key, factor, depth, grow)` parallax layer from a baked texture (factor < 1 sits behind, `grow` oversizes it so zooming never shows an edge);
`TG.Stage.shadow(g, actor, pose, cfg, groundY, light, alpha)`.

## Environments
Layered parallax, each baked once; lit by **one** visible source; props that say who lived there.
- **Ruins** (`js/areas/ruins.js`): cold night, crystal glow breaking through (teal and magenta), a banquet table set for guests who never came, the Attendant's broom and
  dust pile, a still-glowing fountain, a child's shoes and toy horse by the stairs, a helmet, a split shield and a banner where the last stand ended.
- **Ash basin** (`js/areas/ash_basin.js`): a drag mark and scorched handprints leading to where he lay, a ring-shaped scar, and on the far ridge a thin line of torches:
  the army marching home behind the one who pushed him.
- **Ring road / cliff** (cutscenes): warm dusk with petals (they return in the last scene) vs. the lava-lit cliff where every shadow points one way.
- Still to do in the same spirit: molten mountain caves, the return palace (Ultramarines-inspired), the home village and school, the butterfly ending.
  Keep the pixel-crisp, lived-in feel of the reference courtyard: sleeping soldiers, a sparring pair, unattended things.

## Testing
```
python3 tools/cine_test.py <cutscene> "flag=picked_cursed_item" 10,20,30 out   # steps the game by hand, screenshots at cutscene seconds
python3 tools/cast.py out 2.6                                                   # zoomed close-ups of every character
```
Dev switches: `?cut=<id>` start in a cutscene, `?flag=a,b` set story flags, `?cine=0` skip the fight intro.
