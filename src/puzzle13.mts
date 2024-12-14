import { readFile, writeFile } from 'node:fs/promises';
import * as Z3 from 'z3-solver';

import { Stopwatch } from './core/performance.mjs';
import { getDataPath } from './core/project.mjs';

export async function solvePuzzleBasic() {
  const content = await readFile(getDataPath('input/puzzle13.txt'), {encoding: 'utf8'});
  const machines = parseClawMachines(content);

  const { Context } = await Z3.init();
  const ctx = Context('main');

  const solver = new ClawSolver(ctx);
  let totalCost = 0n;
  for (let i = 0; i < machines.length; i++) {
    const machine = machines[i];
    const answers = await solver.findPressesBasic(machine);
    if (answers.length === 0) {
      console.log(`#${i + 1}: no answer`);
    } else if (answers.length === 1) {
      const answer = answers[0];
      const [a, b] = answer;
      const cost = clawPressesCost(answer);
      console.log(`#${i + 1}: single answer, cost = ${a} * 3 + ${b} = ${cost}`);
      totalCost += cost;
    } else {
      const answer = selectMinCostAnswer(answers);
      const [a, b] = answer;
      const cost = clawPressesCost(answer);
      console.log(`#${i + 1}: multiple answers, lowest cost = ${a} * 3 + ${b} = ${cost}`);
      totalCost += cost;
    }
  }

  console.log(`Puzzle 13 (basic): ${totalCost}`);
}

export async function solvePuzzleAdvanced() {
  const content = await readFile(getDataPath('input/puzzle13.txt'), {encoding: 'utf8'});
  const sourceMachines = parseClawMachines(content);
  const machines = sourceMachines.map((m): ClawMachine => ({
    ...m,
    prizeX: m.prizeX + 10000000000000n,
    prizeY: m.prizeY + 10000000000000n,
  }));

  const { Context } = await Z3.init();
  const ctx = Context('main');

  const solver = new ClawSolver(ctx);
  let totalCost = 0n;
  for (let i = 0; i < machines.length; i++) {
    const machine = machines[i];
    const answers = await solver.findPressesAdvanced(machine);
    if (answers.length === 0) {
      console.log(`#${i + 1}: no answer`);
    } else if (answers.length === 1) {
      const answer = answers[0];
      const [a, b] = answer;
      const cost = clawPressesCost(answer);
      console.log(`#${i + 1}: single answer, cost = ${a} * 3 + ${b} = ${cost}`);
      totalCost += cost;
    } else {
      const answer = selectMinCostAnswer(answers);
      const [a, b] = answer;
      const cost = clawPressesCost(answer);
      console.log(`#${i + 1}: multiple answers, lowest cost = ${a} * 3 + ${b} = ${cost}`);
      totalCost += cost;
    }
  }

  console.log(`Puzzle 13 (advanced): ${totalCost}`);
}

function parseClawMachines(content: string): ClawMachine[] {
  const result: ClawMachine[] = [];

  const regex = /Button A: X\+(\d+), Y\+(\d+)\r?\nButton B: X\+(\d+), Y\+(\d+)\r?\nPrize: X=(\d+), Y=(\d+)\r?\n/gm;
  let match: RegExpExecArray | null;
  while (match = regex.exec(content)) {
    const [, ...nums] = match;
    const [aX, aY, bX, bY, prizeX, prizeY] = nums.map(n => BigInt(n));
    result.push({aX, aY, bX, bY, prizeX, prizeY});
  }

  return result;
}

class ClawSolver {
  private readonly a: Z3.Arith;
  private readonly b: Z3.Arith;

  constructor(
    private readonly ctx: Z3.Context,
  ) {
    this.a = ctx.Int.const('a');
    this.b = ctx.Int.const('b');
  }

  async findPressesBasic(machine: ClawMachine): Promise<ClawAnswer[]> {
    const {ctx, a, b} = this;
    const problem = ctx.And(
      a.ge(0),
      a.le(100),
      b.ge(0),
      b.le(100),
      a.mul(machine.aX).add(b.mul(machine.bX)).eq(machine.prizeX),
      a.mul(machine.aY).add(b.mul(machine.bY)).eq(machine.prizeY)
    );
    const answers: Array<[Z3.IntNum<'main'>, Z3.IntNum<'main'>]> = [];
    while (true) {
      const notAnswers = ctx.And(...answers.map(
        ([a, b]) => a.eq(a).not().and(b.eq(b).not()))
      );
      const model = await ctx.solve(problem, notAnswers);
      if (ctx.isModel(model)) {
        answers.push([
          model.eval(a) as Z3.IntNum<'main'>,
          model.eval(b) as Z3.IntNum<'main'>,
        ]);
      } else {
        break;
      }
    }
    return answers.map(
      ([aVal, bVal]) => [
        BigInt(aVal.asString()),
        BigInt(bVal.asString())
      ] as const
    );
  }

  async findPressesAdvanced(machine: ClawMachine): Promise<ClawAnswer[]> {
    const {ctx, a, b} = this;
    const problem = ctx.And(
      a.gt(100),
      b.gt(100),
      a.mul(machine.aX).add(b.mul(machine.bX)).eq(machine.prizeX),
      a.mul(machine.aY).add(b.mul(machine.bY)).eq(machine.prizeY)
    );
    const answers: Array<[Z3.IntNum<'main'>, Z3.IntNum<'main'>]> = [];
    while (true) {
      const notAnswers = ctx.And(...answers.map(
        ([a, b]) => a.eq(a).not().and(b.eq(b).not()))
      );
      const model = await ctx.solve(problem, notAnswers);
      if (ctx.isModel(model)) {
        answers.push([
          model.eval(a) as Z3.IntNum<'main'>,
          model.eval(b) as Z3.IntNum<'main'>,
        ]);
      } else {
        break;
      }
    }
    return answers.map(
      ([aVal, bVal]) => [
        BigInt(aVal.asString()),
        BigInt(bVal.asString())
      ] as const
    );
  }
}

interface ClawMachine {
  readonly aX: bigint;
  readonly aY: bigint;
  readonly bX: bigint;
  readonly bY: bigint;
  readonly prizeX: bigint;
  readonly prizeY: bigint;
}

type ClawAnswer = readonly [a: bigint, b: bigint];

function clawPressesCost(answer: ClawAnswer): bigint {
  return answer[0] * 3n + answer[1];
}

function selectMinCostAnswer(answers: readonly ClawAnswer[]): ClawAnswer {
  let minCostAnswer = answers[0];
  let minCost = clawPressesCost(minCostAnswer);
  for (let i = 1; i < answers.length; i++) {
    const answer = answers[i];
    const cost = clawPressesCost(answer);
    if (cost < minCost) {
      minCostAnswer = answer;
      minCost = cost;
    }
  }
  return minCostAnswer;
}

(async function main() {
  {
    using _ = Stopwatch.start();
    await solvePuzzleBasic();
    await solvePuzzleAdvanced();
  }

  // Workaround for handing process when using Z3:
  // https://github.com/Z3Prover/z3/issues/6512
  process.exit(0);
})();
