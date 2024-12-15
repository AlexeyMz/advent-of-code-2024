use z3::{self, ast::Ast};

fn basic() {
    let config = z3::Config::new();
    let ctx = z3::Context::new(&config);

    let solver = z3::Solver::new(&ctx);

    let a_x = z3::ast::Int::from_i64(&ctx, 94);
    let a_y = z3::ast::Int::from_i64(&ctx, 34);
    let b_x = z3::ast::Int::from_i64(&ctx, 22);
    let b_y = z3::ast::Int::from_i64(&ctx, 67);
    let target_x = z3::ast::Int::from_i64(&ctx, 8400);
    let target_y = z3::ast::Int::from_i64(&ctx, 5400);

    let a = z3::ast::Int::new_const(&ctx, "a");
    let b = z3::ast::Int::new_const(&ctx, "b");

    let min = z3::ast::Int::from_i64(&ctx, 0);
    let max = z3::ast::Int::from_i64(&ctx, 100);

    let problem = z3::ast::Bool::and(&ctx, &[
        &a.ge(&min),
        &a.le(&max),
        &b.ge(&min),
        &b.le(&max),
        &(a.clone() * a_x + b.clone() * b_x)._eq(&target_x),
        &(a.clone() * a_y + b.clone() * b_y)._eq(&target_y),
    ]);

    solver.assert(&problem);
    let mut answers: Vec<(i64, i64)> = Vec::new();
    loop {
        match solver.check() {
            z3::SatResult::Sat => {
                let model = solver.get_model().unwrap();
                let a_value = model.eval(&a, false)
                    .unwrap()
                    .as_i64()
                    .unwrap();
                let b_value = model.eval(&b, false)
                    .unwrap()
                    .as_i64()
                    .unwrap();
                answers.push((a_value, b_value));
                println!("Found solution: a = {a_value}, b = {b_value}");
                solver.assert( &a._eq(&z3::ast::Int::from_i64(&ctx, a_value)).not());
                solver.assert(&b._eq(&z3::ast::Int::from_i64(&ctx, b_value)).not());
            }
            _ => {
                break;
            }
        }
    }

    println!("Found {} solutions in total", answers.len());
}

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    println!("Elapsed time: {:.2?}", before.elapsed());
}
