# Ben's Studio — walkable portfolio

A pixel-art version of the portfolio you walk around instead of scroll. Every object in
the room opens real content from the main site — no separate copy of anything to keep in sync.

## What's already wired up
- Linked from the homepage hero: "Or walk through my portfolio as a game →"
- Every panel (Work, About, Music, Movies, Contact, Résumé, MistMates, Dogs) pulls its
  own small thumbnails from `world/assets/` and links back out to the real pages —
  `../index.html?case=premier`, `../about.html`, the real résumé PDF, etc.
- "Exit to portfolio" (the door) and "Regular site →" (top-right) both go back to `../index.html`.

## If you rename or move the site
Open `world/game.js` and edit the `CFG` block at the very top:
```js
const CFG = {
  SITE: '../',                       // path back to the main portfolio's folder
  RESUME: 'images/Ben-Levitsky-Resume.pdf',
  EMAIL: 'bglevitsky@icloud.com',
  LINKEDIN: '...', INSTAGRAM: '...',
};
```
Everything else (all 8 panels, the project list, the track list, the movie list) reads
from a few small arrays near the top of the "panels" section of the same file, so updating
a project description or swapping a song is a one-line edit, not a rebuild.

## Updating content later
- New project → add one line to the `PROJECTS` array and drop a `.jpg` in `assets/projects/`.
- New track → add one line to `TRACKS` (needs the Spotify track ID) and a `.jpg` in `assets/music/`.
- Swap a photo → replace the file in `assets/` with the same name.

## Notes
- No build step, no dependencies. One canvas, plain DOM for the panels.
- Keyboard (WASD/arrows + E), mouse click-to-walk, and touch (tap to walk, tap a label to
  open it) all work. Screen-reader users get the same content through visible-but-skippable
  text alternatives — "Skip to the regular portfolio" is the first thing in the intro card.
- `prefers-reduced-motion` turns off the sleeping-dog wobble, particles, and the cursor blink.
- Progress ("6/8 explored") is saved to `localStorage` so it persists between visits.
