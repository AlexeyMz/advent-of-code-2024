import { readFile } from 'node:fs/promises';

import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle02.txt'), {encoding: 'utf8'});
  const reports = parseReports(content);

  let safeCount = 0;
  for (const report of reports) {
    if (isSafeReport(report, 1, 3) || isSafeReport(report, -3, -1)) {
      safeCount++;
    }
  }

  console.log(`Puzzle 02 (basic): ${safeCount}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle02.txt'), {encoding: 'utf8'});
  const reports = parseReports(content);

  let safeCount = 0;
  for (const report of reports) {
    if (isSafeReport(report, 1, 3, true) || isSafeReport(report, -3, -1, true)) {
      safeCount++;
    }
  }

  console.log(`Puzzle 02 (advanced): ${safeCount}`);
}

function parseReports(content: string): Array<number[]> {
  const reports: Array<number[]> = [];
  for (const line of content.split(/\r?\n/g)) {
    if (!line) {
      continue;
    }
    const report = line.split(' ').map(item => Number(item));
    reports.push(report);
  }
  return reports;
}

function isSafeReport(
  report: readonly number[],
  minDiff: number,
  maxDiff: number,
  allowSkip = false,
  skipAt?: number
): boolean {
  const end = rangeEnd(report.length, skipAt);
  let previous = rangeStart(report.length, skipAt);
  for (let i = rangeNext(previous, skipAt); i < end; i = rangeNext(i, skipAt)) {
    const diff = report[i] - report[previous];
    if (diff < minDiff || diff > maxDiff) {
      if (allowSkip) {
        return (
          isSafeReport(report, minDiff, maxDiff, false, previous) ||
          isSafeReport(report, minDiff, maxDiff, false, i)
        );
      }
      return false;
    }
    previous = i;
  }
  return true;
}

function rangeStart(_length: number, skipAt: number | undefined): number {
  return skipAt === 0 ? 1 : 0;
}

function rangeEnd(length: number, skipAt: number | undefined): number {
  return skipAt === length ? length - 1 : length;
}

function rangeNext(index: number, skipAt: number | undefined): number {
  return index + 1 === skipAt ? index + 2 : index + 1;
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
