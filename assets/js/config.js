export const DEFAULT_ORBIT    = '35deg 75deg 110%';
export const DEFAULT_TARGET   = '0m 0.2m 0m';
export const DEFAULT_EXPOSURE = 1.4;
export const DEFAULT_COLOR    = '#202b3f';

export const PRESET_ANIM_MS              = 950;
export const PRESET_AUTOROTATE_RESTORE_MS = 980;
export const SCROLL_AUTOROTATE_RESTORE_MS = 1600;
export const SCROLL_THRESHOLD_PX         = 48;

export const PRESETS = {
    cinematic: { orbit: '88deg 65deg 60%',  target: '0m 0.26m 0m', exposure: 1.9  },
    top:       { orbit: '0deg 80deg 135%',  target: '0m 0.2m 0m',  exposure: 1.25 },
    engine:    { orbit: '145deg 70deg 85%', target: '0m 0.18m 0m', exposure: 1.6  },
    pilot:     { orbit: '35deg 68deg 80%',  target: '0m 0.22m 0m', exposure: 1.7  },
    landing:   { orbit: '95deg 60deg 70%',  target: '0m 0.12m 0m', exposure: 1.45 },
};

export const SCROLL_KEYFRAMES = [
    { t: 0.0,  orbit: DEFAULT_ORBIT,       target: DEFAULT_TARGET, exposure: DEFAULT_EXPOSURE },
    { t: 0.25, orbit: '35deg 75deg 110%',  target: '0m 0.2m 0m',  exposure: 1.4  },
    { t: 0.5,  orbit: '55deg 75deg 95%',   target: '0m 0.2m 0m',  exposure: 1.55 },
    { t: 0.75, orbit: '70deg 68deg 75%',   target: '0m 0.24m 0m', exposure: 1.7  },
    { t: 1.0,  orbit: '88deg 65deg 60%',   target: '0m 0.26m 0m', exposure: 1.9  },
];
