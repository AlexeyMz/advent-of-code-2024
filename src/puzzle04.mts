import { readFile } from 'node:fs/promises';

import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle04_sewa.txt'), {encoding: 'utf8'});

  const lines = content.split(/\r?\n/g);
  let total = 0;
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    for (let column = 0; column < line.length; column++) {
      total += countWordsAtPosition(lines, 'XMAS', [row, column]);
    }
  }

  console.log(`Puzzle 04 (basic): ${total}`);
}

type Vector = readonly [row: number, column: number];

const ALL_DIRECTIONS: readonly Vector[] = [
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
];

function countWordsAtPosition(lines: string[], word: string, position: Vector): number {
  let count = 0;
  for (const direction of ALL_DIRECTIONS) {
    if (matchWord(lines, word, position, direction)) {
      count++;
    }
  }
  return count;
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle04_sewa.txt'), {encoding: 'utf8'});

  const lines = content.split(/\r?\n/g);
  let total = 0;
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    for (let column = 0; column < line.length; column++) {
      if (hasWordAtCross(lines, 'MAS', [row, column])) {
        total++;
      }
    }
  }

  console.log(`Puzzle 04 (advanced): ${total}`);
}

const DIAGONALS: readonly Vector[] = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
];

function hasWordAtCross(lines: string[], word: string, position: Vector): boolean {
  let half = Math.floor(word.length / 2);
  let matchCount = 0;
  for (const direction of DIAGONALS) {
    const startRow = position[0] - direction[0] * half;
    const startColumn = position[1] - direction[1] * half;
    if (matchWord(lines, word, [startRow, startColumn], direction)) {
      matchCount++;
    }
  }
  return matchCount === 2;
}

function matchWord(lines: string[], word: string, position: Vector, direction: Vector): boolean {
  let [row, column] = position;
  const [shiftRow, shiftColumn] = direction;
  for (let i = 0; i < word.length; i++) {
    if (row < 0 || row >= lines.length) {
      return false;
    }
    const line = lines[row];
    if (column < 0 || column >= line.length) {
      return false;
    }
    if (line[column] !== word[i]) {
      return false;
    }
    row += shiftRow;
    column += shiftColumn;
  }
  return true;
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
