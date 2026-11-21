// Spot the Gap — hand-in program for make.fun bounty best-spot-the-difference-game-20261121-0451.
// The deliverable is the plain static site in ./game: three procedurally drawn picture puzzles,
// seven planned differences each, no libraries and no network requests. This program only packs
// that folder and the maker's screenshots into MAKEFUN_OUTPUT_DIR (or /output in the grader) and
// asks the vendored kit library to write the canonical dossier the judge reads. Standard library
// only; it runs unchanged on Node 22 with no install step.
//
//   node serve.ts                                  # play locally at http://localhost:8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts            # build a local hand-in to check

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** A short note for a human at the console; never part of the dossier's bytes. */
function warn(message: string): void {
  process.stderr.write(`[spot-the-gap] ${message}\n`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
} else {
  warn('no screenshots/ directory yet — the judge needs 3 or 4 real renders of the game');
}

// The scorer's caps: keep every game path and the whole tree below the gate's limits, and keep
// the dossier's source text under its 160 KiB budget.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
warn(`packed game/ and screenshots/ into ${out}; dossier is ${dossier.byteLength} bytes`);
