// Optional screenshot staging, read from the URL once at boot. Normal play needs none of this.
// ?scene=1|2|3  picks the starting scene (1-based, as a person would count).
// ?demo=play    marks three spread-out differences and adds two misses, so found markers show.
// ?hint=1       leaves one hint glowing on a still-unfound spot. All three combine freely.
import { demoFindIndices } from './difference-planner.js';

export function readDemoOptions(scenes) {
  const params = new URLSearchParams(window.location.search);
  const requestedScene = Number.parseInt(params.get('scene') ?? '', 10);
  const startIndex = Number.isInteger(requestedScene) && requestedScene >= 1 && requestedScene <= scenes.length
    ? requestedScene - 1 : 0;
  const options = {};

  if (params.get('demo') === 'play') {
    options.autoFind = demoFindIndices(7);
    options.misses = 2;
    // A partially drained clock makes the pressure visible in a still frame.
    options.timeLeft = Math.round(scenes[startIndex].timeLimit * 0.38);
    options.cursor = { x: 358, y: 178 };
  }
  if (params.get('hint') === '1') {
    const marked = new Set(options.autoFind ?? []);
    let firstUnfound = 0;
    for (let i = 0; i < 7; i += 1) {
      if (!marked.has(i)) { firstUnfound = i; break; }
    }
    options.hintIndex = firstUnfound;
    options.hintSeconds = 45; // long enough to photograph the hint without racing the clock
  }
  return { startIndex, options };
}
