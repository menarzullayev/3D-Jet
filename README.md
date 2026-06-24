# 3D Jet — Interactive Viewer

**Live demo:** [3djet.bugvector.uz](https://3djet.bugvector.uz)

An interactive 3D jet aircraft viewer built with [model-viewer](https://modelviewer.dev/), vanilla JavaScript ES modules, and SCSS. No frameworks, no bundler — pure static files.

## Features

- **Scroll-driven camera** — page scroll smoothly animates orbit, target, and exposure
- **Camera presets** — Cinematic, Top, Engine, Pilot, Landing views with animated transitions
- **Auto-rotate** — toggleable, restores automatically after user interaction
- **Exposure control** — slider from 0.4× to 2.4×, persisted to `localStorage`
- **Body color** — 5 preset swatches + custom color picker, persisted to `localStorage`
- **Photo capture** — downloads a PNG screenshot of the current view
- **Model stats** — live mesh, material, animation, and triangle counts
- **Error detection** — distinguishes offline vs. WebGL-disabled vs. CDN failure
- **Accessible** — skip link, ARIA labels, keyboard navigation, live region announcements

## Project structure

```
3D-Jet/
├── index.html
└── assets/
    ├── css/
    │   ├── style.scss          # source styles
    │   └── style.min.css       # compiled output
    ├── js/
    │   ├── config.js           # constants, camera presets, scroll keyframes
    │   ├── storage.js          # localStorage read/write
    │   ├── camera.js           # animation, easing, scroll interpolation
    │   └── main.js             # app logic, DOM bindings, event handlers
    └── model/
        └── fly.glb             # 3D model (~11 MB)
```

## Running locally

The page must be served over HTTP — ES modules and the model-viewer CDN do not work via `file://`.

**Python (no install):**
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

**Node.js:**
```bash
npx serve .
```

**VS Code:** install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension and click **Go Live**.

## Editing styles

The CSS is compiled from SCSS. After editing `assets/css/style.scss`, recompile:

```bash
npx sass assets/css/style.scss assets/css/style.min.css --style=compressed --source-map
```

## Tech stack

| | |
|---|---|
| 3D rendering | [Google model-viewer v3.1.1](https://modelviewer.dev/) (WebGL via CDN) |
| JavaScript | Vanilla ES Modules (no bundler) |
| Styles | SCSS → compressed CSS |
| Persistence | `localStorage` |
| Build | None required |

## Controls

| Input | Action |
|---|---|
| Drag | Orbit around the model |
| Scroll | Cinematic camera sweep |
| Pinch | Zoom in / out |
| Preset buttons | Jump to named camera angles |
| Rotate button | Toggle auto-rotation |
| Reset button | Return to default view |

## License

MIT — see [LICENSE](LICENSE).
