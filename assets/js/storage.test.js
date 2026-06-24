import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage stub for Node environment
const store = {};
globalThis.localStorage = {
    getItem:  (k) => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
};

const { loadPrefs, savePrefs } = await import('./storage.js');

describe('loadPrefs', () => {
    beforeEach(() => { delete store['jet3d-prefs']; });

    it('returns empty object when nothing stored', () => {
        assert.deepEqual(loadPrefs(), {});
    });

    it('returns stored prefs', () => {
        store['jet3d-prefs'] = JSON.stringify({ color: '#ff0000', exposure: 1.8 });
        assert.deepEqual(loadPrefs(), { color: '#ff0000', exposure: 1.8 });
    });

    it('returns empty object on corrupted JSON', () => {
        store['jet3d-prefs'] = '{bad json}}}';
        assert.deepEqual(loadPrefs(), {});
    });
});

describe('savePrefs', () => {
    beforeEach(() => { delete store['jet3d-prefs']; });

    it('saves new prefs', () => {
        savePrefs({ color: '#abc123' });
        assert.equal(loadPrefs().color, '#abc123');
    });

    it('merges with existing prefs', () => {
        savePrefs({ color: '#abc123' });
        savePrefs({ exposure: 1.6 });
        const prefs = loadPrefs();
        assert.equal(prefs.color, '#abc123');
        assert.equal(prefs.exposure, 1.6);
    });

    it('overwrites existing key', () => {
        savePrefs({ color: '#111111' });
        savePrefs({ color: '#ffffff' });
        assert.equal(loadPrefs().color, '#ffffff');
    });
});
