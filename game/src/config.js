// Shared numbers for the puzzle. The canvas has a fixed logical size; CSS is free to scale it,
// so every hit test, marker and scene coordinate lives in this one small space.
export const VIEW = Object.freeze({ width: 600, height: 420 });

export const DIFFERENCES_PER_SCENE = 7;
export const HINTS_PER_SCENE = 2;
export const CURSOR_STEP = 22;

/** Seconds allowed per scene. Each scene is a little tighter than the last. */
export const TIME_LIMITS = Object.freeze([125, 115, 105]);

/** How long a hint ring and the little celebration effects stay on screen, in seconds. */
export const HINT_SECONDS = 2.6;
export const MARK_SECONDS = 0.75;
export const MISS_SECONDS = 0.6;

/** Radius, in logical pixels, around a change where a click counts as a find. */
export const HIT_RADIUS = 30;

/** The fixed seed: a scene is drawn byte-for-byte the same on both panels and on every run. */
export const SCENE_SEED = 20261121;
