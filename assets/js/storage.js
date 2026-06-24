const KEY = 'jet3d-prefs';

export function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}

export function savePrefs(updates) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...updates })); } catch {}
}
