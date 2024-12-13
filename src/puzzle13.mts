import { readFile, writeFile } from 'node:fs/promises';
import * as Z3 from 'z3-solver';

import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle13_test.txt'), {encoding: 'utf8'});

  const { Context, Z3: LowLevel } = await Z3.init();
  const z3 = Context('main');

  const aX = 94;
  const aY = 34;
  const bX = 22;
  const bY = 67;
  const targetX = 8400;
  const targetY = 5400;

  const aPresses = z3.Int.const('a');
  const bPresses = z3.Int.const('b');
  const problem = z3.And(
    aPresses.ge(0),
    aPresses.le(100),
    bPresses.ge(0),
    bPresses.le(100),
    aPresses.mul(aX).add(bPresses.mul(bX)).eq(targetX),
    aPresses.mul(aY).add(bPresses.mul(bY)).eq(targetY)
  );
  const answers: Array<[Z3.IntNum<'main'>, Z3.IntNum<'main'>]> = [];
  while (true) {
    const notAnswers = z3.And(...answers.map(
      ([a, b]) => aPresses.eq(a).not().and(bPresses.eq(b).not()))
    );
    const model = await z3.solve(problem, notAnswers);
    if (z3.isModel(model)) {
      answers.push([
        model.eval(aPresses) as Z3.IntNum<'main'>,
        model.eval(bPresses) as Z3.IntNum<'main'>,
      ]);
    } else {
      break;
    }
  }

  for (const [aVal, bVal] of answers) {
    const a = Number(aVal.asString());
    const b = Number(bVal.asString());
    console.log(`a = ${a}, b = ${b}, cost = ${a * 3 + b}`);
  }

  console.log(`Puzzle 13 (basic): ${0}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle13_test.txt'), {encoding: 'utf8'});

  console.log(`Puzzle 13 (advanced): ${0}`);
}

(async function main() {
  using _ = Stopwatch.start();
  await solvePuzzleBasic();
  // await solvePuzzleAdvanced();

  // Workaround for handing process when using Z3:
  // https://github.com/Z3Prover/z3/issues/6512
  process.exit(0);
})();
