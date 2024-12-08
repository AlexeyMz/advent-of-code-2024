import { readFile } from 'node:fs/promises';

import { formatElapsedTime } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle07.txt'), {encoding: 'utf8'});
  const equations = parseEquations(content.split(/\r?\n/g));

  const startTime = performance.now();
  let total = 0n;
  for (const equation of equations) {
    if (checkEquationBasic(equation)) {
      total += equation.expected;
    }
  }
  const endTime = performance.now();
  console.log(`Checked euations in ${formatElapsedTime(endTime - startTime)}`);

  console.log(`Puzzle 07 (basic): ${total}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle07.txt'), {encoding: 'utf8'});
  const equations = parseEquations(content.split(/\r?\n/g));

  const startTime = performance.now();
  let total = 0n;
  for (const equation of equations) {
    if (checkEquationAdvanced(equation)) {
      total += equation.expected;
    }
  }
  const endTime = performance.now();
  console.log(`Checked euations in ${formatElapsedTime(endTime - startTime)}`);

  console.log(`Puzzle 07 (advanced): ${total}`);
}

interface Equation {
  readonly expected: bigint;
  readonly terms: readonly bigint[];
}

function parseEquations(lines: readonly string[]) {
  const equations: Equation[] = [];
  for (const line of lines) {
    if (!line) {
      continue;
    }
    const [rawExpected, rawTerms] = line.split(':');
    equations.push({
      expected: BigInt(rawExpected),
      terms: rawTerms.split(' ')
        .map(term => term.trim())
        .filter(term => term)
        .map(BigInt)
    });
  }
  return equations;
}

function checkEquationBasic(equation: Equation): boolean {
  return checkExpressionBasic(equation.terms, equation.terms.length, equation.expected);
}

function checkExpressionBasic(terms: readonly bigint[], tailCount: number, expected: bigint): boolean {
  const term = terms[tailCount - 1];
  if (tailCount === 1) {
    return term === expected;
  }
  if (expected % term === 0n && checkExpressionBasic(terms, tailCount - 1, expected / term)) {
    return true;
  } else if (term <= expected && checkExpressionBasic(terms, tailCount - 1, expected - term)) {
    return true;
  }
  return false;
}

function checkEquationAdvanced(equation: Equation): boolean {
  return checkExpressionAdvanced(equation.terms, equation.terms.length, equation.expected);
}

function checkExpressionAdvanced(terms: readonly bigint[], tailCount: number, expected: bigint): boolean {
  const term = terms[tailCount - 1];
  if (tailCount === 1) {
    return term === expected;
  }
  if (expected % term === 0n && checkExpressionAdvanced(terms, tailCount - 1, expected / term)) {
    return true;
  } else if (term <= expected && checkExpressionAdvanced(terms, tailCount - 1, expected - term)) {
    return true;
  }

  const expectedString = String(expected);
  const termString = String(term);
  if (expectedString.endsWith(termString)) {
    const reducedExpected = BigInt(expectedString.substring(
      0, expectedString.length - termString.length
    ));
    if (checkExpressionAdvanced(terms, tailCount - 1, reducedExpected)) {
      return true;
    }
  }

  return false;
}

(async function main() {
  await solvePuzzleBasic();
  await solvePuzzleAdvanced();
})();
