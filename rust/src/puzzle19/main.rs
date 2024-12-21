use core::get_data_path;
use std::{collections::{HashMap, HashSet}, fs::read_to_string, str::FromStr};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle19.txt")).unwrap();
    let puzzle = input.parse::<TowelPuzzle>().unwrap();

    let mut matcher = TowelMatcher::new();
    for towel in puzzle.towels.iter() {
        matcher.add_match(&towel);
    }

    let mut total_matches = 0;
    for design in puzzle.designs.iter() {
        if matcher.match_design(design) > 0 {
            total_matches += 1;
        }
    }

    println!("Total valid towel designs (basic): {total_matches}");
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle19.txt")).unwrap();
    let puzzle = input.parse::<TowelPuzzle>().unwrap();

    let mut matcher: TowelMatcher<'_> = TowelMatcher::new();
    let mut ordered_towels = puzzle.towels.clone();
    ordered_towels.sort_by_key(|towel| towel.len());
    for towel in ordered_towels.iter() {
        matcher.add_match(&towel);
    }

    let mut total_variants = 0;
    for design in puzzle.designs.iter() {
        let count = matcher.match_design(design);
        total_variants += count;
    }

    println!("Total towel designs variants (advanced): {total_variants}");
}

struct TowelPuzzle {
    towels: Vec<String>,
    designs: Vec<String>,
}

impl FromStr for TowelPuzzle {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut next_towels = true;
        let mut towels: Option<Vec<String>> = None;
        let mut designs = Vec::new();
        for line in s.lines() {
            if line.is_empty() {
                continue;
            } else if next_towels {
                towels = Some(line.split(',').map(|s| s.trim().to_string()).collect());
                next_towels = false;
            } else {
                designs.push(line.to_string());
            }
        }
        let towels = towels.ok_or("Failed to match towels from the input")?;
        return Ok(TowelPuzzle { towels, designs });
    }
}

struct TowelMatcher<'a> {
    matches: HashMap<&'a str, u64>,
    towels: HashSet<&'a str>,
}

impl<'a> TowelMatcher<'a> {
    fn new() -> TowelMatcher<'a> {
        TowelMatcher {
            matches: HashMap::new(),
            towels: HashSet::new(),
        }
    }

    fn add_match(&mut self, design: &'a str) {
        let matches = self.match_design(design);
        self.matches.insert(design, matches + 1);
        self.towels.insert(design);
    }

    fn match_design(&mut self, design: &'a str) -> u64 {
        if let Some(&result) = self.matches.get(design) {
            return result;
        } else if design.len() == 1 {
            self.matches.insert(&design, 0);
            return 0;
        }

        let mut count = 0;
        for i in 1..design.len() {
            let prefix = &design[0..i];
            if self.towels.contains(prefix) {
                let suffix: &str = &design[i..design.len()];
                let suffix_count = self.match_design(suffix);
                count += suffix_count;
            }
        }

        self.matches.insert(&design, count);
        return count;
    }
}
