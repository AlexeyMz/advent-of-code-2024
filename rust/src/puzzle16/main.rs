use core::{get_data_path, AStar, AStarGraph, AStarNode, Grid};
use fplist::{PersistentList, cons};
use std::{fmt::Debug, fs::{read_to_string, File}, io::{LineWriter, Write}};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle16.txt")).unwrap();
    let maze = Grid::from_lines(
        &input.lines()
            .filter(|line| !line.is_empty())
            .map(|line| line.into())
            .collect::<Vec<String>>()
    );

    let graph = MazeGraph::new(&maze);
    let mut astar = AStar::new(graph);
    loop {
        if astar.next() {
            break;
        }
    }

    match astar.found_goal() {
        Some((final_node, final_cost)) => {
            let mut path = maze.clone();
            let mut current = final_node.path.clone();
            while let Some(((x, y, dir), next)) = current.pop() {
                path.set((x, y), dir.to_char());
                current = next;
            }

            let mut path_writer = LineWriter::new(
                File::create(get_data_path("output/puzzle16_path.txt")).unwrap()
            );
            for line in path.lines() {
                path_writer.write_all(line.as_bytes()).unwrap();
            }
            path_writer.write_all(b"\n").unwrap();

            println!("Path cost (basic): {final_cost}");
        }
        None => {
            println!("Failed to find path through maze (basic).");
        }
    }
}

#[derive(Copy, Clone, Debug, Eq, Hash, PartialEq)]
enum Direction { North, East, South, West }

// const ALL_DIRECTIONS: &'static [Direction] = &[
//     Direction::North,
//     Direction::East,
//     Direction::South,
//     Direction::West,
// ];

impl Direction {
    fn turn_right(&self) -> Direction {
        match self {
            Direction::North => Direction::East,
            Direction::East => Direction::South,
            Direction::South => Direction::West,
            Direction::West => Direction::North,
        }
    }

    fn turn_left(&self) -> Direction {
        self.turn_right().turn_right().turn_right()
    }

    fn offset(&self) -> (i32, i32) {
        match self {
            Direction::North => (0, -1),
            Direction::South => (0, 1),
            Direction::West => (-1, 0),
            Direction::East => (1, 0),
        }
    }

    fn to_char(&self) -> char {
        match self {
            Direction::North => '^',
            Direction::East => '>',
            Direction::South => 'v',
            Direction::West => '<',
        }
    }
}

#[derive(Clone)]
struct MazeNode {
    x: i32,
    y: i32,
    direction: Direction,
    path: PersistentList<(i32, i32, Direction)>,
}

impl Debug for MazeNode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({} {},{})", self.direction.to_char(), self.x, self.y)
    }
}

struct MazeGraph<'a> {
    maze: &'a Grid<char>,
    start: (i32, i32),
    end: (i32, i32),
    debug: bool,
}

impl AStarNode for MazeNode {
    type Key = (i32, i32, Direction);

    fn key(&self) -> Self::Key {
        (self.x, self.y, self.direction)
    }
}

impl<'a> MazeGraph<'a> {
    fn new(maze: &Grid<char>) -> MazeGraph {
        let start = maze.find(&'S').unwrap();
        let end = maze.find(&'E').unwrap();
        MazeGraph { maze, start, end, debug: false }
    }
}

impl<'a> AStarGraph<MazeNode> for MazeGraph<'a> {
    type Cost = i32;

    fn start(&self) -> MazeNode {
        let (x, y) = self.start;
        let path = PersistentList::new();
        MazeNode { x, y, direction: Direction::East, path }
    }

    fn neighbors(&self, node: &MazeNode) -> impl Iterator<Item = (MazeNode, Self::Cost)> + '_ {
        MazeNeighbors {
            maze: &self.maze,
            from_x: node.x,
            from_y: node.y,
            direction: node.direction,
            index: 0,
            path: node.path.clone(),
        }
    }

    fn estimate(&self, node: &MazeNode) -> Self::Cost {
        let dx = self.end.0 - node.x;
        let dy = self.end.1 - node.y;
        let mut cost = dx.abs() + dy.abs();
        if dx != 0 || dy != 0 {
            cost += 1000;
        }
        return cost;
    }

    fn is_goal(&self, node: &MazeNode) -> bool {
        return node.x == self.end.0 && node.y == self.end.1;
    }

    fn on_visit_node(&self, node: &MazeNode, path_cost: Self::Cost) {
        if self.debug {
            println!("Node {:?} (path: {})", node, path_cost);
        }
    }

    fn on_push_edge(&self, _from: &MazeNode, to: &MazeNode, cost: Self::Cost) {
        if self.debug {
            println!("    -> {:?} (cost {})", to, cost);
        }
    }
}

struct MazeNeighbors<'a> {
    maze: &'a Grid<char>,
    from_x: i32,
    from_y: i32,
    direction: Direction,
    index: usize,
    path: PersistentList<(i32, i32, Direction)>,
}

impl<'a> Iterator for MazeNeighbors<'a> {
    type Item = (MazeNode, i32);

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.index {
                0 => {
                    self.index += 1;
                    let (dx, dy) = self.direction.offset();
                    let next = (self.from_x + dx, self.from_y + dy);
                    if let Some('.' | 'S' | 'E') = self.maze.get(next) {
                        let node = MazeNode {
                            x: next.0,
                            y: next.1,
                            direction: self.direction,
                            path: cons((self.from_x, self.from_y, self.direction), self.path.clone())
                        };
                        return Some((node, 1));
                    }
                }
                1 | 2 => {
                    let direction = if self.index == 1 {
                        self.direction.turn_right()
                    } else {
                        self.direction.turn_left()
                    };
                    self.index += 1;
                    let node = MazeNode {
                        x: self.from_x,
                        y: self.from_y,
                        direction,
                        path: cons((self.from_x, self.from_y, self.direction), self.path.clone())
                    };
                    return Some((node, 1000));
                }
                _ => { break; }
            }
        }
        return None;
    }
}