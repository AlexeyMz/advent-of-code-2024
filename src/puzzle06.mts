import { readFile, writeFile } from 'node:fs/promises';

import { CharGrid, NumericGrid } from './core/grid.mjs';
import { formatElapsedTime } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle06.txt'), {encoding: 'utf8'});

  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));
  let visited = grid.clone();

  let position = findStart(grid);
  let direction: Direction = '^';
  while (true) {
    if (!visited.trySet(position[0], position[1], 'X')) {
      break;
    }
    const next = moveInDirection(position, direction);
    if (visited.tryGet(next[0], next[1], ' ') === '#') {
      direction = rotateClockwise(direction);
    } else {
      position = next;
    }
  }

  await writeFile(
    getDataPath('output/puzzle06_visited.txt'),
    Array.from(visited.lines()).join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 06 (basic): ${visited.count(v => v === 'X')}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle06.txt'), {encoding: 'utf8'});

  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));
  const start = findStart(grid);
  const explored = NumericGrid.empty(grid.rows, grid.columns, 0);
  const totalExplored = explored.clone();

  const exploreCycle = (from: Vector, fromDirection: Direction): boolean => {
    const obstacleAt = moveInDirection(from, fromDirection);
    const previousAtObstacle = grid.get(obstacleAt[0], obstacleAt[1]);
    if (previousAtObstacle !== '.') {
      return false;
    }
    grid.set(obstacleAt[0], obstacleAt[1], '#');

    explored.fill(0);

    const startDirection = rotateClockwise(fromDirection);
    const start = moveInDirection(from, startDirection);
    let foundCycle = false;
    for (const [at, direction] of walkGrid(grid, start, startDirection)) {
      const state = explored.get(at[0], at[1]);
      const directionFlag = DIRECTION_TO_FLAG[direction];
      if (state & directionFlag) {
        foundCycle = true;
        break;
      }
      explored.set(at[0], at[1], state | directionFlag);
    }

    grid.set(obstacleAt[0], obstacleAt[1], previousAtObstacle);
    if (foundCycle) {
      totalExplored.joinFrom(explored, (a, b) => a | b);
    }
    return foundCycle;
  };

  const obstacles = grid.clone();
  const startTime = performance.now();
  let steps = 0;
  for (const [at, direction] of walkGrid(grid, start, '^')) {
    steps++;
    if (exploreCycle(at, direction)) {
      const obstacleAt = moveInDirection(at, direction);
      obstacles.set(obstacleAt[0], obstacleAt[1], 'O');

      // const cycle = grid.clone();
      // for (let i = 0; i < obstacles.rows; i++) {
      //   for (let j = 0; j < obstacles.columns; j++) {
      //     let flags = explored.get(i, j);
      //     if (i === obstacleAt[0] && j === obstacleAt[1]) {
      //       flags |= ExploreFlag.Obstacle;
      //     }
      //     if (flags) {
      //       cycle.set(i, j, FLAG_TO_CHAR[flags] ?? '?');
      //     }
      //   }
      // }
      // cycle.set(at[0], at[1], 'S');
      // await writeFile(
      //   getDataPath('output/puzzle06_cycle.txt'),
      //   Array.from(cycle.lines()).join(''),
      //   {encoding: 'utf8'}
      // );
      // void 0;
    }
    if (obstacles.get(at[0], at[1]) === '.') {
      obstacles.set(at[0], at[1], direction);
    }
  }
  const endTime = performance.now();
  console.log(`Visited ${steps} steps in ${formatElapsedTime(endTime - startTime)}`);

  obstacles.set(start[0], start[1], 'S');
  await writeFile(
    getDataPath('output/puzzle06_obstacles.txt'),
    Array.from(obstacles.lines()).join(''),
    {encoding: 'utf8'}
  );

  // 446 is too low
  // 1798 is too high
  console.log(`Puzzle 06 (advanced): ${obstacles.count(v => v === 'O')}`);
}

type Vector = readonly [row: number, column: number];
type Direction = '^' | 'v' | '<' | '>';

function findStart(grid: CharGrid): Vector {
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (grid.get(i, j) === '^') {
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

function* walkGrid(grid: CharGrid, from: Vector, fromDirection: Direction): Iterable<[Vector, Direction]> {
  let at = from;
  let direction = fromDirection;
  while (true) {
    yield [at, direction];
    const next = moveInDirection(at, direction);
    switch (grid.tryGet(next[0], next[1], ' ')) {
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

enum ExploreFlag {
  Up = 1,
  Right = 2,
  Down = 4,
  Left = 8,
  Obstacle = 16,
}

const DIRECTION_TO_FLAG = {
  '^': ExploreFlag.Up,
  '>': ExploreFlag.Right,
  'v': ExploreFlag.Down,
  '<': ExploreFlag.Left,
} as const;

const FLAG_TO_CHAR = '.^>└v|┌├<┘-┴┐┤┬┼OÄ»╚Ü║╔╠«╝═╩╗╣╦╬Ø';

(async function main() {
  // await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
