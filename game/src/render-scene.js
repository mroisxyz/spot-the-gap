// All of the picture-making lives here: a backdrop painter per scene, one small drawing routine
// per element kind, a paper-grain pass, and the overlay marks drawn on top of both panels.
// Every random detail comes from a fresh seeded stream, so left and right agree pixel for pixel.
import { VIEW, MISS_SECONDS, MARK_SECONDS } from './config.js';
import { makeRandom, elementRandom, between, integer } from './random.js';

/** Match the backing store to the device while keeping all drawing in logical coordinates. */
export function prepareCanvas(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(VIEW.width * ratio);
  canvas.height = Math.round(VIEW.height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

// ---------------------------------------------------------------- small path helpers
function roundRect(ctx, x, y, w, h, r = 4) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function halo(ctx, x, y, r, color, strength = 0.5) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.42, color.replace(/[\d.]+\)$/, `${strength})`));
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function strokeGlow(ctx, color, width, blur) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

// ---------------------------------------------------------------- backdrops
function canalBackdrop(ctx, palette, seed) {
  const random = makeRandom(seed ^ 0x1a2b3c4d);
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.55, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, 240);

  halo(ctx, 502, 190, 170, 'rgba(255,186,142,0.22)', 0.1);
  // Far rooftops, kept darker than the building elements in front of them.
  let x = 0;
  while (x < VIEW.width) {
    const width = between(random, 22, 52);
    const top = between(random, 172, 214);
    ctx.fillStyle = random() > 0.5 ? '#1a1e38' : '#161b32';
    ctx.fillRect(x, top, width, 240 - top);
    if (random() > 0.6) {
      ctx.fillStyle = 'rgba(255,203,133,0.24)';
      ctx.fillRect(x + width * 0.3, top + 8, 3, 4);
    }
    x += width + between(random, 1, 5);
  }

  const water = ctx.createLinearGradient(0, 236, 0, VIEW.height);
  water.addColorStop(0, palette.waterTop);
  water.addColorStop(1, palette.waterLow);
  ctx.fillStyle = water;
  ctx.fillRect(0, 236, VIEW.width, VIEW.height - 236);

  ctx.fillStyle = 'rgba(255,214,158,0.10)';
  for (let i = 0; i < 130; i += 1) {
    const wx = between(random, 0, VIEW.width);
    const wy = between(random, 240, VIEW.height);
    const length = between(random, 4, 26) * (1 + (wy - 240) / 240);
    ctx.fillRect(wx, wy, length, between(random, 0.6, 1.6));
  }
  // A warm shimmering column under the moon and smaller ones under the hanging lanterns.
  for (const column of [500, 70, 170, 300, 430, 540]) {
    for (let i = 0; i < 26; i += 1) {
      const wy = between(random, 242, VIEW.height);
      const spread = (wy - 240) * 0.22 + 5;
      const length = between(random, 5, 22);
      ctx.fillStyle = `rgba(255,209,145,${between(random, 0.05, 0.22).toFixed(3)})`;
      ctx.fillRect(column + between(random, -spread, spread), wy, length, 1.2);
    }
  }
  ctx.fillStyle = 'rgba(8,16,28,0.28)';
  ctx.fillRect(0, 236, VIEW.width, 3);
}

function stationBackdrop(ctx, palette, seed) {
  const random = makeRandom(seed ^ 0x2b3c4d5e);
  const sky = ctx.createLinearGradient(0, 0, 0, 220);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.6, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  halo(ctx, 482, 64, 150, 'rgba(255,238,186,0.32)', 0.12);
  // Haze above the hills, and a few slow birds far away.
  ctx.fillStyle = 'rgba(255,231,198,0.16)';
  ctx.fillRect(0, 118, VIEW.width, 24);
  for (let i = 0; i < 5; i += 1) {
    const bx = between(random, 60, 560);
    const by = between(random, 36, 92);
    ctx.strokeStyle = 'rgba(92,73,65,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - 5, by);
    ctx.quadraticCurveTo(bx, by - 3, bx + 2, by);
    ctx.quadraticCurveTo(bx + 5, by - 3, bx + 9, by);
    ctx.stroke();
  }
}

function tideBackdrop(ctx, palette, seed) {
  const random = makeRandom(seed ^ 0x3c4d5e6f);
  const sky = ctx.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.58, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  halo(ctx, 434, 132, 150, 'rgba(255,215,170,0.38)', 0.12);
  ctx.fillStyle = 'rgba(255,233,209,0.13)';
  ctx.fillRect(0, 156, VIEW.width, 20);
  for (let i = 0; i < 60; i += 1) {
    const px = between(random, 0, VIEW.width);
    const py = between(random, 236, VIEW.height);
    ellipse(ctx, px, py, between(random, 0.5, 1.5), between(random, 0.4, 1), 'rgba(94,74,58,0.14)');
  }
}

const BACKDROPS = { canal: canalBackdrop, station: stationBackdrop, tide: tideBackdrop };

// ---------------------------------------------------------------- element painters
function paintStarfield(ctx, e, random) {
  for (let i = 0; i < e.count; i += 1) {
    const x = between(random, -e.w / 2, e.w / 2);
    const y = between(random, -e.h / 2, e.h / 2);
    const radius = between(random, 0.5, 1.6);
    ctx.globalAlpha = between(random, 0.35, 1);
    disc(ctx, x, y, radius, e.color);
    if (i % 6 === 0) {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function paintMoon(ctx, e, random) {
  const r = Math.min(e.w, e.h) / 2;
  halo(ctx, 0, 0, r * 2.5, 'rgba(255,236,190,0.46)', 0.16);
  disc(ctx, 0, 0, r, e.color);
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 4; i += 1) {
    const angle = between(random, 0, Math.PI * 2);
    const distance = between(random, 0, r * 0.55);
    disc(ctx, Math.cos(angle) * distance, Math.sin(angle) * distance, between(random, 2, 6), e.accent);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, -2.5, -0.7);
  ctx.stroke();
}

function paintBuilding(ctx, e, random) {
  roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 2);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, 5);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${between(random, 0.015, 0.045).toFixed(3)})`;
    ctx.fillRect(-e.w / 2 + between(random, 3, e.w - 6), -e.h / 2 + 8, 1, e.h - 12);
  }
  if (e.w > 60) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.w * 0.28, -e.h / 2);
    ctx.lineTo(e.w * 0.28, -e.h / 2 - 14);
    ctx.stroke();
  }
}

function paintWindow(ctx, e, random) {
  halo(ctx, 0, 0, Math.max(e.w, e.h) * 1.15, 'rgba(255,205,131,0.36)', 0.1);
  roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 2);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillRect(-e.w / 2 + 1, -e.h / 2 + 1, e.w - 2, 2);
  ctx.strokeStyle = 'rgba(40,28,30,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -e.h / 2);
  ctx.lineTo(0, e.h / 2);
  if (e.h > 20) { ctx.moveTo(-e.w / 2, 0); ctx.lineTo(e.w / 2, 0); }
  ctx.stroke();
  ctx.globalAlpha = between(random, 0.05, 0.16);
  ctx.fillStyle = '#8c5b3a';
  ctx.fillRect(-e.w / 2 + 1, e.h / 2 - 3, e.w - 2, 2);
  ctx.globalAlpha = 1;
}

function paintWire(ctx, e) {
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-e.w / 2, -e.h / 2 + 12);
  ctx.quadraticCurveTo(0, e.h / 2 + 6, e.w / 2, -e.h / 2 + 12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,180,0.10)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function paintLantern(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.strokeStyle = 'rgba(12,16,32,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 - 7);
  ctx.lineTo(0, -h / 2 + 5);
  ctx.stroke();
  halo(ctx, 0, 2, w * 2.3, 'rgba(255,183,109,0.48)', 0.16);
  ctx.fillStyle = '#3b2c33';
  ctx.fillRect(-w * 0.32, -h / 2 + 3, w * 0.64, 4);
  const body = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  body.addColorStop(0, '#8e4c46');
  body.addColorStop(0.5, e.color);
  body.addColorStop(1, '#a75a4d');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -h * 0.3);
  ctx.quadraticCurveTo(-w * 0.58, 0, -w * 0.3, h * 0.3);
  ctx.quadraticCurveTo(0, h * 0.42, w * 0.3, h * 0.3);
  ctx.quadraticCurveTo(w * 0.58, 0, w * 0.36, -h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(91,48,44,0.55)';
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.16, -h * 0.28);
    ctx.quadraticCurveTo(i * w * 0.24, 0, i * w * 0.16, h * 0.28);
    ctx.stroke();
  }
  ctx.fillStyle = '#3b2c33';
  ctx.fillRect(-w * 0.22, h * 0.3, w * 0.44, 3);
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 1.6;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 3, h * 0.36);
    ctx.lineTo(i * 3 + between(random, -1, 1), h * 0.52);
    ctx.stroke();
  }
}

function paintBridge(ctx, e, random) {
  ctx.save();
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-e.w / 2, e.h / 2);
  ctx.quadraticCurveTo(0, -e.h * 0.72, e.w / 2, e.h / 2);
  ctx.stroke();
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 9;
  ctx.stroke();
  roundRect(ctx, -e.w / 2 - 6, -e.h / 2, e.w + 12, 11, 3);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-e.w / 2 - 6, -e.h / 2, e.w + 12, 2);
  for (let i = 0; i < e.count; i += 1) {
    const px = -e.w / 2 + (e.w / (e.count - 1)) * i;
    ctx.fillStyle = e.color;
    ctx.fillRect(px - 1.5, -e.h / 2 - 10, 3, 11);
  }
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-e.w / 2 - 6, -e.h / 2 - 10);
  ctx.lineTo(e.w / 2 + 6, -e.h / 2 - 10);
  ctx.stroke();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 18; i += 1) {
    const px = between(random, -e.w / 2, e.w / 2);
    const py = between(random, -e.h / 2 + 12, e.h / 2 - 4);
    ctx.fillStyle = '#11152a';
    ctx.fillRect(px, py, between(random, 2, 5), 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function paintBridgeLamp(ctx, e) {
  ctx.strokeStyle = '#22263d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, e.h / 2);
  ctx.lineTo(0, -e.h * 0.15);
  ctx.stroke();
  halo(ctx, 0, -e.h * 0.25, 22, 'rgba(255,208,128,0.55)', 0.14);
  disc(ctx, 0, -e.h * 0.25, 4.2, e.color);
}

function paintBoat(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.globalAlpha = 0.3;
  ellipse(ctx, 0, h * 0.52, w * 0.5, h * 0.16, '#050d19');
  ctx.globalAlpha = 1;
  polygon(ctx, [
    [-w / 2, 0], [w / 2, 0], [w * 0.36, h * 0.5], [-w * 0.4, h * 0.46],
  ], e.color);
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, h * 0.16);
  ctx.lineTo(w * 0.3, h * 0.18);
  ctx.stroke();
  // A small cabin and a sail make the silhouette easy to study.
  roundRect(ctx, -w * 0.18, -h * 0.28, w * 0.3, h * 0.28, 2);
  ctx.fillStyle = '#d7bd95';
  ctx.fill();
  ctx.fillStyle = e.accent;
  ctx.fillRect(-w * 0.18, -h * 0.13, w * 0.3, 2);
  ctx.strokeStyle = '#2b2230';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.16, -h * 0.1);
  ctx.lineTo(w * 0.16, -h * 0.55);
  ctx.stroke();
  polygon(ctx, [
    [w * 0.18, -h * 0.53], [w * 0.43, -h * 0.13], [w * 0.18, -h * 0.13],
  ], between(random, 0, 1) > 0.5 ? '#efd8ad' : '#e9cda2');
  halo(ctx, -w * 0.36, -h * 0.12, 15, 'rgba(255,192,110,0.55)', 0.12);
  disc(ctx, -w * 0.36, -h * 0.12, 2.6, '#ffd89b');
}

function paintFloatLantern(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.strokeStyle = 'rgba(187,214,220,0.32)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, h * 0.2, w * (0.6 + i * 0.28), h * (0.16 + i * 0.12), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  halo(ctx, 0, -h * 0.1, 26, 'rgba(255,196,118,0.5)', 0.12);
  ellipse(ctx, 0, -h * 0.1, w * 0.3, h * 0.3, '#a7594e');
  ellipse(ctx, 0, -h * 0.13, w * 0.23, h * 0.22, e.color);
  disc(ctx, between(random, -1, 1), -h * 0.13, 1.8, '#fff4d6');
}

function paintReed(ctx, e, random) {
  for (let i = 0; i < e.count; i += 1) {
    const baseX = between(random, -e.w / 2, e.w / 2);
    const height = between(random, e.h * 0.45, e.h);
    const bend = between(random, -e.w * 0.24, e.w * 0.24);
    ctx.strokeStyle = i % 3 === 0 ? '#3f6a53' : e.color;
    ctx.lineWidth = between(random, 1.2, 2.4);
    ctx.beginPath();
    ctx.moveTo(baseX, e.h / 2);
    ctx.quadraticCurveTo(baseX + bend * 0.2, e.h / 2 - height * 0.6, baseX + bend, e.h / 2 - height);
    ctx.stroke();
    if (i % 2 === 0) ellipse(ctx, baseX + bend, e.h / 2 - height, 2.4, 5.5, '#7b5a44');
  }
}

function paintWillow(ctx, e, random) {
  for (let i = 0; i < 11; i += 1) {
    const x = between(random, -e.w / 2, e.w / 2);
    const length = between(random, e.h * 0.42, e.h);
    ctx.strokeStyle = e.color;
    ctx.lineWidth = between(random, 1, 2);
    ctx.beginPath();
    ctx.moveTo(x, -e.h / 2);
    ctx.quadraticCurveTo(x + 12, -e.h / 2 + length * 0.5, x - 4, -e.h / 2 + length);
    ctx.stroke();
    for (let j = 0; j < 5; j += 1) {
      const t = (j + 1) / 6;
      ellipse(ctx, x + 8 * (1 - t) - 2, -e.h / 2 + length * t, 3.4, 1.7, 'rgba(94,144,111,0.45)');
    }
  }
}

function paintSun(ctx, e) {
  const r = Math.min(e.w, e.h) / 2;
  halo(ctx, 0, 0, r * 2.7, 'rgba(255,226,166,0.6)', 0.16);
  disc(ctx, 0, 0, r, e.color);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#d99a68';
  for (let i = 0; i < 4; i += 1) ctx.fillRect(-r, -r * 0.5 + i * r * 0.34, r * 2, 2);
  ctx.globalAlpha = 1;
}

function paintCloud(ctx, e, random) {
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 6; i += 1) {
    const x = between(random, -e.w * 0.4, e.w * 0.4);
    const y = between(random, -e.h * 0.2, e.h * 0.2);
    ellipse(ctx, x, y, between(random, e.w * 0.16, e.w * 0.3), between(random, e.h * 0.24, e.h * 0.45), e.color);
  }
  ctx.globalAlpha = 1;
}

function paintHill(ctx, e, random) {
  ctx.beginPath();
  ctx.moveTo(-e.w / 2, e.h / 2);
  ctx.lineTo(-e.w / 2, -e.h * 0.1);
  for (let i = 0; i <= 6; i += 1) {
    const x = -e.w / 2 + (e.w / 6) * i;
    const y = -e.h * 0.18 + Math.sin(i * 1.1 + e.x) * e.h * 0.12 + between(random, -3, 3);
    ctx.quadraticCurveTo(x - e.w / 12, y - e.h * 0.1, x, y);
  }
  ctx.lineTo(e.w / 2, e.h / 2);
  ctx.closePath();
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 24; i += 1) {
    ctx.fillStyle = '#fff3d2';
    ctx.fillRect(between(random, -e.w / 2, e.w / 2), between(random, -e.h * 0.1, e.h / 2), between(random, 2, 9), 1);
  }
  ctx.globalAlpha = 1;
}

function paintTree(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.fillStyle = '#6d523d';
  ctx.beginPath();
  ctx.moveTo(-w * 0.07, h / 2);
  ctx.lineTo(-w * 0.05, -h * 0.05);
  ctx.lineTo(w * 0.05, -h * 0.05);
  ctx.lineTo(w * 0.08, h / 2);
  ctx.closePath();
  ctx.fill();
  const canopies = [
    [-w * 0.2, -h * 0.14, w * 0.27], [w * 0.18, -h * 0.18, w * 0.28],
    [0, -h * 0.34, w * 0.31], [0, -h * 0.06, w * 0.32],
  ];
  for (const [cx, cy, radius] of canopies) {
    ellipse(ctx, cx, cy, radius, radius * 0.86, e.color);
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 14; i += 1) ellipse(ctx, between(random, -w * 0.4, w * 0.4), between(random, -h * 0.42, -h * 0.02), 4, 3, '#d5e2a4');
  ctx.globalAlpha = 1;
  for (let i = 0; i < e.count; i += 1) {
    const angle = between(random, 0, Math.PI * 2);
    const radius = between(random, 0, w * 0.32);
    const ax = Math.cos(angle) * radius;
    const ay = -h * 0.18 + Math.sin(angle) * radius * 0.72;
    disc(ctx, ax, ay, 2.6, '#d8554d');
    disc(ctx, ax - 0.7, ay - 0.8, 0.7, 'rgba(255,255,255,0.5)');
  }
}

function paintStation(ctx, e, random) {
  roundRect(ctx, -e.w / 2, -e.h / 2 + 14, e.w, e.h - 14, 2);
  ctx.fillStyle = e.color;
  ctx.fill();
  polygon(ctx, [
    [-e.w / 2 - 10, -e.h / 2 + 18], [0, -e.h / 2 - 12],
    [e.w / 2 + 10, -e.h / 2 + 18], [e.w / 2, -e.h / 2 + 22],
    [0, -e.h / 2 - 5], [-e.w / 2, -e.h / 2 + 22],
  ], e.accent);
  ctx.fillStyle = 'rgba(88,52,44,0.18)';
  ctx.fillRect(-e.w / 2, -e.h / 2 + 18, e.w, 3);
  ctx.strokeStyle = 'rgba(125,92,72,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    const y = between(random, -e.h / 2 + 24, e.h / 2 - 4);
    ctx.beginPath();
    ctx.moveTo(-e.w / 2, y);
    ctx.lineTo(e.w / 2, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#8f6050';
  ctx.fillRect(e.w / 2 - 26, -e.h / 2 - 4, 10, 16);
}

function paintStationWindow(ctx, e) {
  roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 2);
  ctx.fillStyle = '#7d6552';
  ctx.fill();
  roundRect(ctx, -e.w / 2 + 2, -e.h / 2 + 2, e.w - 4, e.h - 4, 1);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(91,67,52,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -e.h / 2 + 2);
  ctx.lineTo(0, e.h / 2 - 2);
  ctx.moveTo(-e.w / 2 + 2, 0);
  ctx.lineTo(e.w / 2 - 2, 0);
  ctx.stroke();
}

function paintDoor(ctx, e) {
  roundRect(ctx, -e.w / 2, -e.h / 2 + 5, e.w, e.h - 5, e.w / 2 - 2);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,226,180,0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();
  disc(ctx, e.w * 0.28, 2, 1.7, '#f5d69a');
}

function paintSign(ctx, e) {
  roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 3);
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = e.accent;
  for (let i = 0; i < 7; i += 1) {
    const x = -e.w / 2 + 7 + i * ((e.w - 14) / 7);
    ctx.fillRect(x, -3, 2.2, 6);
    if (i % 2 === 0) ctx.fillRect(x, -5, 2.2, 1.5);
  }
}

function paintClock(ctx, e) {
  const r = Math.min(e.w, e.h) / 2;
  disc(ctx, 0, 0, r + 2, e.accent);
  disc(ctx, 0, 0, r, e.color);
  ctx.strokeStyle = 'rgba(91,70,60,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#5b463c';
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.lineWidth = i % 3 === 0 ? 1.6 : 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  ctx.strokeStyle = '#4c3a34';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(-0.9) * r * 0.5, Math.sin(-0.9) * r * 0.5);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(e.angle) * r * 0.72, Math.sin(e.angle) * r * 0.72);
  ctx.stroke();
  ctx.lineCap = 'butt';
  disc(ctx, 0, 0, 1.8, '#4c3a34');
}

function paintPlatform(ctx, e, random) {
  ctx.fillStyle = e.color;
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  ctx.fillStyle = e.accent;
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, 4);
  ctx.strokeStyle = 'rgba(111,96,77,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i += 1) {
    const y = -e.h / 2 + 12 + i * 11;
    ctx.beginPath();
    ctx.moveTo(-e.w / 2, y);
    ctx.lineTo(e.w / 2, y);
    ctx.stroke();
    const offset = (i % 2) * 34;
    for (let x = -e.w / 2 + offset; x < e.w / 2; x += 68) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 11);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 40; i += 1) ellipse(ctx, between(random, -e.w / 2, e.w / 2), between(random, -e.h / 2, e.h / 2), 2, 1, '#6e6558');
  ctx.globalAlpha = 1;
}

function paintRail(ctx, e, random) {
  ctx.fillStyle = '#8e8377';
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  ctx.fillStyle = e.color;
  ctx.fillRect(-e.w / 2, -e.h / 2 + 8, e.w, 6);
  ctx.fillRect(-e.w / 2, -e.h / 2 + 40, e.w, 6);
  for (let x = -e.w / 2; x < e.w / 2; x += 26) {
    ctx.fillStyle = '#5a4d44';
    ctx.fillRect(x, -e.h / 2 + 2, 15, 56);
  }
  ctx.fillStyle = '#4d453e';
  ctx.fillRect(-e.w / 2, -e.h / 2 + 52, e.w, 8);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 90; i += 1) disc(ctx, between(random, -e.w / 2, e.w / 2), between(random, -e.h / 2 + 14, e.h / 2), between(random, 0.6, 1.7), '#4c443e');
  ctx.globalAlpha = 1;
}

function paintSafetyLine(ctx, e) {
  ctx.fillStyle = 'rgba(74,62,49,0.35)';
  ctx.fillRect(-e.w / 2, -e.h / 2 - 1, e.w, e.h + 2);
  ctx.fillStyle = e.color;
  for (let x = -e.w / 2; x < e.w / 2; x += 22) ctx.fillRect(x, -e.h / 2, 13, e.h);
}

function paintBench(ctx, e) {
  ctx.globalAlpha = 0.26;
  ellipse(ctx, 2, e.h / 2 - 1, e.w * 0.5, 4, '#3d3229');
  ctx.globalAlpha = 1;
  ctx.fillStyle = e.color;
  for (let i = 0; i < 3; i += 1) ctx.fillRect(-e.w / 2, -e.h * 0.4 + i * 8, e.w, 5);
  ctx.fillStyle = '#a17655';
  for (let i = 0; i < 2; i += 1) ctx.fillRect(-e.w / 2, -e.h * 0.02 + i * 8, e.w, 5);
  ctx.fillStyle = '#5d4537';
  for (const x of [-e.w * 0.38, e.w * 0.38]) {
    ctx.fillRect(x - 3, -e.h * 0.36, 6, e.h * 0.86);
    ctx.fillRect(x - 7, e.h * 0.44, 14, 3);
  }
}

function paintCrateStack(ctx, e, random) {
  const count = e.count;
  const crateH = (e.h - (count - 1) * 3) / count;
  for (let i = 0; i < count; i += 1) {
    const w = e.w * (i % 2 === 0 ? 1 : 0.86);
    const cx = (i % 2 === 0 ? 0 : e.w * 0.05);
    const y = e.h / 2 - (i + 1) * (crateH + 3) + 3;
    roundRect(ctx, cx - w / 2, y, w, crateH, 2);
    ctx.fillStyle = i % 2 === 0 ? e.color : '#a97d4f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(88,58,36,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 2, y + 2);
    ctx.lineTo(cx + w / 2 - 2, y + crateH - 2);
    ctx.moveTo(cx + w / 2 - 2, y + 2);
    ctx.lineTo(cx - w / 2 + 2, y + crateH - 2);
    ctx.stroke();
    if (random() > 0.4) {
      ctx.fillStyle = 'rgba(72,96,62,0.5)';
      ctx.fillRect(cx - 5, y + crateH * 0.4, 10, 2);
    }
  }
}

function paintBarrel(ctx, e) {
  roundRect(ctx, -e.w / 2, -e.h / 2, e.w, e.h, 7);
  ctx.fillStyle = e.color;
  ctx.fill();
  ellipse(ctx, 0, -e.h / 2, e.w / 2, 4, '#a07853');
  ctx.strokeStyle = '#4e4a45';
  ctx.lineWidth = 2;
  for (const y of [-e.h * 0.3, 0, e.h * 0.3]) {
    ctx.beginPath();
    ctx.moveTo(-e.w / 2 + 1, y);
    ctx.lineTo(e.w / 2 - 1, y);
    ctx.stroke();
  }
}

function paintCart(ctx, e) {
  ctx.globalAlpha = 0.25;
  ellipse(ctx, 0, e.h / 2 - 1, e.w * 0.5, 4, '#3d3229');
  ctx.globalAlpha = 1;
  roundRect(ctx, -e.w / 2 + 10, -e.h * 0.1, e.w - 24, e.h * 0.5, 2);
  ctx.fillStyle = e.color;
  ctx.fill();
  roundRect(ctx, -e.w * 0.26, -e.h * 0.42, e.w * 0.32, e.h * 0.34, 2);
  ctx.fillStyle = '#b98e63';
  ctx.fill();
  roundRect(ctx, e.w * 0.04, -e.h * 0.32, e.w * 0.26, e.h * 0.24, 2);
  ctx.fillStyle = '#7e8b74';
  ctx.fill();
  for (const x of [-e.w * 0.26, e.w * 0.26]) {
    disc(ctx, x, e.h * 0.42, 11, '#3f3a36');
    disc(ctx, x, e.h * 0.42, 5, '#9a8f80');
    ctx.strokeStyle = '#c2b4a1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 9, e.h * 0.42 - Math.sin(a) * 9);
      ctx.lineTo(x + Math.cos(a) * 9, e.h * 0.42 + Math.sin(a) * 9);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = '#5d4a3b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.w / 2 - 14, 0);
  ctx.lineTo(e.w / 2 + 6, -e.h * 0.4);
  ctx.stroke();
}

function paintSignal(ctx, e) {
  ctx.fillStyle = e.color;
  ctx.fillRect(-2, -e.h / 2, 4, e.h);
  roundRect(ctx, -e.w / 2, -e.h * 0.48, e.w, e.h * 0.46, 3);
  ctx.fillStyle = '#343634';
  ctx.fill();
  for (let i = 0; i < 2; i += 1) {
    const active = (i === 0 && e.variant === 'red') || (i === 1 && e.variant === 'green');
    const color = i === 0 ? '#ff6b5e' : '#6ee08c';
    const cy = -e.h * 0.48 + e.h * (i === 0 ? 0.13 : 0.32);
    if (active) halo(ctx, 0, cy, 20, i === 0 ? 'rgba(255,107,94,0.5)' : 'rgba(110,224,140,0.5)', 0.15);
    disc(ctx, 0, cy, 3.6, active ? color : 'rgba(120,120,110,0.35)');
  }
  ctx.fillStyle = e.color;
  ctx.fillRect(-e.w * 0.4, e.h * 0.4, e.w * 0.8, 3);
}

function paintLampPost(ctx, e) {
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, e.h / 2);
  ctx.lineTo(0, -e.h / 2 + 12);
  ctx.quadraticCurveTo(0, -e.h / 2, 8, -e.h / 2);
  ctx.stroke();
  halo(ctx, 8, -e.h / 2 + 2, 30, 'rgba(255,216,151,0.55)', 0.14);
  ctx.fillStyle = '#ffdf9f';
  ctx.beginPath();
  ctx.moveTo(3, -e.h / 2);
  ctx.lineTo(13, -e.h / 2);
  ctx.lineTo(11, -e.h / 2 + 7);
  ctx.lineTo(5, -e.h / 2 + 7);
  ctx.closePath();
  ctx.fill();
}

function paintPigeon(ctx, e) {
  ellipse(ctx, 0, 1, e.w * 0.36, e.h * 0.3, e.color);
  disc(ctx, -e.w * 0.32, -e.h * 0.16, e.h * 0.2, e.color);
  polygon(ctx, [
    [-e.w * 0.42, -e.h * 0.16], [-e.w * 0.56, -e.h * 0.1], [-e.w * 0.42, -e.h * 0.06],
  ], '#e0a45c');
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-e.w * 0.06, -e.h * 0.06);
  ctx.quadraticCurveTo(e.w * 0.1, -e.h * 0.34, e.w * 0.22, -e.h * 0.04);
  ctx.stroke();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.moveTo(e.w * 0.3, 0);
  ctx.lineTo(e.w * 0.52, -e.h * 0.18);
  ctx.lineTo(e.w * 0.46, e.h * 0.1);
  ctx.closePath();
  ctx.fill();
  disc(ctx, -e.w * 0.34, -e.h * 0.19, 0.9, '#22262c');
}

function paintPlant(ctx, e, random) {
  polygon(ctx, [
    [-e.w * 0.32, e.h / 2 - 12], [e.w * 0.32, e.h / 2 - 12],
    [e.w * 0.24, e.h / 2], [-e.w * 0.24, e.h / 2],
  ], '#a16850');
  for (let i = 0; i < 7; i += 1) {
    const x = between(random, -e.w * 0.3, e.w * 0.3);
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, e.h / 2 - 12);
    ctx.quadraticCurveTo(x, -e.h * 0.05, x + between(random, -5, 5), -e.h / 2);
    ctx.stroke();
    ellipse(ctx, x + between(random, -5, 5), -e.h * 0.36, 5, 2.6, e.color);
  }
}

function paintHeadland(ctx, e, random) {
  ctx.beginPath();
  ctx.moveTo(-e.w / 2, e.h / 2);
  ctx.lineTo(-e.w / 2, e.h * 0.1);
  ctx.quadraticCurveTo(-e.w * 0.32, -e.h * 0.35, -e.w * 0.12, e.h * 0.02);
  ctx.quadraticCurveTo(e.w * 0.1, -e.h * 0.28, e.w * 0.36, e.h * 0.12);
  ctx.quadraticCurveTo(e.w * 0.48, -e.h * 0.1, e.w / 2, e.h * 0.18);
  ctx.lineTo(e.w / 2, e.h / 2);
  ctx.closePath();
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 20; i += 1) ellipse(ctx, between(random, -e.w / 2, e.w / 2), between(random, 0, e.h / 2), 5, 2, '#9fb0ac');
  ctx.globalAlpha = 1;
}

function paintSea(ctx, e, random) {
  const gradient = ctx.createLinearGradient(0, -e.h / 2, 0, e.h / 2);
  gradient.addColorStop(0, '#3e6f86');
  gradient.addColorStop(1, e.color);
  ctx.fillStyle = gradient;
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  for (let i = 0; i < 46; i += 1) {
    const y = between(random, -e.h / 2, e.h / 2);
    const x = between(random, -e.w / 2, e.w / 2);
    const length = between(random, 8, 34);
    ctx.strokeStyle = `rgba(196,228,222,${between(random, 0.12, 0.4).toFixed(3)})`;
    ctx.lineWidth = between(random, 0.8, 1.8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + length * 0.5, y - 2, x + length, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(244,240,220,0.32)';
  ctx.fillRect(-e.w / 2, e.h / 2 - 3, e.w, 3);
}

function paintBeach(ctx, e, random) {
  const gradient = ctx.createLinearGradient(0, -e.h / 2, 0, e.h / 2);
  gradient.addColorStop(0, '#b9a383');
  gradient.addColorStop(0.25, e.color);
  gradient.addColorStop(1, '#d9c4a4');
  ctx.fillStyle = gradient;
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 150; i += 1) {
    disc(ctx, between(random, -e.w / 2, e.w / 2), between(random, -e.h / 2, e.h / 2), between(random, 0.4, 1.4), '#7e6a55');
  }
  ctx.globalAlpha = 1;
}

function paintRock(ctx, e, random) {
  const points = [];
  const steps = 11;
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const jitter = between(random, 0.82, 1.06);
    points.push([
      Math.cos(angle) * e.w * 0.5 * jitter,
      Math.sin(angle) * e.h * 0.48 * jitter,
    ]);
  }
  polygon(ctx, points, e.color);
  const gloss = ctx.createLinearGradient(0, -e.h / 2, 0, e.h / 2);
  gloss.addColorStop(0, 'rgba(255,255,255,0.16)');
  gloss.addColorStop(0.45, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(20,24,28,0.34)');
  ctx.fillStyle = gloss;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,42,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const x = between(random, -e.w * 0.3, e.w * 0.3);
    const y = between(random, -e.h * 0.2, e.h * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + between(random, 8, 26), y + between(random, -5, 5));
    ctx.stroke();
  }
}

function paintPool(ctx, e, random) {
  const indigo = e.variant === 'indigo';
  const water = ctx.createLinearGradient(0, -e.h / 2, 0, e.h / 2);
  water.addColorStop(0, indigo ? '#5c6aa0' : '#79c2c6');
  water.addColorStop(1, indigo ? '#2f3e70' : '#2f7d8e');
  ellipse(ctx, 0, 0, e.w / 2 + 3, e.h / 2 + 2, 'rgba(48,44,42,0.55)');
  ellipse(ctx, 0, 0, e.w / 2, e.h / 2, water);
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i += 1) {
    const rx = e.w * (0.16 + i * 0.12);
    ctx.beginPath();
    ctx.ellipse(between(random, -5, 5), 0, rx, e.h * 0.16, 0, 0.3, 2.5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,243,214,0.35)';
  for (let i = 0; i < 5; i += 1) ctx.fillRect(between(random, -e.w * 0.34, e.w * 0.34), between(random, -e.h * 0.2, e.h * 0.2), between(random, 4, 13), 1);
}

function paintStarfish(ctx, e, random) {
  const radius = Math.min(e.w, e.h) / 2;
  ctx.save();
  ctx.rotate(-0.18);
  for (let i = 0; i < e.arms; i += 1) {
    ctx.save();
    ctx.rotate((i / e.arms) * Math.PI * 2);
    polygon(ctx, [[-radius * 0.16, 0], [0, -radius], [radius * 0.16, 0]], e.color);
    ctx.restore();
  }
  disc(ctx, 0, 0, radius * 0.34, '#e79b7e');
  for (let i = 0; i < 7; i += 1) {
    const a = between(random, 0, Math.PI * 2);
    const d = between(random, 0, radius * 0.65);
    disc(ctx, Math.cos(a) * d, Math.sin(a) * d, between(random, 0.7, 1.5), '#f8d3b2');
  }
  ctx.restore();
}

function paintShell(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.quadraticCurveTo(-w * 0.4, -h / 2, 0, -h * 0.42);
  ctx.quadraticCurveTo(w * 0.4, -h / 2, w / 2, h / 2);
  ctx.closePath();
  ctx.fillStyle = e.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(129,84,69,0.42)';
  ctx.lineWidth = 0.9;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.13, h / 2);
    ctx.lineTo(i * w * 0.15, -h * 0.4);
    ctx.stroke();
  }
  ellipse(ctx, between(random, -2, 2), h / 2 - 1, w * 0.52, 2.2, 'rgba(129,84,69,0.3)');
}

function paintCrab(ctx, e) {
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 1.6;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(side * e.w * 0.22, -e.h * 0.02 + i * 3);
      ctx.lineTo(side * e.w * 0.46, e.h * (0.16 + i * 0.1));
      ctx.stroke();
    }
    disc(ctx, side * e.w * 0.38, -e.h * 0.22, e.w * 0.13, e.color);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(side * e.w * 0.46, -e.h * 0.28);
    ctx.lineTo(side * e.w * 0.54, -e.h * 0.36);
    ctx.moveTo(side * e.w * 0.46, -e.h * 0.2);
    ctx.lineTo(side * e.w * 0.56, -e.h * 0.16);
    ctx.stroke();
    ctx.lineWidth = 1.6;
  }
  ellipse(ctx, 0, 0, e.w * 0.32, e.h * 0.34, e.color);
  disc(ctx, -e.w * 0.1, -e.h * 0.28, 1.8, '#241f1e');
  disc(ctx, e.w * 0.1, -e.h * 0.28, 1.8, '#241f1e');
}

function paintSeaweed(ctx, e, random) {
  for (let i = 0; i < 5; i += 1) {
    const x = between(random, -e.w / 2, e.w / 2);
    const height = between(random, e.h * 0.5, e.h);
    const bend = between(random, -10, 10);
    ctx.strokeStyle = i % 2 ? e.color : '#4e7b62';
    ctx.lineWidth = between(random, 2, 3.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, e.h / 2);
    ctx.bezierCurveTo(x + bend, e.h * 0.15, x - bend, -e.h * 0.2, x + bend * 0.4, e.h / 2 - height);
    ctx.stroke();
    ctx.lineCap = 'butt';
    for (let j = 0; j < 3; j += 1) {
      const y = e.h / 2 - height * (0.3 + j * 0.22);
      ellipse(ctx, x + bend * 0.4, y, 4.5, 1.8, 'rgba(120,166,124,0.6)');
    }
  }
}

function paintBird(ctx, e) {
  // One wing lifted, one wing dipped: mirroring the bird is visible but never shouted.
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-e.w * 0.06, 0);
  ctx.quadraticCurveTo(-e.w * 0.28, -e.h * 0.85, -e.w * 0.5, -e.h * 0.55);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(e.w * 0.06, 0);
  ctx.quadraticCurveTo(e.w * 0.3, e.h * 0.45, e.w * 0.52, e.h * 0.12);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ellipse(ctx, 0, 0, e.w * 0.12, e.h * 0.16, e.color);
  disc(ctx, e.w * 0.12, -e.h * 0.08, 1.4, e.color);
}

function paintUmbrella(ctx, e, random) {
  const w = e.w;
  const h = e.h;
  ctx.globalAlpha = 0.28;
  ellipse(ctx, 3, h / 2 - 1, w * 0.5, 5, '#5c5042');
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#6b6152';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.1);
  ctx.lineTo(0, h / 2 - 4);
  ctx.stroke();
  const top = -h / 2;
  const panels = e.count;
  for (let i = 0; i < panels; i += 1) {
    const a0 = Math.PI + (i / panels) * Math.PI;
    const a1 = Math.PI + ((i + 1) / panels) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(Math.cos(a0) * w * 0.5, top - Math.sin(a0) * h * 0.5);
    ctx.quadraticCurveTo(Math.cos((a0 + a1) / 2) * w * 0.5, top - Math.sin((a0 + a1) / 2) * h * 0.55,
      Math.cos(a1) * w * 0.5, top - Math.sin(a1) * h * 0.5);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? e.color : e.accent;
    ctx.fill();
    ctx.strokeStyle = 'rgba(88,58,58,0.25)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a6b58';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, top - 4);
  ctx.lineTo(0, top + 4);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) ellipse(ctx, between(random, -w * 0.3, w * 0.3), between(random, -h * 0.35, -h * 0.1), 2, 1, 'rgba(255,255,255,0.12)');
}

function paintBuoy(ctx, e) {
  ellipse(ctx, 1, e.h * 0.5, e.w * 0.6, 3, 'rgba(12,42,56,0.3)');
  halo(ctx, 0, 0, e.w, 'rgba(255,220,170,0.3)', 0.1);
  disc(ctx, 0, 0, e.w * 0.42, e.color);
  ctx.strokeStyle = '#f5e7cd';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-e.w * 0.35, -e.h * 0.12);
  ctx.lineTo(e.w * 0.35, -e.h * 0.12);
  ctx.stroke();
  ctx.strokeStyle = '#4b4a45';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -e.h * 0.4);
  ctx.lineTo(0, -e.h * 0.7);
  ctx.stroke();
  polygon(ctx, [[0, -e.h * 0.7], [e.w * 0.34, -e.h * 0.62], [0, -e.h * 0.52]], '#f4d28c');
}

function paintDriftwood(ctx, e, random) {
  ctx.strokeStyle = e.color;
  ctx.lineWidth = between(random, 5, 7);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-e.w / 2, e.h * 0.3);
  ctx.quadraticCurveTo(0, -e.h * 0.25, e.w / 2, e.h * 0.05);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const x = between(random, -e.w * 0.3, e.w * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, -e.h * 0.05);
    ctx.lineTo(x + between(random, -8, 8), -e.h * 0.42);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

function paintPebbles(ctx, e, random) {
  for (let i = 0; i < e.count; i += 1) {
    const x = between(random, -e.w / 2, e.w / 2);
    const y = between(random, -e.h / 2, e.h / 2);
    const r = between(random, 1.8, 4.6);
    ellipse(ctx, x, y, r, r * 0.62, i % 3 === 0 ? '#8e8378' : e.color);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, r * 0.7, r * 0.35, 0, 0, Math.PI);
    ctx.stroke();
  }
}

const PAINTERS = {
  starfield: paintStarfield, moon: paintMoon, building: paintBuilding, window: paintWindow,
  wire: paintWire, lantern: paintLantern, bridge: paintBridge, 'bridge-lamp': paintBridgeLamp,
  boat: paintBoat, 'float-lantern': paintFloatLantern, reed: paintReed, willow: paintWillow,
  sun: paintSun, cloud: paintCloud, hill: paintHill, tree: paintTree, station: paintStation,
  'station-window': paintStationWindow, door: paintDoor, sign: paintSign, clock: paintClock,
  platform: paintPlatform, rail: paintRail, 'safety-line': paintSafetyLine, bench: paintBench,
  'crate-stack': paintCrateStack, barrel: paintBarrel, cart: paintCart, signal: paintSignal,
  'lamp-post': paintLampPost, pigeon: paintPigeon, plant: paintPlant, headland: paintHeadland,
  sea: paintSea, beach: paintBeach, rock: paintRock, pool: paintPool, starfish: paintStarfish,
  shell: paintShell, crab: paintCrab, seaweed: paintSeaweed, bird: paintBird,
  umbrella: paintUmbrella, buoy: paintBuoy, driftwood: paintDriftwood, pebbles: paintPebbles,
};

/** Draw one element in its own transformed space, so scale/move/flip edits need no special art. */
function paintElement(ctx, element, sceneSeed, index) {
  if (element.hidden) return;
  const painter = PAINTERS[element.kind];
  if (!painter) throw new Error(`No painter for element kind ${element.kind}`);
  ctx.save();
  ctx.translate(element.x + element.w / 2, element.y + element.h / 2);
  if (element.flip) ctx.scale(-1, 1);
  if (element.angle) ctx.rotate(element.angle);
  painter(ctx, element, elementRandom(sceneSeed, index));
  ctx.restore();
}

/** A faint deterministic grain and edge shade, shared by both panels, ties the layers together. */
function paintPaper(ctx, seed) {
  const random = makeRandom(seed ^ 0x71f2a3c9);
  for (let i = 0; i < 1100; i += 1) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.026)';
    ctx.fillRect(between(random, 0, VIEW.width), between(random, 0, VIEW.height), between(random, 0.6, 1.8), between(random, 0.6, 1.8));
  }
  const vignette = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.28,
    VIEW.width / 2, VIEW.height / 2, VIEW.width * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(3,8,16,0.36)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

// ---------------------------------------------------------------- overlay marks
function checkMark(ctx, x, y, size) {
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.36, y);
  ctx.lineTo(x - size * 0.08, y + size * 0.28);
  ctx.lineTo(x + size * 0.4, y - size * 0.3);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function paintFoundMarks(ctx, targets, found, now, isRight) {
  for (const index of found) {
    const target = targets[index];
    if (!target) continue;
    const { x, y } = target.region;
    const pulse = 1 + Math.sin(now * 4 + index) * 0.045;
    const radius = 20 * pulse;
    ctx.save();
    halo(ctx, x, y, 34, 'rgba(103,242,188,0.26)', 0.1);
    strokeGlow(ctx, rgba(0x6f, 0xf0, 0xc0, isRight ? 0.95 : 0.72), 3, isRight ? 14 : 8);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(6,26,26,0.75)';
    ctx.lineWidth = 4.4;
    checkMark(ctx, x, y + 1, radius * 0.9);
    ctx.strokeStyle = '#e8fff4';
    ctx.lineWidth = 2.4;
    checkMark(ctx, x, y, radius * 0.9);
    ctx.restore();
  }
}

function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a})`; }

function paintHint(ctx, hint, now) {
  if (!hint) return;
  const remaining = hint.until - now;
  if (remaining <= 0) return;
  const fade = Math.min(1, remaining / 0.5, (hint.until - hint.start - remaining) / 0.18 + 0.12);
  const { x, y, r } = hint.region;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, fade)) * (0.72 + Math.sin(now * 7) * 0.18);
  const glow = ctx.createRadialGradient(x, y, r * 0.12, x, y, r * 1.5);
  glow.addColorStop(0, 'rgba(255,215,130,0.22)');
  glow.addColorStop(1, 'rgba(255,215,130,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd582';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 6]);
  ctx.lineDashOffset = -now * 22;
  ctx.shadowColor = '#ffd582';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe6ac';
  ctx.font = '700 10px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LOOK HERE', x, y - r * 0.72 - 9);
  ctx.restore();
}

function paintEffects(ctx, effects, now) {
  for (const effect of effects) {
    const age = now - effect.start;
    if (effect.type === 'miss') {
      const t = age / MISS_SECONDS;
      if (t < 0 || t > 1) continue;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.9;
      strokeGlow(ctx, '#ff7d90', 3 * (1 - t) + 1, 10);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 7 + t * 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 4 + t * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === 'find') {
      const t = age / MARK_SECONDS;
      if (t < 0 || t > 1) continue;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.9;
      strokeGlow(ctx, '#8ffcd0', 2.6 * (1 - t) + 0.5, 12);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + t * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2 + effect.seed;
        const distance = 12 + t * 44;
        disc(ctx, effect.x + Math.cos(angle) * distance, effect.y + Math.sin(angle) * distance,
          (1 - t) * 2.4 + 0.4, '#b8ffe0');
      }
      ctx.restore();
    }
  }
}

function paintCursor(ctx, cursor) {
  if (!cursor || !cursor.visible) return;
  const { x, y } = cursor;
  ctx.save();
  ctx.strokeStyle = 'rgba(240,250,255,0.82)';
  ctx.lineWidth = 1.2;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.moveTo(x - 17, y);
  ctx.lineTo(x - 11, y);
  ctx.moveTo(x + 11, y);
  ctx.lineTo(x + 17, y);
  ctx.moveTo(x, y - 17);
  ctx.lineTo(x, y - 11);
  ctx.moveTo(x, y + 11);
  ctx.lineTo(x, y + 17);
  ctx.stroke();
  disc(ctx, x, y, 1.4, '#fff');
  ctx.restore();
}

/** Paint one complete panel. `side` is 'left' (reference) or 'right' (the copy being searched). */
export function renderPanel(ctx, scene, elements, view) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  BACKDROPS[scene.backdrop](ctx, scene.palette, scene.seed);
  elements.forEach((element, index) => paintElement(ctx, element, scene.seed, index));
  paintPaper(ctx, scene.seed);

  const isRight = view.side === 'right';
  paintFoundMarks(ctx, view.targets, view.found, view.now, isRight);
  if (isRight) {
    paintHint(ctx, view.hint, view.now);
    paintEffects(ctx, view.effects, view.now);
    if (!view.completed) paintCursor(ctx, view.cursor);
  }
}
