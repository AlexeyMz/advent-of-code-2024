import { readFile, writeFile } from 'node:fs/promises';

import { CharGrid } from './core/grid.mjs';
import { formatElapsedTime } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle08.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  const startTime = performance.now();

  const allAntennas = findAntennas(grid);
  const antinodes = grid.clone();
  for (const group of allAntennas.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        for (const [nodeRow, nodeColumn] of computeAntinodes(group[i], group[j])) {
          antinodes.trySet(nodeRow, nodeColumn, '#');
        }
      }
    }
  }

  const endTime = performance.now();
  console.log(`Found antinodes in ${formatElapsedTime(endTime - startTime)}`);

  await writeFile(
    getDataPath('output/puzzle08_anitnodes.txt'),
    Array.from(antinodes.lines()).join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 08 (basic): ${antinodes.count(v => v === '#')}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle08.txt'), {encoding: 'utf8'});
  const grid = CharGrid.fromLines(content.split(/\r?\n/g).filter(line => line));

  const startTime = performance.now();

  const allAntennas = findAntennas(grid);
  const antinodes = grid.clone();
  for (const group of allAntennas.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        markResonantAntinodes(group[i], group[j], antinodes);
      }
    }
  }

  const endTime = performance.now();
  console.log(`Found antinodes in ${formatElapsedTime(endTime - startTime)}`);

  await writeFile(
    getDataPath('output/puzzle08_resonant.txt'),
    Array.from(antinodes.lines()).join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 08 (advanced): ${antinodes.count(v => v === '#')}`);
}

type Vector = readonly [row: number, column: number];

function findAntennas(grid: CharGrid): Map<string, Vector[]> {
  const result = new Map<string, Vector[]>();
  for (let i = 0; i < grid.rows; i++) {
    for (let j = 0; j < grid.columns; j++) {
      const antenna = grid.get(i, j);
      if (!/[a-zA-Z0-9]/.test(antenna)) {
        continue;
      }
      let group = result.get(antenna);
      if (!group) {
        group = [];
        result.set(antenna, group);
      }
      group.push([i, j]);
    }
  }
  return result;
}

function computeAntinodes(first: Vector, second: Vector): [Vector, Vector] {
  const diffRow = second[0] - first[0];
  const diffColumn = second[1] - first[1];
  return [
    [first[0] - diffRow, first[1] - diffColumn],
    [second[0] + diffRow, second[1] + diffColumn],
  ];
}

function markResonantAntinodes(first: Vector, second: Vector, antinodes: CharGrid): void {
  const diffRow = second[0] - first[0];
  const diffColumn = second[1] - first[1];

  let [row, column] = first;
  while (true) {
    if (!antinodes.valid(row, column)) {
      break;
    }
    antinodes.set(row, column, '#');
    row -= diffRow;
    column -= diffColumn;
  }

  [row, column] = second;
  while (true) {
    if (!antinodes.valid(row, column)) {
      break;
    }
    antinodes.set(row, column, '#');
    row += diffRow;
    column += diffColumn;
  }
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
