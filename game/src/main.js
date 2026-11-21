// Boot: build the three scenes, wire input, HUD and sound to one game controller, then run a
// single animation loop that paints both pictures every frame. No other file owns the loop.
import { createSceneLibrary } from './scene-library.js';
import { prepareCanvas, renderPanel } from './render-scene.js';
import { createGame } from './game-controller.js';
import { createInput } from './input-handler.js';
import { createScoreboard } from './scoreboard.js';
import { createSound } from './sound.js';
import { readDemoOptions } from './demo.js';

export function boot() {
  const scenes = createSceneLibrary();
  const leftCanvas = document.getElementById('left-canvas');
  const rightCanvas = document.getElementById('right-canvas');
  const leftCtx = prepareCanvas(leftCanvas);
  const rightCtx = prepareCanvas(rightCanvas);
  const board = createScoreboard();
  const sound = createSound();
  const demo = readDemoOptions(scenes);

  let game;
  function onEvent(type, payload) {
    switch (type) {
      case 'reset':
        board.setScene(payload.scene, Math.max(0, scenes.indexOf(payload.scene)), scenes.length);
        board.hideResults();
        board.announce(`${payload.scene.title}. Seven differences to find.`);
        board.toast('Look closely — then click the right-hand picture.');
        break;
      case 'find':
        sound.play('find');
        board.toast(`Found it — ${payload.target.label} (${payload.found}/${payload.total})`, 'good');
        board.announce(`Found: ${payload.target.label}. ${payload.total - payload.found} left.`);
        break;
      case 'miss':
        sound.play('miss');
        board.toast('Not quite — take another look.', 'bad');
        break;
      case 'hint':
        sound.play('hint');
        board.toast(`Hint — ${payload.target.label}. ${payload.hintsLeft} left.`);
        board.announce(`Hint: ${payload.target.label}.`);
        break;
      case 'tick':
        sound.play('tick');
        break;
      case 'complete':
        sound.play('complete');
        if (game) board.showResults({ ...payload, scene: game.state.scene, isLast: game.isLast });
        board.announce(payload.outcome === 'clear'
          ? 'Scene cleared. All seven differences found.'
          : 'Time is up. Press R to retry or N for the next scene.');
        break;
      default:
        break;
    }
  }

  game = createGame({ scenes, startIndex: demo.startIndex, onEvent });
  game.goTo(demo.startIndex, demo.options); // apply ?scene / ?demo / ?hint staging

  createInput({
    canvas: rightCanvas,
    onPick: (x, y) => game.pick(x, y),
    onMove: (x, y) => game.setCursor(x, y),
    onAction: (action) => {
      if (action === 'left' || action === 'right' || action === 'up' || action === 'down') {
        game.moveCursor(action);
      } else if (action === 'select') {
        game.pick(game.state.cursor.x, game.state.cursor.y);
      } else if (action === 'hint') {
        game.useHint();
      } else if (action === 'next') {
        game.next();
      } else if (action === 'restart') {
        game.restart();
      }
    },
  });

  board.refs.hintButton.addEventListener('click', () => game.useHint());
  board.refs.resultsNext.addEventListener('click', () => {
    if (game.isLast) game.restart(); else game.next();
  });
  document.getElementById('results-retry').addEventListener('click', () => game.restart());
  document.getElementById('next-btn').addEventListener('click', () => game.next());
  document.getElementById('restart-btn').addEventListener('click', () => game.restart());

  let last = performance.now() / 1000;
  let firstFrame = true;
  function frame(timestamp) {
    requestAnimationFrame(frame);
    const now = timestamp / 1000;
    const dt = Math.min(0.25, Math.max(0, now - last));
    last = now;
    game.tick(dt, now);
    board.update(game.state);
    renderPanel(leftCtx, game.state.scene, game.state.leftElements, game.getView('left'));
    renderPanel(rightCtx, game.state.scene, game.state.rightElements, game.getView('right'));
    if (firstFrame) {
      firstFrame = false;
      window.__spotReady = true;
    }
  }
  requestAnimationFrame(frame);

  // Handy for a person poking around in devtools; the game itself never depends on it.
  window.__spotGame = game;
}

boot();
