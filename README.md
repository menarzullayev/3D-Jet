# 3D Jet — Interactive Viewer

**Live demo:** [3djet.bugvector.uz](https://3djet.bugvector.uz)

An interactive 3D jet aircraft viewer built with [model-viewer](https://modelviewer.dev/), vanilla JavaScript ES modules, and SCSS. No frameworks, no bundler, no CDN dependencies — pure static files.

## Features

- **Scroll-driven camera** — page scroll smoothly animates orbit, target, and exposure
- **Camera presets** — Cinematic, Top, Engine, Pilot, Landing views with animated transitions
- **Auto-rotate** — toggleable, restores automatically after user interaction
- **Fullscreen mode** — one-click or press `F` to go fullscreen
- **Share link** — copies a URL that encodes current camera angle, exposure, and color
- **AR mode** — "View in AR" button for WebXR / Scene Viewer / Quick Look on supported devices
- **Exposure control** — slider from 0.4× to 2.4×, persisted to `localStorage`
- **Body color** — 5 preset swatches + custom color picker, persisted to `localStorage`
- **Photo capture** — downloads a PNG screenshot of the current view
- **Animation playback** — play/pause and select named animations if the model includes any
- **Model stats** — live mesh, material, animation, and triangle counts
- **Service worker** — assets cached offline after first visit
- **Progress bar** — visual loading progress while the GLB downloads
- **Error detection** — distinguishes offline vs. WebGL-disabled vs. load failure
- **Accessible** — skip link, ARIA labels, keyboard navigation, live region announcements

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `F` | Toggle fullscreen |
| `Space` | Toggle auto-rotate |
| `R` | Reset camera to default |
| `P` | Take photo (PNG download) |
| `→` | Next camera preset |
| `←` | Previous camera preset |
| `Esc` | Close appearance panel |

## Controls

| Input | Action |
|-------|--------|
| Drag | Orbit around the model |
| Scroll | Cinematic camera sweep |
| Pinch | Zoom in / out |
| Preset buttons | Jump to named camera angles |
| Rotate button | Toggle auto-rotation |
| Reset button | Return to default view |
| Share button | Copy shareable link |
| Fullscreen button | Enter / exit fullscreen |

## Project structure

```
3D-Jet/
├── index.html
├── sw.js               # service worker (offline caching)
├── _headers            # Cloudflare Pages cache rules
└── assets/
    ├── css/
    │   ├── style.scss          # source styles
    │   └── style.min.css       # compiled output
    ├── js/
    │   ├── config.js           # constants, camera presets, scroll keyframes
    │   ├── storage.js          # localStorage read/write
    │   ├── camera.js           # animation, easing, scroll interpolation
    │   ├── main.js             # app logic, DOM bindings, event handlers
    │   ├── model-viewer.min.js # self-hosted model-viewer v3.1.1
    │   └── draco/              # Draco decoder (WASM + JS, self-hosted)
    ├── model/
    │   └── fly.glb             # Draco-compressed 3D model (2.06 MB)
    └── favicon.svg
```

## Running locally

The page must be served over HTTP — ES modules do not work via `file://`.

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

## Share URL params

The share button encodes the current viewer state into URL query params:

| Param | Example | Description |
|-------|---------|-------------|
| `orbit` | `35deg+75deg+110%25` | Camera orbit (theta, phi, radius) |
| `target` | `0m+0.2m+0m` | Camera look-at target |
| `exposure` | `1.4` | Scene exposure |
| `color` | `60a5fa` | Body color hex (without `#`) |

## Tech stack

| | |
|---|---|
| 3D rendering | [model-viewer v3.1.1](https://modelviewer.dev/) (self-hosted, WebGL) |
| Draco decoder | [three.js Draco WASM](https://github.com/mrdoob/three.js) (self-hosted) |
| JavaScript | Vanilla ES Modules (no bundler) |
| Styles | SCSS → compressed CSS |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) (auto-deploy from GitHub) |
| Persistence | `localStorage` |
| Offline | Service Worker |
| Build | None required |

## License

MIT — see [LICENSE](LICENSE).
