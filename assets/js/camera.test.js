import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lerp, ease, buildScrollCamera } from './camera.js';

const KEYFRAMES = [
    { t: 0.0,  orbit: '0deg 90deg 100%',  target: '0m 0m 0m', exposure: 1.0 },
    { t: 0.5,  orbit: '45deg 75deg 80%',  target: '0m 0.1m 0m', exposure: 1.5 },
    { t: 1.0,  orbit: '90deg 60deg 60%',  target: '0m 0.2m 0m', exposure: 2.0 },
];

describe('lerp', () => {
    it('returns a at t=0', () => assert.equal(lerp(0, 100, 0), 0));
    it('returns b at t=1', () => assert.equal(lerp(0, 100, 1), 100));
    it('returns midpoint at t=0.5', () => assert.equal(lerp(0, 100, 0.5), 50));
    it('handles negative values', () => assert.equal(lerp(-10, 10, 0.5), 0));
});

describe('ease (cubic bezier)', () => {
    it('returns 0 at t=0', () => assert.equal(ease(0), 0));
    it('returns 1 at t=1', () => assert.equal(ease(1), 1));
    it('returns 0.5 at t=0.5 (symmetric)', () => assert.equal(ease(0.5), 0.5));
    it('is slower than linear at t=0.25', () => assert.ok(ease(0.25) < 0.25));
    it('is faster than linear at t=0.75', () => assert.ok(ease(0.75) > 0.75));
});

describe('buildScrollCamera', () => {
    it('returns first keyframe state at progress=0', () => {
        const cam = buildScrollCamera(0, KEYFRAMES);
        assert.match(cam.orbit, /^0\.0deg/);
        assert.ok(Math.abs(cam.exposure - 1.0) < 0.01);
    });

    it('returns last keyframe state at progress=1', () => {
        const cam = buildScrollCamera(1, KEYFRAMES);
        assert.match(cam.orbit, /^90\.0deg/);
        assert.ok(Math.abs(cam.exposure - 2.0) < 0.01);
    });

    it('returns interpolated state at progress=0.5', () => {
        const cam = buildScrollCamera(0.5, KEYFRAMES);
        assert.ok(Math.abs(cam.exposure - 1.5) < 0.01);
    });

    it('exposure is within [1.0, 2.0] for any progress in [0,1]', () => {
        for (let i = 0; i <= 20; i++) {
            const cam = buildScrollCamera(i / 20, KEYFRAMES);
            assert.ok(cam.exposure >= 1.0 && cam.exposure <= 2.0,
                `exposure ${cam.exposure} out of range at progress=${i/20}`);
        }
    });

    it('orbit string matches expected format', () => {
        const cam = buildScrollCamera(0.25, KEYFRAMES);
        assert.match(cam.orbit, /^\d+\.\ddeg \d+\.\ddeg \d+\.\d%$/);
    });

    it('target string matches expected format', () => {
        const cam = buildScrollCamera(0.25, KEYFRAMES);
        assert.match(cam.target, /^-?\d+\.\d{2}m -?\d+\.\d{2}m -?\d+\.\d{2}m$/);
    });
});
