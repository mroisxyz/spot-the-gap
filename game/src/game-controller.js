// The rules of one hunt: what a click means, how hints and misses work, the clock, and moving
// between scenes. It owns plain state only; rendering and DOM updates are other modules' jobs.
import {
  VIEW, HINTS_PER_SCENE, HINT_SECONDS, CURSOR_STEP, HIT_RADIUS, MARK_SECONDS, MISS_SECONDS,
} from './config.js';
import { planEditedPicture, nearestTarget } from './difference-planner.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createGame({ scenes, startIndex = 0, onEvent = () => {} }) {
  const state = {
    sceneIndex: startIndex,
    scene: null,
    targets: [],
    leftElements: [],
    rightElements: [],
    found: new Set(),
    misses: 0,
    hintsLeft: HINTS_PER_SCENE,
    timeLeft: 0,
    now: 0,
    hint: null,
    effects: [],
    cursor: { x: VIEW.width / 2, y: VIEW.height / 2, visible: true },
    completed: false,
    outcome: null,
    lastTickSecond: -1,
  };

  function loadScene(options = {}) {
    const scene = scenes[state.sceneIndex];
    const planned = planEditedPicture(scene);
    state.scene = scene;
    state.leftElements = scene.elements;
    state.rightElements = planned.elements;
    state.targets = planned.targets;
    state.found = new Set();
    state.misses = 0;
    state.hintsLeft = HINTS_PER_SCENE;
    state.timeLeft = options.timeLeft ?? scene.timeLimit;
    state.now = performance.now() / 1000;
    state.hint = null;
    state.effects = [];
    state.cursor = { x: VIEW.width / 2, y: VIEW.height / 2, visible: true };
    state.completed = false;
    state.outcome = null;
    state.lastTickSecond = -1;

    // Screenshot staging: mark a few changes, spend a hint, and leave the rest unfound.
    for (const index of options.autoFind ?? []) {
      if (index >= 0 && index < state.targets.length) state.found.add(index);
    }
    if (options.misses) state.misses = options.misses;
    if (Number.isInteger(options.hintIndex) && state.found.size < state.targets.length) {
      const index = options.hintIndex;
      if (!state.found.has(index)) {
        state.hintsLeft = Math.max(0, HINTS_PER_SCENE - 1);
        state.hint = {
          region: { ...state.targets[index].region },
          start: state.now,
          until: state.now + (options.hintSeconds ?? HINT_SECONDS),
        };
      }
    }
    if (options.cursor) {
      state.cursor.x = clamp(options.cursor.x, 8, VIEW.width - 8);
      state.cursor.y = clamp(options.cursor.y, 8, VIEW.height - 8);
    }
    onEvent('reset', { scene });
  }

  function complete(outcome) {
    if (state.completed) return;
    state.completed = true;
    state.outcome = outcome;
    onEvent('complete', {
      outcome,
      found: state.found.size,
      total: state.targets.length,
      misses: state.misses,
      timeLeft: state.timeLeft,
    });
  }

  function pick(x, y) {
    if (state.completed) return null;
    const index = nearestTarget(state.targets, state.found, x, y, HIT_RADIUS);
    if (index === -1) {
      state.misses += 1;
      state.effects.push({ type: 'miss', x, y, start: state.now });
      onEvent('miss', { x, y, misses: state.misses });
      return { type: 'miss' };
    }
    const target = state.targets[index];
    state.found.add(index);
    state.effects.push({ type: 'find', x: target.region.x, y: target.region.y, start: state.now, seed: index });
    onEvent('find', { index, target, found: state.found.size, total: state.targets.length });
    if (state.found.size === state.targets.length) complete('clear');
    return { type: 'find', target };
  }

  function useHint() {
    if (state.completed || state.hintsLeft <= 0) return null;
    let index = -1;
    for (let i = 0; i < state.targets.length; i += 1) {
      if (!state.found.has(i)) { index = i; break; }
    }
    if (index === -1) return null;
    const target = state.targets[index];
    state.hintsLeft -= 1;
    state.hint = {
      region: { ...target.region },
      start: state.now,
      until: state.now + HINT_SECONDS,
    };
    onEvent('hint', { target, hintsLeft: state.hintsLeft });
    return target;
  }

  function tick(dt, now) {
    state.now = now;
    state.effects = state.effects.filter((effect) =>
      now - effect.start < (effect.type === 'miss' ? MISS_SECONDS : MARK_SECONDS));
    if (state.hint && now > state.hint.until) state.hint = null;
    if (state.completed) return;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    const second = Math.ceil(state.timeLeft);
    if (second <= 10 && second !== state.lastTickSecond && second > 0) {
      state.lastTickSecond = second;
      onEvent('tick', { seconds: second });
    }
    if (state.timeLeft === 0) complete('timeout');
  }

  function moveCursor(direction) {
    const step = direction === 'left' ? [-CURSOR_STEP, 0]
      : direction === 'right' ? [CURSOR_STEP, 0]
        : direction === 'up' ? [0, -CURSOR_STEP] : [0, CURSOR_STEP];
    state.cursor.x = clamp(state.cursor.x + step[0], 8, VIEW.width - 8);
    state.cursor.y = clamp(state.cursor.y + step[1], 8, VIEW.height - 8);
    state.cursor.visible = true;
  }

  function setCursor(x, y) {
    state.cursor.x = clamp(x, 8, VIEW.width - 8);
    state.cursor.y = clamp(y, 8, VIEW.height - 8);
    state.cursor.visible = true;
  }

  function goTo(index, options) {
    state.sceneIndex = ((index % scenes.length) + scenes.length) % scenes.length;
    loadScene(options);
  }

  function getView(side) {
    return {
      side,
      targets: state.targets,
      found: state.found,
      hint: state.hint,
      effects: state.effects,
      cursor: state.cursor,
      now: state.now,
      completed: state.completed,
    };
  }

  loadScene();

  return {
    state,
    pick,
    useHint,
    tick,
    moveCursor,
    setCursor,
    goTo,
    next: () => goTo(state.sceneIndex + 1),
    restart: () => goTo(state.sceneIndex),
    getView,
    get isLast() { return state.sceneIndex === scenes.length - 1; },
  };
}
