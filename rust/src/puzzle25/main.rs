use core::get_data_path;
use std::fs::read_to_string;

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle25.txt")).unwrap();
    let data = KeysAndLocks::parse(&input).unwrap();

    let mut fit_count: u64 = 0;
    for key in data.keys.iter() {
        for lock in data.locks.iter() {
            // println!("key: {:?}, lock: {:?}", key, lock);
            if key.fit_with(lock) {
                fit_count += 1;
            }
        }
    }

    println!("Key/lock that fit combinations: {}", fit_count);
}

#[derive(Debug)]
struct Shape(Vec<u16>, u16);

struct KeysAndLocks {
    keys: Vec<Shape>,
    locks: Vec<Shape>,
}

impl KeysAndLocks {
    fn parse(input: &str) -> Result<KeysAndLocks, String> {
        let mut height: u16 = 0;
        let mut is_key = false;
        let mut shape: Vec<u16> = Vec::new();
        let mut keys = Vec::new();
        let mut locks = Vec::new();

        for line in input.lines() {
            if line.is_empty() {
                if height > 0 {
                    let reduced_shape = shape.iter().map(|&v| v - 1).collect();
                    if is_key {
                        keys.push(Shape(reduced_shape, height - 1));
                    } else {
                        locks.push(Shape(reduced_shape, height - 1));
                    }
                }
                shape.clear();
                height = 0;
            } else {
                for (i, ch) in line.chars().enumerate() {
                    let value = if ch == '#' { 1 } else { 0 };
                    if height == 0 {
                        shape.push(value);
                    } else if i >= shape.len() {
                        return Err(format!("Inconsistent line length: {}", line));
                    } else {
                        shape[i] += value;
                    }
                }
                if height == 0 {
                    is_key = shape.iter().all(|&v| v == 0);
                }
                height += 1;
            }
        }

        if height > 0 {
            let reduced_shape = shape.iter().map(|&v| v - 1).collect();
            if is_key {
                keys.push(Shape(reduced_shape, height - 1));
            } else {
                locks.push(Shape(reduced_shape, height - 1));
            }
        }

        return Ok(KeysAndLocks { keys, locks });
    }
}

impl Shape {
    fn fit_with(&self, other: &Shape) -> bool {
        for (i, v) in self.0.iter().enumerate() {
            if other.0[i] + v >= self.1 {
                return false;
            }
        }
        return true;
    }
}
