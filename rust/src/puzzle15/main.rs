use core::{Grid, get_data_path};
use std::{fs::{read_to_string, File}, io::{LineWriter, Write}};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle15.txt")).unwrap();
    let (mut grid, steps) = parse_input(&input);

    let mut position = grid.find(&'@').unwrap();
    for step in steps.chars() {
        let direction = direction_from_step(step);
        position = simulate_step_basic(&mut grid, position, direction);
    }

    let mut writer = LineWriter::new(
        File::create(get_data_path("output/puzzle15_after.txt")).unwrap()
    );
    for line in grid.lines() {
        writer.write_all(line.as_bytes()).unwrap();
    }

    let gps_total = compute_gps_sum(&grid);
    println!("GPS total (basic): {gps_total}");
}

fn simulate_step_basic(grid: &mut Grid<char>, position: Vector, direction: Vector) -> Vector {
    let mut current = position;
    let mut move_count = 0;
    loop {
        let next = (
            current.0 + direction.0,
            current.1 + direction.1,
        );
        match grid.get(next) {
            Some('#') | None => {
                return position;
            }
            Some('O') => {
                move_count += 1;
            }
            Some('.') => {
                let next_once = (
                    position.0 + direction.0,
                    position.1 + direction.1,
                );
                grid.set(position, '.');
                grid.set(next_once, '@');
                if move_count > 0 {
                    grid.set(next, 'O');
                }
                return next_once;
            }
            _ => {}
        }
        current = next;
    }
}

fn advanced() {
    let input_path = read_to_string(get_data_path("input/puzzle15.txt")).unwrap();
    let (initial_grid, steps) = parse_input(&input_path);

    let mut grid = Grid::empty(initial_grid.width() * 2, initial_grid.height());
    for i in 0..initial_grid.width() {
        for j in 0..initial_grid.height() {
            match initial_grid.get((i, j)) {
                Some('@') => {
                    grid.set((i * 2, j), '@');
                    grid.set((i * 2 + 1, j), '.');
                }
                Some('O') => {
                    grid.set((i * 2, j), '[');
                    grid.set((i * 2 + 1, j), ']');
                }
                Some(other) => {
                    grid.set((i * 2, j), other);
                    grid.set((i * 2 + 1, j), other);
                }
                _ => {}
            }
        }
    }

    // let mut step_writer = LineWriter::new(
    //     File::create(get_data_path("output/puzzle15_wide_log.txt")).unwrap()
    // );

    let mut position = grid.find(&'@').unwrap();
    for step in steps.chars() {
        let direction = direction_from_step(step);
        position = simulate_step_advanced(&mut grid, position, direction);

        // write!(&mut step_writer, "Step: {step}\n").unwrap();
        // for line in grid.lines() {
        //     step_writer.write_all(line.as_bytes()).unwrap();
        // }
        // step_writer.write_all(b"\n").unwrap();
    }

    let mut writer = LineWriter::new(
        File::create(get_data_path("output/puzzle15_wide.txt")).unwrap()
    );
    for line in grid.lines() {
        writer.write_all(line.as_bytes()).unwrap();
    }

    let gps_total = compute_gps_sum(&grid);
    println!("GPS total (advanced): {gps_total}");
}

fn simulate_step_advanced(grid: &mut Grid<char>, position: Vector, direction: Vector) -> Vector {
    let next = (
        position.0 + direction.0,
        position.1 + direction.1,
    );
    match grid.get(next) {
        Some('.') => {
            grid.set(position, '.');
            grid.set(next, '@');
            return next;
        }
        Some('[' | ']') => {
            if direction.0 != 0 && can_move_horizontal(grid, next, direction.0) {
                move_horizontal(grid, next, direction.0);
                grid.set(position, '.');
                grid.set(next, '@');
                return next;
            } else if direction.1 != 0 && can_move_vertical(grid, next, direction.1) {
                move_vertical(grid, next, direction.1);
                grid.set(position, '.');
                grid.set(next, '@');
                return next;
            } else {
                return position;
            }
        }
        _ => {
            return position;
        }
    }
}

fn can_move_horizontal(grid: &Grid<char>, at: Vector, dx: i32) -> bool {
    let (mut x, y) = at;
    loop {
        match grid.get((x, y)) {
            Some('[' | ']') => {}
            Some('.') => {
                return true;
            }
            _ => {
                return false;
            }
        }
        x += dx;
    }
}

fn move_horizontal(grid: &mut Grid<char>, at: Vector, dx: i32) {
    let (mut x, y) = at;
    let mut previous = grid.get((x, y)).unwrap();
    x += dx;
    loop {
        let value = grid.get((x, y));
        match value {
            Some('[' | ']') => {
                let part = value.unwrap();
                grid.set((x, y), previous);
                previous = part;
            }
            Some('.') => {
                grid.set((x, y), previous);
                return;
            }
            _ => {
                return;
            }
        }
        x += dx;
    }
}

fn can_move_vertical(grid: &Grid<char>, at: Vector, dy: i32) -> bool {
    let value = grid.get(at);
    match value {
        Some('[' | ']') => {
            let sign = if value.unwrap() == '[' { 1 } else { -1 };
            return can_move_vertical(grid, (at.0, at.1 + dy), dy) &&
                can_move_vertical(grid, (at.0 + sign, at.1 + dy), dy);
        }
        Some('.') => true,
        _ => false,
    }
}

fn move_vertical(grid: &mut Grid<char>, at: Vector, dy: i32) {
    let value = grid.get(at);
    match value {
        Some('[' | ']') => {
            let part = value.unwrap();
            let (other, sign) = if part == '[' { (']', 1) } else { ('[', -1) };
            move_vertical(grid, (at.0, at.1 + dy), dy);
            move_vertical(grid, (at.0 + sign, at.1 + dy), dy);
            grid.set((at.0, at.1), '.');
            grid.set((at.0 + sign, at.1), '.');

            grid.set((at.0, at.1 + dy), part);
            grid.set((at.0 + sign, at.1 + dy), other);
        }
        _ => {}
    }
}

type Vector = (i32, i32);

fn parse_input(input: &str) -> (Grid<char>, String) {
    let mut scan_grid = true;
    let mut grid_lines: Vec<String> = vec![];
    let mut steps = String::new();
    for line in input.lines() {
        if scan_grid {
            if line.is_empty() {
                scan_grid = false
            } else {
                grid_lines.push(line.to_string());
            }
        } else {
            steps += line;
        }
    }
    return (
        Grid::from_lines(&grid_lines[..]).unwrap(),
        steps
    );
}

fn direction_from_step(direction: char) -> Vector {
    match direction {
        '^' => (0, -1),
        'v' => (0, 1),
        '>' => (1, 0),
        '<' => (-1, 0),
        _ => (0, 0),
    }
}

fn compute_gps_sum(grid: &Grid<char>) -> i32 {
    let mut total = 0;
    for i in 0..grid.width() {
        for j in 0..grid.height() {
            match grid.get((i, j)) {
                Some('O' | '[') => {
                    let gps = j * 100 + i;
                    total += gps;
                }
                _ => {}
            }
        }
    }
    return total;
}
