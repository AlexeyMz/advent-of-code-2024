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
  const content = await readFile(getDataPath('input/puzzle06_test.txt'), {encoding: 'utf8'});

  const grid = Grid.fromLines(content.split(/\r?\n/g).filter(line => line));
  const start = findStart(grid);
  const visited = grid.clone();
  const rays = {
    '^': Grid.empty(grid.rows, grid.columns),
    '>': Grid.empty(grid.rows, grid.columns),
    'v': Grid.empty(grid.rows, grid.columns),
    '<': Grid.empty(grid.rows, grid.columns),
  } as const;

  const exploreCycle = (from: Vector, fromDirection: Direction): RayState.ToCycle | RayState.ToFree => {
    const explored: Array<readonly [Vector, Direction]> = [];
    const startDirection = rotateClockwise(fromDirection);
    const start = moveInDirection(from, startDirection);
    let result: RayState.ToCycle | RayState.ToFree = RayState.ToFree;
    for (const [at, direction] of walkGrid(grid, start, startDirection)) {
      explored.push([at, direction]);
      const directedRays = rays[direction];
      const state = directedRays.get(at[0], at[1]);
      if (state) {
        result = state === RayState.Exploring ? RayState.ToCycle : state;
        break;
      }
      directedRays.set(at[0], at[1], RayState.Exploring);
    }
    console.log(`explored ${explored.map(([p, d]) => `${p[0]},${p[1]}:${d}`).join(' ')}`);
    return result;
  };

  const markCycle = (from: Vector, fromDirection: Direction, mark: RayState.ToCycle | RayState.ToFree): void => {
    const marked: Array<readonly [Vector, Direction]> = [];
    const startDirection = rotateClockwise(fromDirection);
    const start = moveInDirection(from, startDirection);
    for (const [at, direction] of walkGrid(grid, start, startDirection)) {
      marked.push([at, direction]);
      const directedRays = rays[direction];
      const state = directedRays.get(at[0], at[1]);
      if (state !== RayState.Exploring) {
        break;
      }
      directedRays.set(at[0], at[1], mark);
    }
    console.log(`  marked ${marked.map(([p, d]) => `${p[0]},${p[1]}:${d}`).join(' ')}`);
  };

  for (const [at, direction] of walkGrid(grid, start, '^')) {
    console.log(`walk ${at.join(',')} ${direction}`);
    const exploreState = exploreCycle(at, direction);
    markCycle(at, direction, exploreState);
    console.log(`found ${RayState[exploreState]}`);
    if (exploreState === RayState.ToCycle) {
      const next = moveInDirection(at, direction);
      visited.setChar(next[0], next[1], 'O');
    }
  }

  // const visitedWithRays = visited.clone();
  // for (let i = 0; i < visited.rows; i++) {
  //   for (let j = 0; j < visited.columns; j++) {
  //     const ch = visited.getChar(i, j);
  //     if (ch === '.') {
  //     }
  //   }
  // }

  await writeFile(
    getDataPath('output/puzzle06_rays.txt'),
    Array.from(visited.enumerateLines(), line => line + '\n').join(''),
    {encoding: 'utf8'}
  );

  // rays.set(start[0], start[1], rays.get(start[0], start[1]) & ~STOP_FLAG & 0xFFFF);
  // 446 is too low
  console.log(`Puzzle 06 (advanced): ${visited.count(v => v === 'O'.charCodeAt(0))}`);
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

// function fillBackwardRay(
//   grid: Grid,
//   rays: Grid,
//   from: Vector,
//   forward: Direction
// ): void {
//   let at = from;
//   while (true) {
//     const next = moveInDirection(at, forward);
//     if (grid.tryGetChar(next[0], next[1], '#') === '#') {
//       break;
//     }
//     at = next;
//   }

//   const backward = rotateClockwise(rotateClockwise(forward));
//   while (true) {
//     rays.set(at[0], at[1], rays.get(at[0], at[1]) | DIRECTION_TO_FLAG[forward]);
//     const next = moveInDirection(at, backward);
//     if (grid.tryGetChar(next[0], next[1], '#') === '#') {
//       break;
//     }
//     at = next;
//   }
// };

enum RayState {
  Exploring = 1,
  ToCycle = 2,
  ToFree = 3,
}

function* walkGrid(grid: Grid, from: Vector, fromDirection: Direction): Iterable<[Vector, Direction]> {
  let at = from;
  let direction = fromDirection;
  while (true) {
    yield [at, direction];
    const next = moveInDirection(at, direction);
    switch (grid.tryGetChar(next[0], next[1], ' ')) {
      case ' ': {
        return;
      }
      case '#': {
        direction = rotateClockwise(direction);
        break;
      }
      default: {
        at = next;
        break;
      }
    }
  }
};

// const DIRECTION_TO_FLAG = {
//   '^': DirectionFlag.Up,
//   '>': DirectionFlag.Right,
//   'v': DirectionFlag.Down,
//   '<': DirectionFlag.Left,
// } as const;

const FLAG_TO_CHAR = '.^>┐v|┘├<┌-┴└┤┬┼OÄ»╗Ü║╝╠«╔═╩╚╣╦╬Ø';

(async function main() {
  // await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
