use core::get_data_path;
use regex::Regex;
use std::fs::read_to_string;
use z3::{self, ast::Ast};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle13.txt")).unwrap();
    let machines = ClawMachine::parse(&input);

    let config = z3::Config::new();
    let ctx = z3::Context::new(&config);

    let solver = ClawSolver::new(&ctx);
    let mut total_cost: i64 = 0;
    for (i, machine) in machines.iter().enumerate() {
        let answers = solver.find_presses(machine);
        match answers.len() {
            0 => {
                println!("#{}: no answer", i + 1);
            }
            1 => {
                let (a, b) = *answers.first().unwrap();
                let cost = ClawMachine::answer_cost((a, b));
                println!("#{}: single answer, cost = {a} * 3 + {b} = {cost}", i + 1);
                total_cost += cost;
            }
            _ => {
                let (a, b) = *answers.iter()
                    .min_by_key(|answer| ClawMachine::answer_cost(**answer))
                    .unwrap();
                let cost = ClawMachine::answer_cost((a, b));
                println!("#{}: multiple answers, cost = {a} * 3 + {b} = {cost}", i + 1);
                total_cost += cost;
            }
        }
    }

    println!("Total claw machine cost (basic): {total_cost}");
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle13.txt")).unwrap();
    let machines = ClawMachine::parse(&input);
    let machines: Vec<ClawMachine> = machines.into_iter()
        .map(|m| ClawMachine {
            prize_x: m.prize_x + 10000000000000,
            prize_y: m.prize_y + 10000000000000,
            ..m
        })
        .collect();

    let config = z3::Config::new();
    let ctx = z3::Context::new(&config);

    let solver = ClawSolver::new(&ctx);
    let mut total_cost: i64 = 0;
    for (i, machine) in machines.iter().enumerate() {
        let answers = solver.find_presses(machine);
        match answers.len() {
            0 => {
                println!("#{}: no answer", i + 1);
            }
            1 => {
                let (a, b) = *answers.first().unwrap();
                let cost = ClawMachine::answer_cost((a, b));
                println!("#{}: single answer, cost = {a} * 3 + {b} = {cost}", i + 1);
                total_cost += cost;
            }
            _ => {
                let (a, b) = *answers.iter()
                    .min_by_key(|answer| ClawMachine::answer_cost(**answer))
                    .unwrap();
                let cost = ClawMachine::answer_cost((a, b));
                println!("#{}: multiple answers, cost = {a} * 3 + {b} = {cost}", i + 1);
                total_cost += cost;
            }
        }
    }

    println!("Total claw machine cost (advanced): {total_cost}");
}

struct ClawMachine {
    a_x: i64,
    a_y: i64,
    b_x: i64,
    b_y: i64,
    prize_x: i64,
    prize_y: i64,
}

impl ClawMachine {
    fn parse(content: &str) -> Vec<ClawMachine> {
        let re = Regex::new(
            r"Button A: X\+(\d+), Y\+(\d+)\r?\nButton B: X\+(\d+), Y\+(\d+)\r?\nPrize: X=(\d+), Y=(\d+)\r?\n"
        ).unwrap();
        let mut machines = vec![];
        for (_, [a_x, a_y, b_x, b_y, prize_x, prize_y])
            in re.captures_iter(content).map(|c| c.extract()
        ) {
            machines.push(ClawMachine {
                a_x: a_x.parse::<i64>().unwrap(),
                a_y: a_y.parse::<i64>().unwrap(),
                b_x: b_x.parse::<i64>().unwrap(),
                b_y: b_y.parse::<i64>().unwrap(),
                prize_x: prize_x.parse::<i64>().unwrap(),
                prize_y: prize_y.parse::<i64>().unwrap(),
            });
        }
        return machines;
    }

    fn answer_cost((a, b): (i64, i64)) -> i64 {
        a * 3 + b
    }
}

struct ClawSolver<'a> {
    ctx: &'a z3::Context,
    var_a: z3::ast::Int<'a>,
    var_b: z3::ast::Int<'a>,
}

impl<'a> ClawSolver<'a> {
    fn new(ctx: &z3::Context) -> ClawSolver {
        use z3::ast::Int;

        let a = Int::new_const(&ctx, "a");
        let b = Int::new_const(&ctx, "b");

        ClawSolver { ctx, var_a: a, var_b: b }
    }

    fn find_presses(&self, machine: &ClawMachine) -> Vec<(i64, i64)> {
        use z3::ast::{Bool, Int};

        let ctx = self.ctx;
        let a = &self.var_a;
        let b = &self.var_b;

        let a_x = Int::from_i64(&ctx, machine.a_x);
        let a_y = Int::from_i64(&ctx, machine.a_y);
        let b_x = Int::from_i64(&ctx, machine.b_x);
        let b_y = Int::from_i64(&ctx, machine.b_y);
        let target_x = Int::from_i64(&ctx, machine.prize_x);
        let target_y = Int::from_i64(&ctx, machine.prize_y);

        let min = Int::from_i64(&ctx, 0);

        let problem = Bool::and(&ctx, &[
            &a.ge(&min),
            &b.ge(&min),
            &(a.clone() * a_x + b.clone() * b_x)._eq(&target_x),
            &(a.clone() * a_y + b.clone() * b_y)._eq(&target_y),
        ]);

        let solver = z3::Solver::new(&ctx);
        solver.assert(&problem);

        let mut answers: Vec<(i64, i64)> = Vec::new();
        loop {
            match solver.check() {
                z3::SatResult::Sat => {
                    let model = solver.get_model().unwrap();
                    let a_value = model.eval(a, true)
                        .unwrap()
                        .as_i64()
                        .unwrap();
                    let b_value = model.eval(b, true)
                        .unwrap()
                        .as_i64()
                        .unwrap();
                    answers.push((a_value, b_value));
                    solver.assert( &a._eq(&Int::from_i64(&ctx, a_value)).not());
                    solver.assert(&b._eq(&Int::from_i64(&ctx, b_value)).not());
                }
                _ => {
                    break;
                }
            }
        }
        return answers;
    }
}
