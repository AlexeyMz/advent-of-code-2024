use core::{get_data_path, AStar, AStarGraph, AStarNode, Grid};
use std::{fmt::Debug, fs::{read_to_string, File}, io::{LineWriter, Write}};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle18.txt")).unwrap();
    // let grid_size = 7;
    // let take_bytes = 12;
    let grid_size = 71;
    let take_bytes = 1024;
    let mut ram = Grid::new(grid_size, grid_size, '.');
    let falling_bytes = parse_falling_bytes(&input);

    for byte in falling_bytes.iter().take(take_bytes) {
        ram.set(*byte, '#');
    }

    let graph = RamGraph::new(&ram);
    let mut astar = AStar::new(graph);
    loop {
        if astar.next() {
            break;
        }
    }

    match astar.found_goal() {
        Some((final_node, final_cost)) => {
            let mut path = ram.clone();
            let mut current = Some(final_node.key());
            while let Some(to) = current {
                path.set((to.0, to.1), 'O');
                current = None;
                for from in astar.get_from(&to) {
                    current = Some(*from);
                    break;
                }
            }

            let mut path_writer = LineWriter::new(
                File::create(get_data_path("output/puzzle18_path.txt")).unwrap()
            );
            for line in path.lines() {
                path_writer.write_all(line.as_bytes()).unwrap();
            }
            path_writer.write_all(b"\n").unwrap();

            println!("Path cost (basic): {final_cost}");
        }
        None => {
            println!("Failed to find path through RAM (basic).");
        }
    }
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle18.txt")).unwrap();
    // let grid_size = 7;
    let grid_size = 71;
    let mut ram = Grid::new(grid_size, grid_size, '.');
    let falling_bytes = parse_falling_bytes(&input);

    let mut min_ns = 0;
    let mut max_ns = falling_bytes.len();
    let mut iterations = 0;
    while (max_ns - min_ns) > 1 {
        let take_count = (min_ns + max_ns) / 2;

        ram.fill('.');
        for byte in falling_bytes.iter().take(take_count) {
            ram.set(*byte, '#');
        }

        let graph = RamGraph::new(&ram);
        let mut astar = AStar::new(graph);
        loop {
            if astar.next() {
                break;
            }
        }

        match astar.found_goal() {
            Some(_) => {
                min_ns = take_count;
            }
            None => {
                max_ns = take_count;
            }
        }
        iterations += 1;
    }

    let (block_x, block_y) = falling_bytes[min_ns];
    println!("First byte which will block the escape is ({block_x},{block_y}) at #{min_ns}");
    println!("(found in {iterations} iterations)");
}

fn parse_falling_bytes(input: &str) -> Vec<(i32, i32)> {
    input.lines()
        .filter(|line| !line.is_empty())
        .map(|line| {
            let coords: Vec<&str> = line.split(',').collect();
            return (coords[0].parse().unwrap(), coords[1].parse().unwrap());
        })
        .collect()
}

#[derive(Copy, Clone, Debug, Eq, Hash, PartialEq)]
enum Direction { North, East, South, West }

impl Direction {
    fn offset(&self) -> (i32, i32) {
        match self {
            Direction::North => (0, -1),
            Direction::South => (0, 1),
            Direction::West => (-1, 0),
            Direction::East => (1, 0),
        }
    }
}

#[derive(Clone)]
struct RamNode {
    x: i32,
    y: i32,
}

impl Debug for RamNode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({},{})", self.x, self.y)
    }
}

struct RamGraph<'a> {
    ram: &'a Grid<char>,
    start: (i32, i32),
    end: (i32, i32),
    debug: bool,
}

impl AStarNode for RamNode {
    type Key = (i32, i32);

    fn key(&self) -> Self::Key {
        (self.x, self.y)
    }
}

impl<'a> RamGraph<'a> {
    fn new(ram: &Grid<char>) -> RamGraph {
        let start = (0, 0);
        let end = (ram.width() - 1, ram.height() - 1);
        RamGraph { ram, start, end, debug: false }
    }
}

impl<'a> AStarGraph<RamNode> for RamGraph<'a> {
    type Cost = i32;

    fn start(&self) -> RamNode {
        let (x, y) = self.start;
        RamNode { x, y }
    }

    fn neighbors(&self, node: &RamNode) -> impl Iterator<Item = (RamNode, Self::Cost)> + '_ {
        let from = node.clone();
        let directions = [
            Direction::North,
            Direction::East,
            Direction::South,
            Direction::West,
        ];
        return directions.into_iter()
            .map(move |direction| {
                let offset = direction.offset();
                return (from.x + offset.0, from.y + offset.1);
            })
            .filter(|&next| self.ram.get(next).is_some_and(|v| v != '#'))
            .map(|(x, y)| (RamNode { x, y }, 1));
    }

    fn estimate(&self, node: &RamNode) -> Self::Cost {
        let (end_x, end_y) = self.end;
        let dx = end_x - node.x;
        let dy = end_y - node.y;
        return dx.abs() + dy.abs();
    }

    fn is_goal(&self, node: &RamNode) -> bool {
        return node.x == self.end.0 && node.y == self.end.1;
    }

    fn on_visit_node(&self, node: &RamNode, path_cost: Self::Cost) {
        if self.debug {
            println!("Node {:?} (path: {})", node, path_cost);
        }
    }

    fn on_visit_edge(&self, _from: &RamNode, to: &RamNode, cost: Self::Cost) {
        if self.debug {
            println!("    -> {:?} (cost {})", to, cost);
        }
    }
}
