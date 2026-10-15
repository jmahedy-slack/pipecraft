# PIPECRAFT — BUILDS PIPELINE

First-person voxel adventure at a fictional World Tour (London). See `docs/Pipecraft_Ash_Builds_Pipeline.pdf` for the full spec.

## Slack Code (play in-channel)

In **`#pipecraft`**, open the **Homepage** tab → **Start Adventure** → click the canvas to capture the mouse.

Each push bundles `pipecraft.html` into `Homepage.html` (Slack inlines HTML; external script paths do not load in the preview pane).

## How to run (offline)

1. Open **`pipecraft.html`** in Chrome or Edge.
2. Or serve locally: `npx serve .` → `/pipecraft.html`
3. Regenerate Slack bundle: `npm run bundle:homepage`

No build step, account, or network is required during play. Three.js is vendored under `vendor/three.min.js`.

## Controls

| Input | Action |
|--------|--------|
| WASD | Move |
| Mouse | Look (click to capture pointer) |
| Space | Jump |
| Shift | Sprint |
| E | Interact (Milestone 2+) |
| Left click | Cloud Scanner (Milestone 2+) |
| Tab | Pause |
| Esc | Pause / resume |

## Milestone 1 (current)

- Connected walkable voxel map with five zone shells
- FPS movement, jump, sprint, collision, safe respawn
- Ash first-person Cloud Scanner + lanyard view
- Title, How to Play, Settings, Pause HUD
- Minimap, zone banners, tutorial toast on Arrivals

## Acceptance checklist (full MVP — see PDF §7)

- [ ] Launch offline title screen
- [ ] Full controls + pipeline loop
- [ ] Scan / craft / build / keynote (Milestones 2–5)
- [ ] Results, accessibility, 5–10 min playthrough

## Reference art

Style references only (do not ship as game textures): `docs/reference/`.
