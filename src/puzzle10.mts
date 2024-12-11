import { readFile } from 'node:fs/promises';

import { CharGrid } from './core/grid.mjs';
import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle10.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  const visited = CharGrid.empty(grid.rows, grid.columns, '.');
  let visitedScore = 0;
  const visitFromTrailhead = (row: number, column: number): void => {
    if (visited.get(row, column) === '.') {
      const current = toLevel(grid.get(row, column));
      visited.set(row, column, grid.get(row, column));
      if (current === 9) {
        visitedScore++;
      } else {
        for (const [i, j] of DIRECTIONS) {
          const nextRow = row + i;
          const nextColumn = column + j;
          if (grid.valid(nextRow, nextColumn)) {
            const next = toLevel(grid.get(nextRow, nextColumn));
            if (next - current === 1) {
              visitFromTrailhead(nextRow, nextColumn);
            }
          }
        }
      }
    }
  };

  let totalScore = 0;
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (grid.get(i, j) === '0') {
        visited.fill('.');
        visitedScore = 0;
        visitFromTrailhead(i, j);
        totalScore += visitedScore;
        // console.log(
        //   `Score: ${visitedScore}\n`,
        //   Array.from(visited.lines()).join('')
        // );
      }
    }
  }

  console.log(`Puzzle 10 (basic): ${totalScore}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle10.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  let visitedRaiting = 0;
  const visitFromTrailhead = (row: number, column: number): void => {
    const current = toLevel(grid.get(row, column));
    if (current === 9) {
      visitedRaiting++;
    } else {
      for (const [i, j] of DIRECTIONS) {
        const nextRow = row + i;
        const nextColumn = column + j;
        if (grid.valid(nextRow, nextColumn)) {
          const next = toLevel(grid.get(nextRow, nextColumn));
          if (next - current === 1) {
            visitFromTrailhead(nextRow, nextColumn);
          }
        }
      }
    }
  };

  let totalRaiting = 0;
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (grid.get(i, j) === '0') {
        visitedRaiting = 0;
        visitFromTrailhead(i, j);
        totalRaiting += visitedRaiting;
      }
    }
  }

  console.log(`Puzzle 10 (advanced): ${totalRaiting}`);
}

const DIRECTIONS = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
] as const;

function toLevel(char: string): number {
  return char.charCodeAt(0) - '0'.charCodeAt(0);
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
