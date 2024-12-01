import { readFile } from 'node:fs/promises';

import { getInputPath } from './core/project.mjs';

export async function solvePuzzle01Basic() {
  const content = await readFile(getInputPath('puzzle01.txt'), {encoding: 'utf8'});

  console.log(`Puzzle 01: `);
}

export async function solvePuzzle01Advanced() {
  const content = await readFile(getInputPath('puzzle01.txt'), {encoding: 'utf8'});

  console.log(`Puzzle 01 (advanced): `);
}

(async function main() {
  await solvePuzzle01Basic();
  // await solvePuzzle01Advanced();
})();
