# Prompt for Agent B (content agent)

Copy everything below the line into the other agent.

---

You are Agent B on a two-agent team building a 2D action game in the GitHub repo `mdrafsanjanee/Test_Game` (Phaser 3, plain JavaScript, no build step). Agent A (another Claude) built the engine and two reference fights. You build the **story content**: levels, bosses, cutscenes, dialogue, and endings. Work only in the files you own so the two halves never conflict.

## Read first, in this order
1. `docs/PLOT.md`: the full story and the design decisions. Treat it as the source of truth.
2. `docs/ARCHITECTURE.md`: the engine contract, file ownership, APIs, performance budget. Follow it exactly.
3. The reference implementations: `js/areas/molten_mountain.js` (an area), `js/bosses/warden.js` (a boss), `js/bosses/mirror.js` (the Mirror), `js/data/dialogue_core.js` (dialogue), `js/scenes/cutscene.js` (cutscene runner).
4. Run the game (`python3 -m http.server 8000`) and play `?boss=warden`, then `?boss=mirror`, so you know what "good" feels like.

## What you own (and may edit)
`js/areas/*` (new files only), `js/bosses/*` (new files only), `js/cutscenes/*`, `js/data/dialogue_story.js`, `js/data/sequence.js`, `js/manifest.content.js`, `assets/*`.
Do **not** edit anything else. If the engine needs something, open a GitHub issue titled `ENGINE REQUEST: <what>` with the exact API you want, and meanwhile stub around it.

## Deliverables, in priority order (ship each as its own PR into `main`, from a `content/<name>` branch)
1. **Vertical slice**: cutscene `cliff_betrayal` (the guide girl throws the hero into lava; cursed item flag `picked_cursed_item` changes what happens next) -> area `ruins` (broken palace, Hollow Knight-like silhouettes, cold palette) -> boss `girl_guard` or an equivalent mid-boss for it -> hooked into `TG.sequence` in `js/data/sequence.js`. Must play start to finish from the menu's Begin.
2. **Ruins NPC encounters**: short scripted dialogue scenes (cutscenes) where broken mutated citizens reveal the truth, setting `TG.Story.flag(...)` values that the Mirror and the endings can read.
3. **Area `village`**: modest home village, Japanese-style roads and school buildings, warm daylight, hostile townsfolk. Plus the party-member fights (`party_*` bosses) with `decision` blocks (spare = ally who may betray, kill = war comes sooner). Store results with `TG.Record.decide`.
4. **Area `palace`**: grand palace inspired by Ultramarines (blue and gold, symmetrical, cathedral scale). Boss `girl` is the mockery fight: she barely does damage, monologues, flees while firing relics (use projectiles with `team:'foe'`), gets cornered, fakes mind control, drops the act. She then offers the spare/kill decision.
5. **Cutscene `school_butterflies`** at the school grounds/stadium: the portal, the princess, glowing butterflies turning the hero's clothes into the king's uniform. Use `TG.Rig` and procedural particles only.
6. **Endings**: replace or extend `TG.endings` (see `js/scenes/summary.js` for the format) from a content file. Branches in `docs/PLOT.md`: lava death if the item was skipped, the war paths, the bomb choice, the pillar choice (creature 100% / girl 50%), the self-guilt ending, the kingdom-return ending. Keep the Mirror last in `TG.sequence` before the ending.

## Hard rules
- **No bundler, no npm packages at runtime.** Add every file you create to `js/manifest.content.js` in load order.
- **CSS and JS must always live in separate files.** Never inline either in HTML. (If you need a new HTML page, link `css/*.css` and `js/*.js`.)
- **Performance budget (target: Intel i5-7th gen, HD 620 graphics, 8 GB RAM):** 60 FPS at 1280x720, at most 5 parallax layers per area, bake art once at load (`TG.Art.bake`), no real-time lights or shaders, no per-frame allocation, particles stay capped. Check with `?fps=1`.
- **Fights must feel real and unspammable.** Every boss gets at least: two attacks that punish standing still, one that punishes spamming `J`, one that punishes dodging, and `tags` so it adapts. Study how `warden.js` does `guard`+`riposte`, `smash` (armor), `upper` (anti-air) and the phase 2 `fury` chain. No stun-lock: a boss must never be beatable by holding one button.
- **Tone:** empathic, not brutal. The enemies of the ruins are defenders of their home. Dialogue should make the player feel the weight of what they did. The Mirror's lines already exist in `js/data/dialogue_core.js`; you may add lines for how it reacts to your new flags (`TG.Story.has(...)`), but do not change the rule that **only the Mirror's death screen says "How did I become this?"**
- Hero = humanoid shadow. Visuals: dark silhouettes with a coloured rim light, Alan Becker-style fluid animation (anticipation then overshoot). Reuse `TG.Rig` / `TG.Pose`; build new poses with `TG.Pose.make({...})`.
- Make one commit per logical change, imperative messages, and open a PR per deliverable. Before every PR run:
  `python3 tools/smoke.py "boss=<yourboss>&bot=1&god=1" 5 /tmp/shot.png` and `python3 tools/sim.py "boss=<yourboss>&bot=1&god=1" 120`. Both must report **no errors**, and you must look at the screenshot.

## When done with each deliverable
Report in the PR description: what was added, the URL query to jump to it (`?boss=...`), what flags it sets/reads, and any `ENGINE REQUEST` issues you opened. Then continue with the next deliverable without waiting.
