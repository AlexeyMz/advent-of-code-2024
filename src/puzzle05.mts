import { readFile, writeFile } from 'node:fs/promises';

import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle05.txt'), {encoding: 'utf8'});
  const [dependencies, updates] = parseGraph(content);

  await writeFile(
    getDataPath('output/puzzle06_graph.ttl'),
    generateTurtle(dependencies, updates),
    {encoding: 'utf8'}
  );

  const visited = new Set<number>();

  const visit = (page: number, only: ReadonlySet<number>): void => {
    if (!visited.has(page) && only.has(page)) {
      visited.add(page);
      const required = dependencies.get(page);
      if (required) {
        for (const other of required) {
          visit(other, only);
        }
      }
    }
  };

  let total = 0;
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const updateSet = new Set(update);
    let valid = true;
    for (const page of [...update].reverse()) {
      if (visited.has(page)) {
        valid = false;
        break;
      }
      visit(page, updateSet);
    }
    if (valid) {
      console.log(`#${String(i + 1).padStart(2, '0')}`, update.join(','));
      total += update[Math.floor(update.length / 2)];
    }
    visited.clear();
  }

  console.log(`Puzzle 05 (basic): ${total}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle05.txt'), {encoding: 'utf8'});
  const [dependencies, updates] = parseGraph(content);

  const visited = new Set<number>();
  const order: number[] = [];

  const visit = (page: number, only: ReadonlySet<number>): void => {
    if (!visited.has(page) && only.has(page)) {
      visited.add(page);
      const required = dependencies.get(page);
      if (required) {
        for (const other of required) {
          visit(other, only);
        }
      }
      order.push(page);
    }
  };

  let total = 0;
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const updateSet = new Set(update);
    let valid = true;
    for (const page of [...update].reverse()) {
      if (visited.has(page)) {
        valid = false;
      }
      visit(page, updateSet);
    }
    if (!valid) {
      order.reverse();
      console.log(`#${String(i + 1).padStart(2, '0')}`, update.join(','), ':', order.join(','));
      total += order[Math.floor(order.length / 2)];
    }
    visited.clear();
    order.length = 0;
  }

  console.log(`Puzzle 05 (advanced): ${total}`);
}

type PageToDependencies = ReadonlyMap<number, ReadonlySet<number>>;
type PageUpdates = ReadonlyArray<readonly number[]>;

function parseGraph(content: string): [PageToDependencies, PageUpdates] {
  const dependencies = new Map<number, Set<number>>();
  const updates: Array<number[]> = [];

  let parsingDependencies = true;
  for (const line of content.split(/\r?\n/g)) {
    if (parsingDependencies) {
      if (line) {
        const [from, to] = line.split('|').map(Number);
        let toSet = dependencies.get(from);
        if (!toSet) {
          toSet = new Set();
          dependencies.set(from, toSet);
        }
        toSet.add(to);
      } else {
        parsingDependencies = false;
      }
    } else {
      if (line) {
        const pages = line.split(',').map(Number);
        updates.push(pages);
      }
    }
  }

  return [dependencies, updates];
}

function generateTurtle(
  dependencies: PageToDependencies,
  updates: PageUpdates
): string {
  const prefix = 'urn:aoc2024:day05';

  const allPages = new Set<number>();
  const lines: string[] = [];

  function makePageIri(from: number): string {
    return `${prefix}:page:${String(from).padStart(2, '0')}`;
  }

  for (const [from, toSet] of dependencies) {
    const fromIri = makePageIri(from);
    allPages.add(from);
    for (const to of toSet) {
      const toIri = makePageIri(to);
      lines.push(`<${fromIri}> <${prefix}:dependsOn> <${toIri}> .`);
      allPages.add(to);
    }
  }

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const updateIri = `${prefix}:update:${String(i + 1).padStart(2, '0')}`;
    lines.push(`<${updateIri}> a <${prefix}:Update> .`);
    for (let j = 0; j < update.length; j++) {
      allPages.add(update[j]);
      const pageIri = makePageIri(update[j]);
      const triple = `<${updateIri}> <${prefix}:includesPage> <${pageIri}>`;
      lines.push(
        triple + ' .',
        `<<${triple}>> <${prefix}:atIndex> ${j} .`
      );
    }
  }

  for (const page of Array.from(allPages).sort()) {
    const pageIri = makePageIri(page);
    lines.push(
      `<${pageIri}> a <${prefix}:Page> ;`,
      `  <${prefix}:hasNumber> ${page} .`
    );
  }

  return lines.join('\n');
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
