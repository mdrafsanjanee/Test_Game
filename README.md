# Test_Game

A 2D action game: a humanoid shadow, stickman-animation movement, a Hollow Knight mood, and fights that adapt to how you play.
Its centrepiece is the Mirror, a boss built from your own last five fights.

## Run
```
python3 -m http.server 8000
# open http://localhost:8000
```
No install, no build. Phaser is vendored in `lib/`.

## Controls
| Key | Action |
|---|---|
| A / D | move |
| W / Space | jump (press again in the air for a double jump) |
| J | strike (chain of 3; the third is a heavy finisher) |
| K | heavy swing (slow, breaks guards) |
| L | dash |
| I | roll (damages enemies) |
| H (hold) | heal: raise the sword for ~1.2s; needs 4 landed hits, any hit on you interrupts |
| S + jump | drop through a platform |
| Esc / P | pause (Q leaves to the menu) |
| Enter / Space (hold) | fast-forward a cutscene; tap to latch, tap or Esc to stop |
| N | mute music |

Phones and tablets get on-screen buttons automatically (`?touch=1` forces them on a desktop). Play in landscape.

Dev: `?boss=warden`, `?boss=mirror`, `?boss=girl_guard`, `?god=1`, `?bot=1`, `?fps=1`.

## Docs
- `docs/ARCHITECTURE.md`: how the engine works and how two agents split the work
- `docs/PLOT.md`: the story and design decisions
- `docs/AGENT_B_PROMPT.md`: the brief for the content agent
