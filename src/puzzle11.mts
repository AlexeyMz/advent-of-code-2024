import { readFile } from 'node:fs/promises';

import { DoubleLinked } from './core/linkedList.mjs';
import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle11.txt'), {encoding: 'utf8'});
  const line = parseStoneLine(content);

  for (let i = 0; i < 25; i++) {
    blinkOnLinkedLine(line);
    // console.log(Array.from(DoubleLinked.enumerate(line), s => s.value).join(' '));
  }

  console.log(`Puzzle 11 (basic): ${DoubleLinked.count(line)}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle11.txt'), {encoding: 'utf8'});
  const line = parseStoneLine(content);

  let lineMain = new Map<bigint, number>();
  let lineNext = new Map<bigint, number>();

  for (const stone of DoubleLinked.enumerate(line)) {
    lineMain.set(stone.value, (lineMain.get(stone.value) ?? 0) + 1);
  }

  for (let i = 0; i < 75; i++) {
    blinkOnMappedLine(lineMain, lineNext);
    [lineMain, lineNext] = [lineNext, lineMain];
    lineNext.clear();
  }

  let total = 0;
  for (const count of lineMain.values()) {
    total += count;
  }

  console.log(`Puzzle 11 (advanced): ${total}`);
}

interface Stone extends DoubleLinked.Node<Stone> {
  value: bigint;
}

type StoneLine = DoubleLinked.List<Stone>;

function parseStoneLine(content: string): StoneLine {
  const line: StoneLine = {
    ...DoubleLinked.empty(),
  };
  for (const item of content.trim().split(' ')) {
    DoubleLinked.insertLast(line, {value: BigInt(item)});
  }
  return line;
}

function blinkOnLinkedLine(line: StoneLine): void {
  let node = line.first;
  while (node) {
    const next = node.next;
    if (node.value === 0n) {
      node.value = 1n;
    } else {
      const valueString = String(node.value);
      if (valueString.length % 2 === 0) {
        const first = BigInt(valueString.substring(0, valueString.length / 2));
        const second = BigInt(valueString.substring(valueString.length / 2));
        node.value = first;
        DoubleLinked.insertAfter(line, node, {value: second});
      } else {
        node.value *= 2024n;
      }
    }
    node = next;
  }
}

function blinkOnMappedLine(
  from: ReadonlyMap<bigint, number>,
  into: Map<bigint, number>
): void {
  for (const [value, count] of from) {
    if (value === 0n) {
      addStones(into, 1n, count);
    } else {
      const valueString = String(value);
      if (valueString.length % 2 === 0) {
        const first = BigInt(valueString.substring(0, valueString.length / 2));
        const second = BigInt(valueString.substring(valueString.length / 2));
        addStones(into, first, count);
        addStones(into, second, count);
      } else {
        addStones(into, value * 2024n, count);
      }
    }
  }
}

function addStones(line: Map<bigint, number>, value: bigint, count: number): void {
  line.set(value, (line.get(value) ?? 0) + count);
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
