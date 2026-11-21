// Mouse and keyboard both drive the same two actions: move a position and mark it. Pointer
// coordinates are converted from CSS pixels into the picture's fixed 600 x 420 coordinate space.
import { VIEW } from './config.js';

const KEY_ACTIONS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  Enter: 'select', ' ': 'select', h: 'hint', H: 'hint',
  n: 'next', N: 'next', r: 'restart', R: 'restart',
};

/** Attach input to the editable canvas and the window; returns a dispose function. */
export function createInput({ canvas, onPick, onMove, onAction }) {
  function localPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  function pointerDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const point = localPoint(event);
    onMove(point.x, point.y);
    onPick(point.x, point.y);
  }

  function pointerMove(event) {
    const point = localPoint(event);
    onMove(point.x, point.y);
  }

  function keyDown(event) {
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    // Let a focused button keep its native Enter/Space activation.
    if (event.target instanceof HTMLButtonElement && (action === 'select')) return;
    event.preventDefault();
    onAction(action);
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('keydown', keyDown);

  return function dispose() {
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('keydown', keyDown);
  };
}
