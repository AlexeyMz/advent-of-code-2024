import { readFile } from 'node:fs/promises';

import { getDataPath } from './core/project.mjs';

export async function solvePuzzle01Basic() {
  const content = await readFile(getDataPath('input/puzzle01.txt'), {encoding: 'utf8'});
  const [leftList, rightList] = parseLists(content);

  leftList.sort((a, b) => a - b);
  rightList.sort((a, b) => a - b);

  let totalDifference = 0;
  for (let i = 0; i < leftList.length; i++) {
    totalDifference += Math.abs(leftList[i] - rightList[i]);
  }

  console.log(`Puzzle 01 (basic): ${totalDifference}`);
}

export async function solvePuzzle01Advanced() {
  const content = await readFile(getDataPath('input/puzzle01.txt'), {encoding: 'utf8'});
  const [leftList, rightList] = parseLists(content);

  const rightCounts = new Map<number, number>();
  for (const value of rightList) {
    rightCounts.set(value, (rightCounts.get(value) ?? 0) + 1);
  }

  let similarityScore = 0;
  for (const value of leftList) {
    similarityScore += value * (rightCounts.get(value) ?? 0);
  }

  console.log(`Puzzle 01 (advanced): ${similarityScore}`);
}

function parseLists(content: string): readonly[number[], number[]] {
  const leftList: number[] = [];
  const rightList: number[] = [];

  for (const line of content.split(/\r?\n/g)) {
    if (!line) {
      continue;
    }
    const match = /^([0-9]+)\s+([0-9]+)$/.exec(line);
    if (!match) {
      throw new Error('Invalid pair: ' + line);
    }
    const [, fromId, toId] = match;
    leftList.push(Number(fromId));
    rightList.push(Number(toId));
  }

  return [leftList, rightList];
}

(async function main() {
  await solvePuzzle01Basic();
  await solvePuzzle01Advanced();
})();
