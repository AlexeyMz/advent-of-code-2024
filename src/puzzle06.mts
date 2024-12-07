import { readFile, writeFile } from 'node:fs/promises';

import { Grid } from './core/grid.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle06.txt'), {encoding: 'utf8'});

  const grid = Grid.fromLines(content.split(/\r?\n/g).filter(line => line));
  let visited = grid.clone();

  let position = findStart(grid);
  let direction: Direction = '^';
  while (true) {
    if (!visited.trySetChar(position[0], position[1], 'X')) {
      break;
    }
    const next = moveInDirection(position, direction);
    if (visited.tryGetChar(next[0], next[1], ' ') === '#') {
      direction = rotateClockwise(direction);
    } else {
      position = next;
    }
  }

  await writeFile(
    getDataPath('output/puzzle06_visited.txt'),
    Array.from(visited.enumerateLines(), line => line + '\n').join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 06 (basic): ${visited.count(v => v === 'X'.charCodeAt(0))}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle06.txt'), {encoding: 'utf8'});

  const grid = Grid.fromLines(content.split(/\r?\n/g).filter(line => line));
  const start = findStart(grid);
  let visited = grid.clone();
  let rays = Grid.empty(grid.rows, grid.columns);

  const fillBackwardRay = (from: Vector, forward: Direction) => {
    let at = from;
    while (true) {
      const next = moveInDirection(at, forward);
      if (grid.tryGetChar(next[0], next[1], '#') === '#') {
        break;
      }
      at = next;
    }

    const backward = rotateClockwise(rotateClockwise(forward));
    while (true) {
      rays.set(at[0], at[1], rays.get(at[0], at[1]) | DIRECTION_TO_FLAG[forward]);
      const next = moveInDirection(at, backward);
      if (grid.tryGetChar(next[0], next[1], '#') === '#') {
        break;
      }
      at = next;
    }
  };

  let position = start;
  let direction: Direction = '^';
  while (true) {
    if (!visited.trySetChar(position[0], position[1], 'X')) {
      break;
    }
    const next = moveInDirection(position, direction);
    if (visited.tryGetChar(next[0], next[1], ' ') === '#') {
      fillBackwardRay(position, direction);
      direction = rotateClockwise(direction);
    } else {
      if (rays.get(position[0], position[1]) & DIRECTION_TO_FLAG[rotateClockwise(direction)]) {
        rays.set(next[0], next[1], rays.get(next[0], next[1]) | STOP_FLAG);
      }
      position = next;
    }
  }

  const gridWithRays = grid.clone();
  for (let i = 0; i < rays.rows; i++) {
    for (let j = 0; j < rays.columns; j++) {
      const ray = rays.get(i, j);
      if (ray) {
        gridWithRays.setChar(i, j, FLAG_TO_CHAR[ray] ?? '?');
      }
    }
  }

  await writeFile(
    getDataPath('output/puzzle06_rays.txt'),
    Array.from(gridWithRays.enumerateLines(), line => line + '\n').join(''),
    {encoding: 'utf8'}
  );

  rays.set(start[0], start[1], rays.get(start[0], start[1]) & ~STOP_FLAG & 0xFFFF);
  // 446 is too low
  console.log(`Puzzle 06 (advanced): ${rays.count(v => Boolean(v & STOP_FLAG))}`);
}

type Vector = readonly [row: number, column: number];
type Direction = '^' | 'v' | '<' | '>';

function findStart(grid: Grid): Vector {
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (grid.getChar(i, j) === '^') {
        return [i, j];
      }
    }
  }
  throw new Error('Failed to find start guard position');
}

function rotateClockwise(direction: Direction): Direction {
  switch (direction) {
    case '^': return '>';
    case '>': return 'v';
    case 'v': return '<';
    case '<': return '^';
  }
}

function moveInDirection(position: Vector, direction: Direction): Vector {
  const [row, column] = position;
  switch (direction) {
    case '^': return [row - 1, column];
    case '>': return [row, column + 1];
    case 'v': return [row + 1, column];
    case '<': return [row, column - 1];
  }
}

enum DirectionFlag {
  Up = 1,
  Right = 2,
  Down = 4,
  Left = 8
}
const STOP_FLAG = 16;

const DIRECTION_TO_FLAG = {
  '^': DirectionFlag.Up,
  '>': DirectionFlag.Right,
  'v': DirectionFlag.Down,
  '<': DirectionFlag.Left,
} as const;

const FLAG_TO_CHAR = '.^>┐v|┘├<┌-┴└┤┬┼OÄ»╗Ü║╝╠«╔═╩╚╣╦╬Ø';

(async function main() {
  // await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
