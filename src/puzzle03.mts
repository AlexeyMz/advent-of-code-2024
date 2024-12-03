import { readFile } from 'node:fs/promises';

import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle03.txt'), {encoding: 'utf8'});

  let total = 0;
  for (const line of content.split(/\r?\n/g)) {
    const regex = /mul\((\d{1,3}),(\d{1,3})\)/g;
    let match: RegExpExecArray | null;
    while (match = regex.exec(line)) {
      const x = Number(match[1]);
      const y = Number(match[2]);
      total += x * y;
    }
  }

  console.log(`Puzzle 03 (basic): ${total}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle03.txt'), {encoding: 'utf8'});

  let enabled = true;
  let total = 0;
  for (const line of content.split(/\r?\n/g)) {
    const regex = /(mul)\((\d{1,3}),(\d{1,3})\)|(do)\(\)|(don't)\(\)/g;
    let match: RegExpExecArray | null;
    while (match = regex.exec(line)) {
      const [_, opMul, x, y, opDo, opDont] = match;
      if (opMul) {
        if (enabled) {
          total += Number(x) * Number(y);
        }
      } else if (opDo) {
        enabled = true;
      } else if (opDont) {
        enabled = false;
      }
    }
  }

  console.log(`Puzzle 03 (advanced): ${total}`);
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
