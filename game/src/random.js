// A tiny seeded PRNG (mulberry32). All picture detail is generated from integers derived from
// SCENE_SEED and an element index, so the reference and the edited copy are pixel-identical
// except where a difference deliberately changes something.

/** Return a function producing floats in [0, 1) from one 32-bit seed. */
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A repeatable stream for one element: the same element gets the same details in both panels. */
export function elementRandom(sceneSeed, elementIndex) {
  return makeRandom((sceneSeed ^ Math.imul(elementIndex + 1, 0x9e3779b1)) >>> 0);
}

/** Random float in [min, max). */
export function between(random, min, max) {
  return min + random() * (max - min);
}

/** Random integer in [min, max]. */
export function integer(random, min, max) {
  return Math.floor(min + random() * (max - min + 1));
}
