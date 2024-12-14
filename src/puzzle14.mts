import { readFile, writeFile } from 'node:fs/promises';

import { NumericGrid, CharGrid } from './core/grid.mjs';
import { modulo } from './core/math.mjs';
import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle14.txt'), {encoding: 'utf8'});
  const robots = parseRobots(content);

  // const room = NumericGrid.empty(7, 11);
  const room = NumericGrid.empty(103, 101);

  const roomSize: Vector = [room.columns, room.rows];
  for (const robot of robots) {
    const [x, y] = robotPositionAfterTime(robot, 100, roomSize);
    room.set(y, x, room.get(y, x) + 1);
  }

  await writeFile(
    getDataPath('output/puzzle14_after100.txt'),
    Array.from(CharGrid.from(room, countToChar).lines()).join(''),
    {encoding: 'utf8'}
  );

  const factor = computeSafetyFactor(room);
  console.log(`Puzzle 14 (basic): ${factor}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle14.txt'), {encoding: 'utf8'});
  const robots = parseRobots(content);

  const room = NumericGrid.empty(103, 101);

  const roomSize: Vector = [room.columns, room.rows];
  const factors: number[] = [];
  let targetTime: number | undefined;
  for (let i = 0; i < 10_000; i++) {
    room.fill(0);
    for (const robot of robots) {
      const [x, y] = robotPositionAfterTime(robot, i, roomSize);
      room.set(y, x, room.get(y, x) + 1);
    }
    const factor = computeSafetyFactor(room);
    factors.push(factor);
    if (targetTime === undefined && factor < 50_000_000) {
      targetTime = i;
    }
  }

  await writeFile(
    getDataPath('output/puzzle14_factors.txt'),
    factors.map(f => String(f)).join('\n'),
    {encoding: 'utf8'}
  );

  if (targetTime !== undefined) {
    room.fill(0);
    for (const robot of robots) {
      const [x, y] = robotPositionAfterTime(robot, targetTime, roomSize);
      room.set(y, x, room.get(y, x) + 1);
    }
    await writeFile(
      getDataPath('output/puzzle14_easterEgg.txt'),
      Array.from(CharGrid.from(room, countToChar).lines()).join(''),
      {encoding: 'utf8'}
    );
  }

  console.log(`Puzzle 14 (advanced): ${targetTime}`);
}

type Vector = readonly [x: number, y: number];

interface Robot {
  readonly index: number;
  readonly position: Vector;
  readonly velocity: Vector;
}

function parseRobots(content: string): Robot[] {
  const result: Robot[] = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    const match = /^p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)$/.exec(line);
    if (!match) {
      throw new Error(`Invalid robot line: ${line}`);
    }
    const [, x, y, vx, vy] = Array.from(match, n => Number(n));
    result.push({
      index: result.length,
      position: [x, y],
      velocity: [vx, vy],
    });
  }

  return result;
}

function robotPositionAfterTime(robot: Robot, seconds: number, roomSize: Vector): Vector {
  let [x, y] = robot.position;
  const [vx, vy] = robot.velocity;
  const [width, height] = roomSize;
  const rx = modulo(x + vx * seconds, width);
  const ry = modulo(y + vy * seconds, height);
  return [rx, ry];
}

function computeSafetyFactor(room: NumericGrid): number {
  const halfRow = Math.floor(room.rows / 2);
  const halfColumn = Math.floor(room.columns / 2);
  let totalTL = 0;
  let totalTR = 0;
  let totalBL = 0;
  let totalBR = 0;
  for (let i = 0; i < room.rows; i++) {
    for (let j = 0; j < room.columns; j++) {
      const count = room.get(i, j);
      if (i < halfRow) {
        if (j < halfColumn) {
          totalTL += count;
        } else if (j > halfColumn) {
          totalBL += count;
        }
      } else if (i > halfRow) {
        if (j < halfColumn) {
          totalTR += count;
        } else if (j > halfColumn) {
          totalBR += count;
        }
      }
    }
  }
  return totalTL * totalTR * totalBL * totalBR;
}

const COUNT_TO_CHAR = '.123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function countToChar(n: number): string {
  return COUNT_TO_CHAR[n] ?? '!';
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
