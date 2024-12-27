use core::get_data_path;
use std::{collections::HashMap, fs::read_to_string};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle22.txt")).unwrap();
    let initial_numbers = parse_initial_numbers(&input).unwrap();

    let mut total = 0;
    for secret in initial_numbers {
        let mut current = secret;
        for _ in 0..2000 {
            current = evolve_secret(current);
        }
        total += current;
        // println!("{secret}: {current}");
    }

    println!("Total of secrets after 2000 steps (basic): {}", total);
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle22.txt")).unwrap();
    let initial_numbers = parse_initial_numbers(&input).unwrap();

    let mut sequence_totals: HashMap<_, i64> = HashMap::new();
    for secret in initial_numbers {
        let mut sequence_max: HashMap<_, i64> = HashMap::new();

        let mut current = secret;

        let mut next = evolve_secret(current);
        let mut d1 = next % 10 - current % 10;
        current = next;

        next = evolve_secret(current);
        let mut d2 = next % 10 - current % 10;
        current = next;

        next = evolve_secret(current);
        let mut d3 = next % 10 - current % 10;
        current = next;

        for _ in 0..1997 {
            next = evolve_secret(current);
            let d4 = next % 10 - current % 10;
            current = next;

            let price = current % 10;
            sequence_max.entry((d1, d2, d3, d4))
                .or_insert(price);

            d1 = d2;
            d2 = d3;
            d3 = d4;
        }

        for (&sequence, &max_price) in sequence_max.iter() {
            sequence_totals.entry(sequence)
                .and_modify(|e| { *e += max_price; })
                .or_insert(max_price);
        }
    }

    if let Some(((d1, d2, d3, d4), max_price)) = sequence_totals.iter().max_by_key(|p| p.1) {
        println!("Sequence with max total price {max_price} is {d1},{d2},{d3},{d4} (advanced)");
    } else {
        println!("Failed to find any sequence");
    }
}

fn parse_initial_numbers(input: &str) -> Result<Vec<i64>, String> {
    input.lines()
        .filter(|line| !line.is_empty())
        .enumerate()
        .map(|(i, line)| line.parse::<i64>()
            .map_err(|_| format!("Invalid secrer #{i}: {line}"))
        )
        .collect::<Result<Vec<_>, _>>()
}

const MODULUS: i64 = 16777216;

fn evolve_secret(mut x: i64) -> i64 {
    x = ((x << 6) ^ x) % MODULUS;
    x = ((x >> 5) ^ x) % MODULUS;
    x = ((x << 11) ^ x) % MODULUS;
    return x;
}
