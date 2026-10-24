# Architecture and work split

Phaser 3 (vendored in `lib/`), plain JS, **no build step**. Open `index.html` through any static server
(`python3 -m http.server`) and play. Runs on integrated graphics: all art is baked procedurally into a few
textures at load, effects are drawn into two shared Graphics objects, no real-time lights, no shaders.

**CSS and JS are always separate files.** Never inline either in an HTML file.

## Two agents, two halves

| | Agent A (engine) | Agent B (content) |
|---|---|---|
| Owns | `js/core/*`, `js/entities/*`, `js/scenes/*`, `js/manifest.core.js`, `js/areas/molten_mountain.js`, `js/areas/mirror_hall.js`, `js/bosses/warden.js`, `js/bosses/mirror.js`, `js/data/dialogue_core.js`, `tools/*` | `js/areas/*` (new files), `js/bosses/*` (new files), `js/cutscenes/*`, `js/data/dialogue_story.js`, `js/data/sequence.js`, `js/manifest.content.js`, `assets/*` |
| Rule | Does not edit B's files | Does not edit A's files. If the engine needs a change, open a GitHub issue titled `ENGINE REQUEST: ...` with the exact API wanted |

Merge conflicts are avoided by file ownership. The two manifests are the only registration points, one per agent.
Branches: A works on `engine/*`, B on `content/*`, both open PRs into `main`.

## Load order

`index.html` -> `lib/phaser.min.js` -> `manifest.core.js` -> `manifest.content.js` -> `loader.js` loads every file listed, then `js/main.js`.
Core files always load first, so content files can use `TG.*` freely at the top level.

## The contract (what Agent B builds against)

### Registries (in `js/core/tg.js`)
```js
TG.registerArea(id, def)       // an environment
TG.registerBoss(id, def)       // a fight
TG.registerCutscene(id, fn)    // a scripted scene
TG.sequence = ['cut:cliff_betrayal', 'girl', 'warden', 'mirror'];   // set in js/data/sequence.js
```
Sequence items are a boss id, or `'cut:<id>'` for a cutscene. `TG.Flow.next(scene, idx)` advances. The Mirror stays last before the ending.

### Area (see `js/areas/molten_mountain.js`, the reference)
```js
TG.registerArea('ruins', {
  name, width, height: 720, groundY: 620, bounds: {left, right},
  spawn: {player: x, boss: x},
  platforms: [{x, y, w}],            // one-way platforms; S/Down + jump drops through
  pits: [{x, w}],                    // gaps in the floor (falling costs HP, respawns at last safe ground)
  build(scene) { ...; return function update(dt) {...}; }   // bake textures, add layers, return per-frame updater
});
```
Use `TG.Art.bake/gradient/ridge/spike/glow/layers` to make layered parallax from a few Graphics calls.
Budget: at most 5 scrolling layers, textures 1280x720, no per-frame allocation. "Going into the ground or sky" = platforms and
vertical camera offsets within an area, plus parallax layers that change depth. Keep it one-direction side-scrolling.

### Boss (see `js/bosses/warden.js`, the reference)
```js
TG.registerBoss('girl', {
  name, area: 'palace_ruins', deathText: '...',
  decision: { prompt, spare, kill, after: {spare, kill} },   // optional: shows the spare/kill screen after victory
  create(scene, x, y) { return new TG.Boss(scene, x, y, this, { hp, rig: {...}, attacks: [...], ... }); },
  onStart(scene), onPhase2(boss), onDefeated(scene), tick(scene, dt)    // all optional
});
```
An attack is a plain table (windup/active/recover in ms, hitbox, `range`, `weight`, `tags`, poses). The boss brain picks only attacks that
fit the current range and biases toward ones that counter the player's live habits (`tags`: `light`, `evade`, `air`, `passive`, `heavy`).
Available attack features: `armor`, `guard`+`then`, `then` chains with `chainOnly`, `leap`+`landBox`, `jump`, `lunge`, `onActive` hooks,
projectiles via `scene.addProjectile({x,y,vx,w,h,life,dmg,team:'foe',kind:'flame'})`.
Non-combat or special bosses (the girl's mockery chase, scripted waves) can use `TG.Boss` with ranged `onActive` projectiles and a high `speed`,
or subclass `TG.Fighter`. A custom boss class needs: `update(dt)`, `draw()`, `receiveHit(info)`, `hurt` box, `hp/maxHp`, and calls `scene.onBossDefeated(this)` on death.

### Cutscene
```js
TG.registerCutscene('cliff_betrayal', function (scene, done) {
  // `scene` is the Phaser scene. Draw with scene.add.*, use scene.say(lines, cb), scene.wait(ms, cb),
  // scene.fadeIn(ms), scene.fadeOut(ms, cb), scene.updaters.push(fn(dt)).  Call done() to continue.
});
```
Cutscenes can draw characters with `TG.Rig.draw(graphics, x, y, facing, pose, rigCfg)` and `TG.Pose` presets. No video or image assets needed.

### Dialogue and story state
- `TG.Dialogue.<id> = { intro: [...], ... }`. A line is a string or `{ who, text, ms }`. Put yours in `js/data/dialogue_story.js`.
- `TG.Story.flag('picked_cursed_item', true)` / `TG.Story.has(key)`: persistent flags for branching (cursed item, spared party members, war path).
- `TG.Record.decide(bossId, 'spare'|'kill')`, `TG.Record.count('kill')`. Endings live in `TG.endings` (see `js/scenes/summary.js`; B may push to or replace this list from a content file).

### The record (read-only for B unless noted)
`TG.Record.profile(5)` returns the player's averaged habits over their last five non-Mirror fights (`light`, `heavy`, `dash`, `roll`, `jump`,
`djump` per second, preferred `dist`, `air` fraction, `combo` length). The Mirror boss and dialogue use it. B may add new fields to
`TG.Record.save.flags` freely.

## Audio (js/core/audio.js)
Music and SFX are synthesized with Web Audio: no files, no licensing, and the music reacts to the fight.
```js
TG.Music.play('warden')      // tracks: 'menu', 'warden', 'mirror'. Set `music: 'id'` on a boss def and the arena plays it.
TG.Music.phase(2)            // boss phase 2 layers/tempo (TG.Boss calls this automatically)
TG.Music.fadeOut(ms)         // N toggles mute everywhere
TG.Sfx.play('hit'|'hit_heavy'|'swing'|'swing_heavy'|'dash'|'roll'|'jump'|'jump2'|'hurt'|'tell'|'slam'|'roar'|'reflect'|'shatter'|'die'|'ui')
```
To add a track, add an entry to `TRACKS` in audio.js (`bpm: [phase1, phase2]`, `step(i, t, sd, phase, bus)` called per 16th note; helpers `tone`, `noise`, `kick`, `snare`, `hat`, `chord`).
To use real recordings (CC0 etc.) instead, put files in `assets/music/` and set `TG.MUSIC_FILES = { ruins: 'assets/music/ruins.ogg', ruins_p2: '...' }` in a content file; a file always wins over the synthesized track. Check levels with `python3 tools/audio_level.py`.

## Boss features added since v1 (see warden.js and mirror.js)
- `spin` attack id: if a boss defines an attack with id `spin` (use `both:true, spin:true, armor:true`), phase 2 automatically fires it whenever the player is behind the boss or just hit it from behind (`Boss.rearGuard`). Add it to any boss that must not be flanked.
- `both:true` hitbox centred on the boss (`reach` = half-width), `smearY` smear height, `p2tempo` (phase 2 speed, default 0.72), `music` track id.
- `TG.Player` takes tuning knobs (`speedMul`, `windupMul`, `recMul`, `cdMul`) so a boss can be "the hero, but different".
- Record: `TG.Record.flank()` (0 head-on .. 1 always behind) and profile fields `behind`, `cross`.

## The Mirror (reference for "boss built from the player")
Baseline is the same for everyone: fast, evasive, reads your attacks. The record only picks STYLE (`TG.ShadeBrain`: slips behind you or meets you head-on) plus dodge habit, combo length, heavy-swing habit.
Phase 1: protective shield. Break it once and it shatters (hero healed to full). Phase 2: 70% of every blow you land is reflected onto you and the killing blow is always lethal to both (`scene.mutualKill`, outcome `mutual`). It kites and dodges. Stop swinging ~10s and it yields (`finishEncounter('forgiven')`). Dying anywhere in this fight shows "How did I become this?".
Outcomes are saved as `TG.Story.flag('mirror_outcome')` = `'mutual'|'forgiven'` and `TG.Record.decide('mirror', ...)`; endings read them.

## Combat rules (engine, do not bypass)
Hero moves: `J` strike (3-hit chain; the 3rd hit is a heavier, committed finisher), `K` heavy swing (slow, armor-breaking, breaks guards),
`L` dash (i-frames, air dash once), `I` roll (i-frames, damages), `W/Space` jump + double jump. Spam protection is structural:
repeating the same hit within 5s loses up to 55% damage, the finisher cannot be cancelled by attacks, the heavy swing is slow, and bosses
read the live record to pick counters (guard-riposte against button mashing, armored smash against heavy mashing, anti-air against jump spam).
New bosses should add `tags` so they adapt the same way.

## Dev switches (URL query)
`?boss=<id>` jump straight into a fight - `?god=1` no damage - `?bot=1` AI plays the hero - `?fps=1` show FPS.
`F2` toggles god mode in-game, `Esc` leaves a fight.

## Testing without a GPU
```
python3 tools/smoke.py "boss=warden&bot=1&god=1" 5 shot.png   # real-time smoke test + screenshot
python3 tools/sim.py   "boss=warden&bot=1&god=1" 120          # fast-forward 120s of game time
python3 tools/mirror_test.py                                  # warden -> record -> mirror fight
python3 tools/death_test.py warden|mirror                     # death screen text
```
Requires `pip install playwright` and Chromium. Every PR must run with no console errors.

## Performance budget (target: i5-7th gen, HD 620, 8 GB)
60 FPS at 1280x720, under ~200 draw calls, at most 5 parallax layers, particles capped (260), no allocation in per-frame code paths,
no real-time lighting. Check with `?fps=1` on the low-end machine before merging an area.
