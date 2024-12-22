use core::{get_data_path, Grid};
use std::{collections::{HashMap, HashSet}, fs::read_to_string};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle20.txt")).unwrap();
    let grid = Grid::from_lines(
        &input.lines()
            .filter(|line| !line.is_empty())
            .map(|line| line.into())
            .collect::<Vec<String>>()
    ).unwrap();

    let track = RaceTrack::compute(&grid).unwrap();
    let mut cheats = HashSet::new();
    for from in track.tiles.iter() {
        let from_ps = track.distances.get(*from).unwrap_or(-1);
        for cheat_to in track.cheat_neighbors(&from) {
            let to_ps = track.distances.get(cheat_to).unwrap_or(-1);
            if to_ps > from_ps {
                let save_ps = to_ps - from_ps - (cheat_to.0 - from.0).abs() - (cheat_to.1 - from.1).abs();
                if save_ps > 0 {
                    cheats.insert((*from, cheat_to, save_ps));
                }
            }
        }
    }

    let cheat_by_save = group_cheats_by_saved_time(&cheats);
    let mut large_cheats_count = 0;
    for (save_ps, cheats) in cheat_by_save.iter() {
        if *save_ps >= 100 {
            large_cheats_count += cheats.len();
        }
    }

    println!("Large cheats count (basic): {large_cheats_count}");
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle20.txt")).unwrap();
    let grid = Grid::from_lines(
        &input.lines()
            .filter(|line| !line.is_empty())
            .map(|line| line.into())
            .collect::<Vec<String>>()
    ).unwrap();

    let track = RaceTrack::compute(&grid).unwrap();
    let mut cheats = HashSet::new();
    for i in 0..track.tiles.len() {
        let from = track.tiles[i];
        let from_ps = track.distances.get(from).unwrap_or(-1);
        for j in i..track.tiles.len() {
            let to = track.tiles[j];
            let to_ps = track.distances.get(to).unwrap_or(-1);
            if to_ps > from_ps {
                let distance = (to.0 - from.0).abs() + (to.1 - from.1).abs();
                let save_ps = to_ps - from_ps - distance;
                if distance <= 20 && save_ps >= 50 {
                    cheats.insert((from, to, save_ps));
                }
            }
        }
    }

    let cheat_by_save = group_cheats_by_saved_time(&cheats);
    let mut large_cheats_count = 0;
    for (save_ps, cheats) in cheat_by_save.iter() {
        if *save_ps >= 100 {
            large_cheats_count += cheats.len();
        }
    }

    println!("Large cheats count (advanced): {large_cheats_count}");
}

struct RaceTrack {
    distances: Grid<i32>,
    tiles: Vec<(i32, i32)>,
}

impl RaceTrack {
    fn compute(grid: &Grid<char>) -> Result<RaceTrack, String> {
        let start = grid.find(&'S').ok_or("Failed to find track start")?;
        let end = grid.find(&'E').ok_or("Failed to find track end")?;

        let mut distances = Grid::new(grid.width(), grid.height(), -1);
        let mut tiles= Vec::new();

        let mut picoseconds = 0;
        let mut previous = start;
        let mut current = start;
        distances.set(current, picoseconds);
        tiles.push(current);

        while current != end {
            for (dx, dy) in [(-1, 0), (1, 0), (0, -1), (0, 1)] {
                let next = (current.0 + dx, current.1 + dy);
                if next != previous && grid.get(next).unwrap_or('#') != '#' {
                    previous = current;
                    current = next;
                    break;
                }
            }
            picoseconds += 1;
            distances.set(current, picoseconds);
            tiles.push(current);
        }

        return Ok(RaceTrack { distances, tiles });
    }

    fn cheat_neighbors(&self, at: &(i32, i32)) -> impl Iterator<Item = (i32, i32)> {
        let mut locations = Vec::new();
        for dx in -2..=2i32 {
            let dy_range = 2 - dx.abs();
            for dy in -dy_range..=dy_range {
                let next = (at.0 + dx, at.1 + dy);
                if self.distances.get(next).unwrap_or(-1) >= 0 {
                    locations.push(next);
                }
            }
        }
        return locations.into_iter();
    }
}

fn group_cheats_by_saved_time(cheats: &HashSet<((i32, i32), (i32, i32), i32)>) -> HashMap<i32, Vec<((i32, i32), (i32, i32))>> {
    let mut cheat_by_length: HashMap<i32, Vec<_>> = HashMap::new();
    for (from, to, save_ps) in cheats.iter() {
        cheat_by_length.entry(*save_ps).or_default().push((*from, *to));
    }
    return cheat_by_length;
}
