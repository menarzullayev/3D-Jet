import { DEFAULT_ORBIT, DEFAULT_TARGET, DEFAULT_EXPOSURE, PRESET_ANIM_MS } from './config.js';

export function lerp(a, b, t) { return a + (b - a) * t; }

export function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function parseOrbit(s) {
    const [a, b, c] = String(s).trim().split(/\s+/).map(parseFloat);
    return { yaw: a, pitch: b, radius: c };
}

function parseTarget(s) {
    const [x, y, z] = String(s).trim().split(/\s+/).map(parseFloat);
    return { x, y, z };
}

function fmtOrbit({ yaw, pitch, radius }) {
    return `${yaw.toFixed(1)}deg ${pitch.toFixed(1)}deg ${radius.toFixed(1)}%`;
}

function fmtTarget({ x, y, z }) {
    return `${x.toFixed(2)}m ${y.toFixed(2)}m ${z.toFixed(2)}m`;
}

export function animateToCamera(el, { orbit, target, exposure, durationMs = PRESET_ANIM_MS }, onExposure) {
    if (!orbit || !target) return;

    const fromO = parseOrbit(el.cameraOrbit || DEFAULT_ORBIT);
    const toO   = parseOrbit(orbit);
    const fromT = parseTarget(el.cameraTarget || DEFAULT_TARGET);
    const toT   = parseTarget(target);
    const fromE = Number(el.exposure ?? DEFAULT_EXPOSURE);
    const toE   = Number(exposure    ?? DEFAULT_EXPOSURE);
    const start = performance.now();

    function tick(now) {
        const raw = Math.min(Math.max((now - start) / durationMs, 0), 1);
        const e   = ease(raw);

        el.cameraOrbit  = fmtOrbit({
            yaw:    lerp(fromO.yaw,    toO.yaw,    e),
            pitch:  lerp(fromO.pitch,  toO.pitch,  e),
            radius: lerp(fromO.radius, toO.radius, e),
        });
        el.cameraTarget = fmtTarget({
            x: lerp(fromT.x, toT.x, e),
            y: lerp(fromT.y, toT.y, e),
            z: lerp(fromT.z, toT.z, e),
        });
        onExposure?.(lerp(fromE, toE, e));

        if (raw < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

export function resetCameraAttrs(el) {
    el.cameraOrbit  = DEFAULT_ORBIT;
    el.cameraTarget = DEFAULT_TARGET;
}

export function buildScrollCamera(progress, keyframes) {
    let i = 0;
    for (; i < keyframes.length - 1; i++) {
        if (progress >= keyframes[i].t && progress <= keyframes[i + 1].t) break;
    }
    const a  = keyframes[i];
    const b  = keyframes[i + 1] ?? keyframes[keyframes.length - 1];
    const t  = ease(Math.min(Math.max((progress - a.t) / (b.t - a.t || 1), 0), 1));

    const ao = parseOrbit(a.orbit);
    const bo = parseOrbit(b.orbit);
    const at = parseTarget(a.target);
    const bt = parseTarget(b.target);

    return {
        orbit:    fmtOrbit({  yaw: lerp(ao.yaw, bo.yaw, t), pitch: lerp(ao.pitch, bo.pitch, t), radius: lerp(ao.radius, bo.radius, t) }),
        target:   fmtTarget({ x: lerp(at.x, bt.x, t), y: lerp(at.y, bt.y, t), z: lerp(at.z, bt.z, t) }),
        exposure: lerp(a.exposure, b.exposure, t),
    };
}
