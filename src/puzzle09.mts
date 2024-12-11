import { readFile, writeFile } from 'node:fs/promises';

import { DoubleLinked } from './core/linkedList.mjs';
import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle09.txt'), {encoding: 'utf8'});
  const disk = parseBlockList(content.trim());

  await writeFile(
    getDataPath('output/puzzle09_disk.txt'),
    Array.from(DoubleLinked.enumerate(disk), block =>
      Array.from({length: block.size}, () => block.id ?? '.').join('')
    ).join(''),
    {encoding: 'utf8'}
  );

  let start = disk.first;
  let end = disk.last;
  while (true) {
    while (start && start.id !== undefined && start !== end) {
      start = start.next;
    }

    while (end && end.id === undefined && start !== end) {
      end = end.previous;
    }

    if (!(start && end && start !== end)) {
      break;
    }

    const diff = start.size - end.size;
    if (diff < 0) {
      start.id = end.id;
      end.size = Math.abs(diff);
      DoubleLinked.insertAfter(disk, end, {id: undefined, size: start.size});
    } else if (diff > 0) {
      DoubleLinked.insertAfter(disk, start, {id: undefined, size: diff});
      start.id = end.id;
      start.size = end.size;
      end.id = undefined;
    } else {
      start.id = end.id;
      end.id = undefined;
    }
  }

  await writeFile(
    getDataPath('output/puzzle09_defragmented1.txt'),
    Array.from(DoubleLinked.enumerate(disk), block =>
      Array.from({length: block.size}, () => block.id ?? '.').join('')
    ).join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 09 (basic): ${checksumBlockList(disk)}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle09.txt'), {encoding: 'utf8'});
  const disk = parseBlockList(content.trim());

  const freeBlocks: Block[] = [];
  for (const block of DoubleLinked.enumerate(disk)) {
    if (block.id === undefined) {
      freeBlocks.push(block);
    }
  }
  const freeTree = constructFreeTree(freeBlocks, 0, freeBlocks.length);
  let freeRighmost: FreeLeafNode | undefined = findRightmostLeaf(freeTree);

  let block = disk.last;
  while (true) {
    while (block && block.id === undefined) {
      if (freeRighmost && freeRighmost.block === block) {
        freeRighmost.block = undefined;
        updateFreeNodeRangeUp(freeRighmost);
        freeRighmost = getLeftSiblingLeaf(freeRighmost);
      }
      block = block.previous;
    }

    if (!block) {
      break;
    }

    const free = findFreeNode(freeTree, block.size);
    if (free && free.block) {
      const leftFree: Block = {
        id: undefined,
        size: free.block.size - block.size,
      };
      DoubleLinked.insertAfter(disk, free.block, leftFree);
      free.block.id = block.id;
      free.block.size = block.size;
      free.block = leftFree;
      updateFreeNodeRangeUp(free);
      block.id = undefined;
    }
    block = block.previous;
  }

  await writeFile(
    getDataPath('output/puzzle09_defragmented2.txt'),
    Array.from(DoubleLinked.enumerate(disk), block =>
      Array.from({length: block.size}, () => block.id ?? '.').join('')
    ).join(''),
    {encoding: 'utf8'}
  );

  console.log(`Puzzle 09 (advanced): ${checksumBlockList(disk)}`);
}

interface Block extends DoubleLinked.Node<Block> {
  id: number | undefined;
  size: number;
}

type BlockList = DoubleLinked.List<Block>;

function parseBlockList(line: string): BlockList {
  const list: BlockList = {
    ...DoubleLinked.empty(),
  };
  let nextIndex = 0;
  let nextFree = false;
  for (let i = 0; i < line.length; i++) {
    const blockSize = Number(line[i]);
    if (blockSize) {
      const block: Block = {
        id: nextFree ? undefined : nextIndex,
        size: blockSize,
        previous: undefined,
        next: undefined,
      };
      DoubleLinked.insertLast(list, block);
    }
    nextIndex += nextFree ? 0 : 1;
    nextFree = !nextFree;
  }
  return list;
}

function checksumBlockList(list: BlockList): number {
  let index = 0;
  let total = 0;
  for (const block of DoubleLinked.enumerate(list)) {
    for (let i = 0; i < block.size; i++) {
      if (block.id !== undefined) {
        total += index * block.id;
      }
      index++;
    }
  }
  return total;
}

type FreeNode = FreeLeafNode | FreeRangeNode;

interface FreeLeafNode {
  type: 'leaf';
  parent?: FreeRangeNode;
  min: number;
  max: number;
  block?: Block;
}

interface FreeRangeNode {
  type: 'range';
  parent?: FreeRangeNode;
  min: number;
  max: number;
  left: FreeNode;
  right: FreeNode;
}

function constructFreeTree(blocks: readonly Block[], from: number, to: number): FreeNode {
  if (to - from <= 1) {
    const block = blocks[from];
    return {
      type: 'leaf',
      min: block.size,
      max: block.size,
      block,
    };
  } else {
    const middle = from + Math.ceil((to - from) / 2);
    const left = constructFreeTree(blocks, from, middle);
    const right = constructFreeTree(blocks, middle, to);
    const parent: FreeRangeNode = {
      type: 'range',
      min: Math.min(left.min, right.min),
      max: Math.max(left.max, right.max),
      left,
      right,
    };
    left.parent = parent;
    right.parent = parent;
    return parent;
  }
}

function findRightmostLeaf(node: FreeNode): FreeLeafNode {
  let current = node;
  while (current.type === 'range') {
    current = current.right;
  }
  return current;
}

function getLeftSiblingLeaf(node: FreeLeafNode): FreeLeafNode | undefined {
  let up: FreeNode = node;
  while (up.parent && up.parent.left === up) {
    up = up.parent;
  }

  if (up.parent) {
    let down = up.parent.left;
    while (down.type === 'range') {
      down = down.right;
    }
    return down;
  }

  return undefined;
}

function findFreeNode(node: FreeNode, size: number): FreeLeafNode | undefined {
  if (node.type === 'leaf') {
    return node.block && size <= node.block.size ? node : undefined;
  } else if (size <= node.left.max) {
    return findFreeNode(node.left, size);
  } else if (size <= node.right.max) {
    return findFreeNode(node.right, size);
  } else {
    return undefined;
  }
}

function updateFreeNodeRangeUp(node: FreeNode): void {
  if (node.type === 'leaf') {
    node.min = node.block ? node.block.size : 0;
    node.max = node.block ? node.block.size : 0;
  } else {
    node.min = Math.min(node.left.min, node.right.min);
    node.max = Math.max(node.left.max, node.right.max);
  }

  if (node.parent) {
    updateFreeNodeRangeUp(node.parent);
  }
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
