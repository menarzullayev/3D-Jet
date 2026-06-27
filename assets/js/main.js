import {
    DEFAULT_EXPOSURE, DEFAULT_COLOR,
    PRESETS, SCROLL_KEYFRAMES,
    PRESET_AUTOROTATE_RESTORE_MS, SCROLL_AUTOROTATE_RESTORE_MS, SCROLL_THRESHOLD_PX,
    DEFAULT_ORBIT, DEFAULT_TARGET,
} from './config.js';
import { loadPrefs, savePrefs } from './storage.js';
import { animateToCamera, resetCameraAttrs, buildScrollCamera } from './camera.js';

// ── Model source (default or ?src= override) ──────────────────────────────
const DEFAULT_MODEL_SRC = './assets/model/fly.glb';
const MODEL_SRC = (() => {
    const param = new URLSearchParams(window.location.search).get('src');
    if (!param) return DEFAULT_MODEL_SRC;
    try { new URL(param, window.location.href); return param; } catch { return DEFAULT_MODEL_SRC; }
})();

// ── DOM refs ──────────────────────────────────────────────────────────────
const modelEl          = document.querySelector('#model');
const loadingOverlay   = document.getElementById('loadingOverlay');
const errorOverlay     = document.getElementById('errorOverlay');
const scrollHint       = document.getElementById('scrollHint');
const exposureRange    = document.getElementById('exposureRange');
const exposureValue    = document.getElementById('exposureValue');
const colorPicker      = document.getElementById('colorPicker');
const autoRotateBtn    = document.getElementById('autoRotateBtn');
const resetCameraBtn   = document.getElementById('resetCameraBtn');
const retryBtn         = document.getElementById('retryBtn');
const photoBtn         = document.getElementById('photoBtn');
const appearancePanel  = document.getElementById('appearancePanel');
const appearanceToggle = document.getElementById('appearanceToggle');
const appearanceClose  = document.getElementById('appearanceClose');
const liveRegion       = document.getElementById('liveRegion');
const customSwatchBtn  = document.getElementById('customSwatchBtn');
const progressFill     = document.getElementById('progressFill');
const fullscreenBtn    = document.getElementById('fullscreenBtn');
const shareBtn         = document.getElementById('shareBtn');
const shareToast       = document.getElementById('shareToast');
const animField        = document.getElementById('animField');
const animSelect       = document.getElementById('animSelect');
const animPlayBtn      = document.getElementById('animPlayBtn');

const statMeshes     = document.getElementById('statMeshes');
const statMaterials  = document.getElementById('statMaterials');
const statAnimations = document.getElementById('statAnimations');
const statTriangles  = document.getElementById('statTriangles');

const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));
const swatchButtons = Array.from(document.querySelectorAll('.swatch-btn[data-color]'));

// ── App state ─────────────────────────────────────────────────────────────
let scrollTicking            = false;
let hintHidden               = false;
let autoRotateRestoreTimeout = null;
let restoreAutoRotateTo      = true;
let presetCameraActive       = false;
let activeExposure           = DEFAULT_EXPOSURE;
let toastTimeout             = null;
let animPlaying              = false;

// ── Accessibility ─────────────────────────────────────────────────────────
function announce(msg) {
    if (liveRegion) liveRegion.textContent = msg;
}

// ── Loading overlay ───────────────────────────────────────────────────────
function setLoadingProgress(pct) {
    const p = loadingOverlay.querySelector('p');
    if (p) p.textContent = pct < 100 ? `Loading 3D model… ${pct}%` : 'Loading 3D model…';
    if (progressFill) progressFill.style.width = `${pct}%`;
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.setAttribute('aria-busy', 'false');
}

function showLoading(text) {
    const p = loadingOverlay.querySelector('p');
    if (p) p.textContent = text ?? 'Loading 3D model…';
    if (progressFill) progressFill.style.width = '0%';
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.setAttribute('aria-busy', 'true');
}

// ── Error overlay ─────────────────────────────────────────────────────────
function detectErrorMessage() {
    if (!navigator.onLine) return 'No internet connection. Check your network and retry.';
    const canvas = document.createElement('canvas');
    const hasWebGL = !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    if (!hasWebGL) return 'WebGL is not supported or disabled. Enable hardware acceleration in browser settings and retry.';
    return 'Model failed to load. Check your internet connection (CDN required) or try a different browser.';
}

function showError() {
    hideLoading();
    const p = errorOverlay.querySelector('.overlay__text');
    if (p) p.textContent = detectErrorMessage();
    errorOverlay.classList.remove('hidden');
}

function hideError() {
    errorOverlay.classList.add('hidden');
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg) {
    if (!shareToast) return;
    shareToast.textContent = msg;
    shareToast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => shareToast.classList.remove('visible'), 2400);
}

// ── Appearance panel ──────────────────────────────────────────────────────
function setAppearanceOpen(open) {
    if (!appearancePanel || !appearanceToggle) return;
    appearancePanel.classList.toggle('is-open', open);
    appearanceToggle.setAttribute('aria-expanded', String(open));
}

// ── Exposure ──────────────────────────────────────────────────────────────
function setExposure(value) {
    modelEl.exposure         = value;
    exposureRange.value      = String(value);
    if (exposureValue) exposureValue.textContent = Number(value).toFixed(1);
}

// ── Color ─────────────────────────────────────────────────────────────────
function hexToRgba(hex) {
    const n = hex.replace('#', '');
    const s = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
    const i = Number.parseInt(s, 16);
    return [((i >> 16) & 255) / 255, ((i >> 8) & 255) / 255, (i & 255) / 255, 1];
}

function applyBodyColor(hex) {
    if (!modelEl.model?.materials?.length) return;
    const rgba = hexToRgba(hex);
    modelEl.model.materials.forEach(m => m.pbrMetallicRoughness?.setBaseColorFactor(rgba));
}

function setActiveSwatch(hex) {
    const isPreset = swatchButtons.some(btn => btn.dataset.color?.toLowerCase() === hex.toLowerCase());
    swatchButtons.forEach(btn => {
        const active = btn.dataset.color?.toLowerCase() === hex.toLowerCase();
        btn.classList.toggle('swatch-btn--active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    if (customSwatchBtn) {
        const customActive = !isPreset;
        customSwatchBtn.classList.toggle('swatch-btn--active', customActive);
        customSwatchBtn.setAttribute('aria-pressed', String(customActive));
        if (customActive) customSwatchBtn.style.setProperty('--swatch', hex);
    }
}

function applyColor(hex) {
    colorPicker.value = hex;
    applyBodyColor(hex);
    setActiveSwatch(hex);
    savePrefs({ color: hex });
}

// ── Camera ────────────────────────────────────────────────────────────────
function setActivePreset(key) {
    presetButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.preset === key)));
}

function goToPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    restoreAutoRotateTo = autoRotateBtn.getAttribute('aria-pressed') === 'true';
    presetCameraActive  = true;
    setAutoRotate(false);
    setActivePreset(key);
    animateToCamera(modelEl, preset, exp => setExposure(exp));
    announce(`Camera: ${key}`);
    window.setTimeout(() => setAutoRotate(restoreAutoRotateTo), PRESET_AUTOROTATE_RESTORE_MS);
}

function cyclePreset(dir) {
    const keys = Object.keys(PRESETS);
    const activeIdx = presetButtons.findIndex(b => b.getAttribute('aria-pressed') === 'true');
    const next = activeIdx === -1
        ? (dir > 0 ? 0 : keys.length - 1)
        : (activeIdx + dir + keys.length) % keys.length;
    goToPreset(keys[next]);
}

function applyDefaultCamera() {
    resetCameraAttrs(modelEl);
    setExposure(activeExposure);
}

// ── Auto-rotate ───────────────────────────────────────────────────────────
function setAutoRotate(enabled) {
    if (enabled) modelEl.setAttribute('auto-rotate', '');
    else         modelEl.removeAttribute('auto-rotate');
    autoRotateBtn.setAttribute('aria-pressed', String(enabled));
    autoRotateBtn.setAttribute('aria-label', `Auto-rotate ${enabled ? 'on' : 'off'}`);
}

function toggleAutoRotate() {
    const enabled = autoRotateBtn.getAttribute('aria-pressed') !== 'true';
    setAutoRotate(enabled);
    announce(`Auto-rotate ${enabled ? 'on' : 'off'}`);
}

// ── Fullscreen ────────────────────────────────────────────────────────────
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function onFullscreenChange() {
    const isFull = !!document.fullscreenElement;
    if (!fullscreenBtn) return;
    fullscreenBtn.setAttribute('aria-pressed', String(isFull));
    fullscreenBtn.setAttribute('aria-label', isFull ? 'Exit fullscreen' : 'Fullscreen');
    const svg = fullscreenBtn.querySelector('svg');
    if (svg) {
        svg.querySelector('path').setAttribute('d', isFull
            ? 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3'
            : 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
    }
}

// ── Share ─────────────────────────────────────────────────────────────────
async function shareLink() {
    const params = new URLSearchParams(window.location.search);
    params.set('orbit', modelEl.cameraOrbit ?? DEFAULT_ORBIT);
    params.set('target', modelEl.cameraTarget ?? DEFAULT_TARGET);
    params.set('exposure', activeExposure.toFixed(1));
    const color = colorPicker.value;
    if (color.toLowerCase() !== DEFAULT_COLOR.toLowerCase()) {
        params.set('color', color.replace('#', ''));
    } else {
        params.delete('color');
    }
    const url = `${location.origin}${location.pathname}?${params}`;
    try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
    } catch {
        showToast('Copy failed — try HTTPS');
    }
}

// ── Share URL params ──────────────────────────────────────────────────────
function applyShareParams() {
    const p = new URLSearchParams(window.location.search);
    const orbit    = p.get('orbit');
    const target   = p.get('target');
    const exposure = p.get('exposure');
    const color    = p.get('color');
    if (orbit)    modelEl.cameraOrbit  = decodeURIComponent(orbit);
    if (target)   modelEl.cameraTarget = decodeURIComponent(target);
    if (exposure) { activeExposure = Number(exposure); setExposure(activeExposure); }
    if (color)    applyColor('#' + color);
}

// ── Scroll camera ─────────────────────────────────────────────────────────
function updateScrollCamera() {
    if (presetCameraActive || window.scrollY < SCROLL_THRESHOLD_PX) {
        if (!presetCameraActive) applyDefaultCamera();
        if (hintHidden && window.scrollY < SCROLL_THRESHOLD_PX) {
            scrollHint.classList.remove('hidden');
            hintHidden = false;
        }
        return;
    }

    const scrollMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress  = Math.min(Math.max(window.scrollY / scrollMax, 0), 1);
    const cam       = buildScrollCamera(progress, SCROLL_KEYFRAMES);

    modelEl.cameraOrbit  = cam.orbit;
    modelEl.cameraTarget = cam.target;
    setExposure(cam.exposure);

    if (!hintHidden && window.scrollY > SCROLL_THRESHOLD_PX) {
        scrollHint.classList.add('hidden');
        hintHidden = true;
    }
}

function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
        if (window.scrollY >= SCROLL_THRESHOLD_PX) presetCameraActive = false;
        if (autoRotateBtn.getAttribute('aria-pressed') === 'true') {
            restoreAutoRotateTo = true;
            setAutoRotate(false);
        }
        window.clearTimeout(autoRotateRestoreTimeout);
        autoRotateRestoreTimeout = window.setTimeout(
            () => setAutoRotate(restoreAutoRotateTo),
            SCROLL_AUTOROTATE_RESTORE_MS,
        );
        updateScrollCamera();
        scrollTicking = false;
    });
}

// ── Reset ─────────────────────────────────────────────────────────────────
function resetCamera() {
    presetCameraActive = false;
    presetButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
    applyDefaultCamera();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollHint.classList.remove('hidden');
    hintHidden = false;
    announce('View reset');
}

// ── Photo ─────────────────────────────────────────────────────────────────
async function takePhoto() {
    if (!modelEl?.loaded) return;
    showLoading('Capturing screenshot…');
    try {
        const date = new Date().toISOString().slice(0, 10);
        let blob = null;
        try {
            blob = await modelEl.toBlob('image/png');
        } catch {
            const res = await fetch(modelEl.toDataURL('image/png'));
            blob = await res.blob();
        }
        if (!blob) throw new Error('blob empty');
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `jet-${date}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        announce('Photo saved');
    } finally {
        hideLoading();
    }
}

// ── Model stats ───────────────────────────────────────────────────────────
function updateStatsBestEffort() {
    if (!modelEl.model) return;
    if (statMaterials)  statMaterials.textContent  = String(modelEl.model.materials?.length ?? '—');
    if (statAnimations) statAnimations.textContent = String(modelEl.availableAnimations?.length ?? '—');
    if (!statMeshes && !statTriangles) return;
    try {
        const sceneSym = Object.getOwnPropertySymbols(modelEl).find(s => s.description === 'scene');
        const root = sceneSym ? (modelEl[sceneSym]?.model || modelEl[sceneSym]) : null;
        if (!root) throw new Error('no scene');
        let meshes = 0, triangles = 0;
        const stack = [root];
        while (stack.length) {
            const obj = stack.pop();
            if (!obj) continue;
            if (obj.isMesh) {
                meshes++;
                const g = obj.geometry;
                if (g?.index?.count)                     triangles += g.index.count / 3;
                else if (g?.attributes?.position?.count) triangles += g.attributes.position.count / 3;
            }
            if (obj.children?.length) stack.push(...obj.children);
        }
        if (statMeshes)    statMeshes.textContent    = String(meshes);
        if (statTriangles) statTriangles.textContent = triangles >= 1000
            ? `${Math.round(triangles / 1000)}k`
            : String(Math.round(triangles));
    } catch {
        if (statMeshes)    statMeshes.textContent    = '—';
        if (statTriangles) statTriangles.textContent = '—';
    }
}

// ── Animations ────────────────────────────────────────────────────────────
function setupAnimations() {
    const anims = modelEl.availableAnimations;
    if (!anims?.length || !animField) return;
    animField.style.removeProperty('display');
    anims.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name || 'Animation';
        animSelect?.appendChild(opt);
    });
}

function setAnimIcon(playing) {
    const svg = animPlayBtn?.querySelector('svg');
    if (!svg) return;
    svg.innerHTML = playing
        ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        : '<polygon points="5 3 19 12 5 21 5 3"/>';
}

function toggleAnimPlayback() {
    if (!animPlayBtn) return;
    animPlaying = !animPlaying;
    animPlayBtn.setAttribute('aria-pressed', String(animPlaying));
    animPlayBtn.setAttribute('aria-label', animPlaying ? 'Pause animation' : 'Play animation');
    setAnimIcon(animPlaying);
    if (animPlaying) {
        modelEl.animationName = animSelect?.value || modelEl.availableAnimations?.[0] || '';
        modelEl.play({ repetitions: Infinity });
    } else {
        modelEl.pause();
    }
    announce(`Animation ${animPlaying ? 'playing' : 'paused'}`);
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function handleKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
        case 'f': case 'F':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'ArrowRight':
            e.preventDefault();
            cyclePreset(1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            cyclePreset(-1);
            break;
        case ' ':
            e.preventDefault();
            toggleAutoRotate();
            break;
        case 'r': case 'R':
            e.preventDefault();
            resetCamera();
            break;
        case 'p': case 'P':
            e.preventDefault();
            takePhoto();
            break;
        case 'Escape':
            setAppearanceOpen(false);
            break;
    }
}

// ── Events ────────────────────────────────────────────────────────────────
function bindEvents() {
    exposureRange.addEventListener('input', () => {
        activeExposure = Number(exposureRange.value);
        setExposure(activeExposure);
        savePrefs({ exposure: activeExposure });
    });

    colorPicker.addEventListener('input', () => applyColor(colorPicker.value));

    presetButtons.forEach(btn => btn.addEventListener('click', () => goToPreset(btn.dataset.preset)));

    swatchButtons.forEach(btn => btn.addEventListener('click', () => {
        const hex = btn.dataset.color;
        if (!hex) return;
        applyColor(hex);
        announce('Color changed');
    }));

    customSwatchBtn?.addEventListener('click', () => colorPicker.click());
    photoBtn?.addEventListener('click', takePhoto);
    autoRotateBtn.addEventListener('click', toggleAutoRotate);
    resetCameraBtn.addEventListener('click', resetCamera);
    fullscreenBtn?.addEventListener('click', toggleFullscreen);
    shareBtn?.addEventListener('click', shareLink);

    animPlayBtn?.addEventListener('click', toggleAnimPlayback);
    animSelect?.addEventListener('change', () => {
        if (animPlaying) {
            modelEl.animationName = animSelect.value;
            modelEl.play({ repetitions: Infinity });
        }
    });

    appearanceToggle?.addEventListener('click', () => {
        setAppearanceOpen(appearanceToggle.getAttribute('aria-expanded') !== 'true');
    });

    appearanceClose?.addEventListener('click', () => setAppearanceOpen(false));

    retryBtn.addEventListener('click', () => {
        hideError();
        showLoading();
        modelEl.setAttribute('src', '');
        requestAnimationFrame(() => modelEl.setAttribute('src', MODEL_SRC));
    });

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
}

function bindModelEvents() {
    modelEl.addEventListener('progress', e => {
        const pct = Math.round(e.detail.totalProgress * 100);
        if (pct > 0 && pct < 100) setLoadingProgress(pct);
    });

    modelEl.addEventListener('load', () => {
        setLoadingProgress(100);
        window.setTimeout(hideLoading, 200);
        hideError();
        applyBodyColor(colorPicker.value);
        updateStatsBestEffort();
        setupAnimations();
        const hasShareParams = ['orbit', 'target', 'exposure', 'color'].some(
            k => new URLSearchParams(location.search).has(k)
        );
        if (hasShareParams) applyShareParams();
        else if (window.scrollY < SCROLL_THRESHOLD_PX) applyDefaultCamera();
        else updateScrollCamera();
    });

    modelEl.addEventListener('error', showError);

    modelEl.addEventListener('model-visibility', e => {
        if (e.detail.visible) hideLoading();
    });
}

// ── Init ──────────────────────────────────────────────────────────────────
function applyStoredPrefs() {
    const prefs    = loadPrefs();
    const color    = prefs.color    ?? DEFAULT_COLOR;
    activeExposure = Number(prefs.exposure ?? DEFAULT_EXPOSURE);
    colorPicker.value = color;
    setActiveSwatch(color);
    setExposure(activeExposure);
}

function init() {
    if (!modelEl) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const urlParam = new URLSearchParams(window.location.search).get('src');
    if (urlParam) modelEl.setAttribute('src', MODEL_SRC);

    applyStoredPrefs();
    bindEvents();
    bindModelEvents();
    setAutoRotate(true);
    resetCameraAttrs(modelEl);

    if (modelEl.loaded) {
        hideLoading();
        applyBodyColor(colorPicker.value);
        updateStatsBestEffort();
        setupAnimations();
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

init();
