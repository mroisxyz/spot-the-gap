// The three picture puzzles. Every picture is a list of small drawing instructions ("elements")
// plus a backdrop name; render-scene.js turns that list into pixels. A difference is a short list
// of edits to those elements and a region where a click counts as a find. Nothing here is a photo,
// a sprite sheet or a borrowed character: the art is shapes, gradients and a repeatable grain.
import { TIME_LIMITS } from './config.js';

/** Make one drawable element. x/y are the top-left corner in the 600 x 420 picture. */
function el(kind, id, x, y, w, h, props = {}) {
  return { kind, id, x, y, w, h, hidden: false, flip: false, angle: 0, ...props };
}

/** Make one difference: a label, a clickable region on the copy, and edits to apply to it. */
function diff(id, label, x, y, r, ops) {
  return { id, label, region: { x, y, r }, ops };
}

const set = (id, prop, value) => ({ op: 'set', id, prop, value });
const hide = (id) => ({ op: 'hide', id });
const show = (id) => ({ op: 'show', id });
const shift = (id, dx, dy) => ({ op: 'shift', id, dx, dy });
const scale = (id, factor) => ({ op: 'scale', id, factor });

// ------------------------------------------------------------------ 1. Lantern Canal
function lanternCanal() {
  const windows = [
    el('window', 'win-a1', 30, 170, 12, 16), el('window', 'win-a2', 52, 170, 12, 16),
    el('window', 'win-a3', 74, 170, 12, 16), el('window', 'win-a4', 30, 198, 12, 16),
    el('window', 'win-a5', 52, 198, 12, 16), el('window', 'win-a6', 74, 198, 12, 16),
    el('window', 'win-b1', 118, 154, 10, 14), el('window', 'win-b2', 140, 154, 10, 14),
    el('window', 'win-b3', 118, 178, 10, 14), el('window', 'win-b4', 140, 178, 10, 14),
    el('window', 'win-b5', 118, 202, 10, 14), el('window', 'win-b6', 140, 202, 10, 14),
    el('window', 'win-c1', 524, 164, 11, 14), el('window', 'win-c2', 546, 164, 11, 14),
    el('window', 'win-c3', 524, 192, 11, 14), el('window', 'win-c4', 546, 192, 11, 14),
  ];
  const lanterns = [
    el('lantern', 'lantern-1', 58, 110, 24, 40, { color: '#ffc276' }),
    el('lantern', 'lantern-2', 158, 124, 24, 40, { color: '#ffc276' }),
    el('lantern', 'lantern-3', 288, 130, 24, 40, { color: '#ffc276' }),
    el('lantern', 'lantern-4', 418, 123, 24, 40, { color: '#ffc276' }),
    el('lantern', 'lantern-5', 528, 108, 24, 40, { color: '#ffc276' }),
  ];
  const floaters = [
    el('float-lantern', 'float-1', 54, 366, 26, 16, { color: '#ffcf8a' }),
    el('float-lantern', 'float-2', 200, 350, 26, 16, { color: '#ffcf8a' }),
    el('float-lantern', 'float-3', 404, 372, 26, 16, { color: '#ffcf8a' }),
    el('float-lantern', 'float-4', 546, 346, 26, 16, { color: '#ffcf8a' }),
    el('float-lantern', 'float-extra', 170, 392, 26, 16, { color: '#ffcf8a', hidden: true }),
  ];

  return {
    id: 'canal',
    title: 'Lantern Canal',
    subtitle: 'A quiet waterway, just after dusk',
    timeLimit: TIME_LIMITS[0],
    backdrop: 'canal',
    palette: {
      skyTop: '#0b1030', skyMid: '#2d2550', skyLow: '#79506e',
      waterTop: '#183b57', waterLow: '#071626', stone: '#45485f',
      glow: '#ffd28c', ink: '#0a1024',
    },
    elements: [
      el('starfield', 'stars-a', 18, 14, 170, 84, { count: 30, color: '#f7e8cd' }),
      el('starfield', 'stars-b', 380, 12, 200, 70, { count: 23, color: '#f4e2c8' }),
      el('moon', 'moon', 466, 34, 68, 68, { color: '#fff2d0', accent: '#e0c391' }),
      el('building', 'building-a', 18, 154, 76, 84, { color: '#151d34' }),
      el('building', 'building-b', 108, 138, 58, 100, { color: '#1a2340' }),
      el('building', 'building-c', 516, 150, 66, 88, { color: '#141c33' }),
      ...windows,
      el('wire', 'wire', 0, 96, 600, 34, { color: '#0c1126' }),
      ...lanterns,
      el('bridge', 'bridge', 196, 194, 214, 64, { color: '#4d5069', accent: '#2c3048', count: 9 }),
      el('bridge-lamp', 'bridge-lamp', 228, 198, 12, 18, { color: '#ffd489' }),
      el('boat', 'boat-1', 64, 292, 92, 36, { color: '#624041', accent: '#d9a86e' }),
      el('boat', 'boat-2', 268, 330, 104, 40, { color: '#523943', accent: '#e5b77e' }),
      el('boat', 'boat-3', 466, 286, 84, 34, { color: '#5b423c', accent: '#f0c583' }),
      ...floaters,
      el('reed', 'reed-1', 14, 318, 40, 76, { count: 7, color: '#274b4a' }),
      el('reed', 'reed-2', 560, 306, 40, 84, { count: 8, color: '#244744' }),
      el('reed', 'reed-3', 120, 388, 46, 32, { count: 5, color: '#2b504c' }),
      el('willow', 'willow-l', -6, -10, 120, 150, { color: '#24504a' }),
      el('willow', 'willow-r', 500, -14, 110, 140, { color: '#204743' }),
    ],
    differences: [
      diff('canal-stars', 'A few stars went out', 103, 56, 36, [
        set('stars-a', 'count', 25),
      ]),
      diff('canal-moon', 'The moon grew', 500, 68, 50, [
        scale('moon', 1.22),
      ]),
      diff('canal-lantern', 'A lantern changed colour', 300, 150, 34, [
        set('lantern-3', 'color', '#ff88ad'),
      ]),
      diff('canal-window', 'One window is dark', 123, 209, 27, [
        hide('win-b5'),
      ]),
      diff('canal-lamplight', 'A bridge lamp is missing', 234, 207, 26, [
        hide('bridge-lamp'),
      ]),
      diff('canal-boat', 'A boat drifted away', 508, 303, 46, [
        hide('boat-3'),
      ]),
      diff('canal-floater', 'An extra lantern on the water', 183, 400, 32, [
        show('float-extra'),
      ]),
    ],
  };
}

// ------------------------------------------------------------------ 2. Orchard Station
function orchardStation() {
  return {
    id: 'station',
    title: 'Orchard Station',
    subtitle: 'Last train of a golden afternoon',
    timeLimit: TIME_LIMITS[1],
    backdrop: 'station',
    palette: {
      skyTop: '#f8d8a1', skyMid: '#efac7c', skyLow: '#d98271',
      hill: '#8b9468', platform: '#c3b494', rail: '#6c6056',
      glow: '#ffdca0', ink: '#3b2e2a',
    },
    elements: [
      el('sun', 'sun', 452, 32, 62, 62, { color: '#fff0c3' }),
      el('cloud', 'cloud-1', 40, 42, 120, 34, { color: '#fff1dc' }),
      el('cloud', 'cloud-2', 300, 58, 96, 26, { color: '#ffe8d0' }),
      el('hill', 'hill-far', 0, 116, 600, 82, { color: '#b0a67e' }),
      el('hill', 'hill-near', 0, 148, 600, 64, { color: '#849067' }),
      el('tree', 'tree-a', 16, 116, 78, 92, { count: 6, color: '#55764e' }),
      el('tree', 'tree-b', 112, 108, 80, 100, { count: 7, color: '#668254' }),
      el('tree', 'tree-c', 372, 112, 76, 96, { count: 5, color: '#5b7d50' }),
      el('tree', 'tree-d', 500, 120, 86, 88, { count: 6, color: '#6b8656' }),
      el('station', 'station-house', 176, 104, 176, 104, { color: '#ead9ba', accent: '#9a5d50' }),
      el('station-window', 'win-st-1', 192, 132, 26, 30, { color: '#ffe0a1' }),
      el('station-window', 'win-st-2', 232, 132, 26, 30, { color: '#ffe0a1' }),
      el('station-window', 'win-st-3', 272, 132, 26, 30, { color: '#ffe0a1' }),
      el('station-window', 'win-st-4', 312, 132, 26, 30, { color: '#ffe0a1' }),
      el('door', 'station-door', 246, 162, 28, 46, { color: '#7b5448' }),
      el('sign', 'station-sign', 182, 82, 74, 20, { color: '#7f5a4a', accent: '#f6dfae' }),
      el('clock', 'clock', 246, 86, 40, 40, { color: '#fff2d5', accent: '#5b463c', angle: 0.35 }),
      el('platform', 'platform', 0, 208, 600, 100, { color: '#c3b494', accent: '#a89a7e' }),
      el('rail', 'rail', 0, 330, 600, 90, { color: '#6c6056' }),
      el('safety-line', 'safety-line', 0, 298, 600, 8, { color: '#edc56f' }),
      el('bench', 'bench', 214, 250, 112, 44, { color: '#8b6248' }),
      el('crate-stack', 'crates-a', 42, 248, 72, 84, { count: 3, color: '#b98a58' }),
      el('crate-stack', 'crates-b', 468, 262, 60, 70, { count: 2, color: '#c09260' }),
      el('barrel', 'barrel', 128, 294, 34, 46, { color: '#8b6248' }),
      el('cart', 'cart', 372, 298, 104, 58, { color: '#7c6652' }),
      el('signal', 'signal', 536, 132, 20, 78, { color: '#4a4b46', variant: 'red' }),
      el('lamp-post', 'lamp-a', 18, 196, 16, 102, { color: '#4a4b46' }),
      el('lamp-post', 'lamp-b', 566, 202, 16, 96, { color: '#4a4b46' }),
      el('pigeon', 'pigeon-a', 164, 232, 22, 14, { color: '#5d6675' }),
      el('pigeon', 'pigeon-b', 432, 240, 22, 14, { color: '#646e7d' }),
      el('pigeon', 'pigeon-extra', 330, 386, 22, 14, { color: '#5d6675', hidden: true }),
      el('plant', 'plant', 288, 254, 28, 34, { color: '#557457' }),
    ],
    differences: [
      diff('station-clock', 'The clock hands turned', 266, 106, 32, [
        set('clock', 'angle', 2.55),
      ]),
      diff('station-apples', 'Two apples are gone', 152, 158, 42, [
        set('tree-b', 'count', 5),
      ]),
      diff('station-window', 'A station window went dark', 325, 147, 26, [
        hide('win-st-4'),
      ]),
      diff('station-crates', 'One crate left the stack', 78, 290, 42, [
        set('crates-a', 'count', 2),
      ]),
      diff('station-bench', 'The bench slid along', 270, 272, 64, [
        shift('bench', 20, 0),
      ]),
      diff('station-signal', 'The signal changed aspect', 546, 146, 36, [
        set('signal', 'variant', 'green'),
      ]),
      diff('station-pigeon', 'Another pigeon landed', 341, 393, 30, [
        show('pigeon-extra'),
      ]),
    ],
  };
}

// ------------------------------------------------------------------ 3. Tide Pools
function tidePools() {
  return {
    id: 'tide',
    title: 'Tide Pools',
    subtitle: 'Low water, and the shore left behind',
    timeLimit: TIME_LIMITS[2],
    backdrop: 'tide',
    palette: {
      skyTop: '#203551', skyMid: '#df8f7d', skyLow: '#f6cba1',
      sea: '#54899b', seaDeep: '#2f5d70', sand: '#cbb393',
      glow: '#ffe2ae', ink: '#2b3a42',
    },
    elements: [
      el('sun', 'sun', 408, 104, 54, 54, { color: '#ffe3b0' }),
      el('cloud', 'cloud', 88, 40, 130, 30, { color: '#ffe0cd' }),
      el('headland', 'headland', 0, 126, 600, 52, { color: '#50616b' }),
      el('sea', 'sea', 0, 170, 600, 70, { color: '#54899b', accent: '#a8d0cf' }),
      el('beach', 'beach', 0, 232, 600, 188, { color: '#cbb393' }),
      el('rock', 'rock-a', 54, 252, 168, 88, { color: '#6f6b67' }),
      el('rock', 'rock-b', 316, 238, 176, 84, { color: '#635f5f' }),
      el('rock', 'rock-c', 26, 348, 150, 72, { color: '#77736e' }),
      el('rock', 'rock-d', 466, 316, 124, 104, { color: '#6a6764' }),
      el('pool', 'pool-a', 84, 252, 86, 26, { variant: 'teal' }),
      el('pool', 'pool-b', 348, 240, 96, 28, { variant: 'teal' }),
      el('pool', 'pool-c', 486, 320, 70, 22, { variant: 'teal' }),
      el('pool', 'pool-d', 96, 360, 74, 22, { variant: 'teal' }),
      el('starfish', 'starfish', 78, 286, 36, 36, { arms: 5, color: '#e08a6d' }),
      el('shell', 'shell-a', 214, 304, 22, 18, { color: '#eac7a9' }),
      el('shell', 'shell-b', 418, 332, 24, 20, { color: '#e8b49a' }),
      el('shell', 'shell-c', 158, 392, 20, 16, { color: '#e6c3a8' }),
      el('crab', 'crab-a', 308, 382, 32, 22, { color: '#b85f52' }),
      el('crab', 'crab-b', 466, 292, 26, 18, { color: '#c06a58' }),
      el('seaweed', 'seaweed-a', 178, 320, 42, 62, { color: '#3f6b5c' }),
      el('seaweed', 'seaweed-b', 532, 382, 40, 38, { color: '#3d6659' }),
      el('bird', 'bird-a', 86, 72, 36, 18, { color: '#f5e9d8' }),
      el('bird', 'bird-b', 248, 48, 34, 16, { color: '#f3e6d6' }),
      el('bird', 'bird-c', 522, 88, 32, 16, { color: '#f7ecdd' }),
      el('umbrella', 'umbrella', 462, 194, 100, 64, { count: 6, color: '#e2726d', accent: '#f7e4c2' }),
      el('buoy', 'buoy', 268, 196, 22, 24, { color: '#e8705d' }),
      el('driftwood', 'driftwood', 222, 366, 76, 18, { color: '#8b7b6c' }),
      el('pebbles', 'pebbles', 330, 350, 80, 26, { count: 10, color: '#a99c8d' }),
    ],
    differences: [
      diff('tide-shell', 'A shell changed shade', 430, 342, 30, [
        set('shell-b', 'color', '#d9a9c2'),
      ]),
      diff('tide-starfish', 'The starfish lost an arm', 96, 304, 32, [
        set('starfish', 'arms', 4),
      ]),
      diff('tide-seaweed', 'A strand of weed moved', 199, 351, 40, [
        shift('seaweed-a', 14, -8),
      ]),
      diff('tide-bird', 'A gull turned around', 265, 56, 32, [
        set('bird-b', 'flip', true),
      ]),
      diff('tide-pool', 'One pool holds a different sky', 396, 254, 50, [
        set('pool-b', 'variant', 'indigo'),
      ]),
      diff('tide-crab', 'A crab scuttled off', 479, 301, 30, [
        hide('crab-b'),
      ]),
      diff('tide-umbrella', 'One more stripe in the shade', 512, 226, 54, [
        set('umbrella', 'count', 7),
      ]),
    ],
  };
}

/** The three scenes in play order, each built fresh so no run can mutate another's data. */
export function createSceneLibrary() {
  const scenes = [lanternCanal(), orchardStation(), tidePools()];
  scenes.forEach((scene, index) => {
    // Stable per-scene art seed: the same grain, rocks and stars appear in both panels.
    scene.seed = 20261121 + index * 7919;
  });
  return scenes;
}
