import { readFile, writeFile } from 'node:fs/promises';

import { CharGrid, NumericGrid } from './core/grid.mjs';
import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle12.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  interface Region {
    readonly index: number;
    readonly plant: string;
    area: number;
    perimeter: number;
  }

  const visited = NumericGrid.empty(grid.rows, grid.columns);
  const visit = (row: number, column: number, region: Region): void => {
    if (visited.get(row, column) !== 0) {
      return;
    }
    visited.set(row, column, region.index);
    region.area++;
    for (const [shiftRow, shiftColumn] of DIRECTIONS) {
      const nextRow = row + shiftRow;
      const nextColumn = column + shiftColumn;
      if (
        grid.valid(nextRow, nextColumn) &&
        grid.get(nextRow, nextColumn) === region.plant
      ) {
        visit(nextRow, nextColumn, region);
      } else {
        region.perimeter++;
      }
    }
  };

  const regions: Region[] = [];
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (!visited.get(i, j)) {
        const region: Region = {
          index: regions.length + 1,
          plant: grid.get(i, j),
          area: 0,
          perimeter: 0,
        };
        visit(i, j, region);
        regions.push(region);
      }
    }
  }

  let totalCost = 0;
  for (const region of regions) {
    totalCost += region.area * region.perimeter;
  }

  console.log(`Puzzle 12 (basic): ${totalCost}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle12.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  interface Region {
    readonly index: number;
    readonly plant: string;
    area: number;
    sides: number;
  }

  const isSideLeader = (
    row: number,
    column: number,
    shiftRow: number,
    shiftColumn: number
  ): boolean => {
    const rotatedRow = shiftColumn;
    const rotatedColumn = -shiftRow;
    const plant = grid.get(row, column);
    if (grid.tryGet(row + shiftRow, column + shiftColumn, ' ') === plant) {
      return false;
    }
    const sideRow = row + rotatedRow;
    const sideColumn = column + rotatedColumn;
    return !(
      grid.tryGet(sideRow, sideColumn, ' ') === plant &&
      grid.tryGet(sideRow + shiftRow, sideColumn + shiftColumn, ' ') !== plant
    );
  };

  const visited = NumericGrid.empty(grid.rows, grid.columns);
  const sides = NumericGrid.empty(grid.rows, grid.columns);
  const visit = (row: number, column: number, region: Region): void => {
    if (visited.get(row, column) !== 0) {
      return;
    }
    visited.set(row, column, region.index);
    region.area++;
    for (const [shiftRow, shiftColumn] of DIRECTIONS) {
      const nextRow = row + shiftRow;
      const nextColumn = column + shiftColumn;
      if (
        grid.valid(nextRow, nextColumn) &&
        grid.get(nextRow, nextColumn) === region.plant
      ) {
        visit(nextRow, nextColumn, region);
      } else {
        let sideFlag = sides.get(row, column) | shiftToSide(shiftRow, shiftColumn);
        if (isSideLeader(row, column, shiftRow, shiftColumn)) {
          region.sides++;
          sideFlag |= SideFlag.Leader;
        }
        sides.set(row, column, sideFlag);
      }
    }
  };

  const regions: Region[] = [];
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      if (!visited.get(i, j)) {
        const region: Region = {
          index: regions.length + 1,
          plant: grid.get(i, j),
          area: 0,
          sides: 0,
        };
        visit(i, j, region);
        regions.push(region);
      }
    }
  }

  await writeFile(
    getDataPath('output/puzzle12_regions.txt'),
    Array.from(CharGrid.from(sides, sideFlagToChar).lines()).join(''),
    {encoding: 'utf8'}
  );

  let totalCost = 0;
  for (const region of regions) {
    totalCost += region.area * region.sides;
  }

  console.log(`Puzzle 12 (advanced): ${totalCost}`);
}

const DIRECTIONS = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
] as const;

enum SideFlag {
  None = 0,
  Up = 1,
  Right = 2,
  Down = 4,
  Left = 8,
  Leader = 16,
}

function shiftToSide(shiftRow: number, shiftColumn: number): SideFlag {
  return (
    shiftRow === -1 ? SideFlag.Up :
    shiftRow === 1 ? SideFlag.Down :
    shiftColumn === -1 ? SideFlag.Left :
    shiftColumn === 1 ? SideFlag.Right :
    SideFlag.None
  );
}

const SIDE_TO_CHAR = '.^>└v|┌├<┘-┴┐┤┬┼OÄ»╚Ü║╔╠«╝═╩╗╣╦╬Ø';

function sideFlagToChar(flags: number): string {
  return SIDE_TO_CHAR[flags] ?? '?';
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
