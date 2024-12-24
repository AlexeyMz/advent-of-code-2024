use core::{AStar, AStarGraph, AStarNode, Grid, get_data_path};
use std::{collections::HashMap, fs::read_to_string};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle21.txt")).unwrap();
    let codes: Vec<_> = input.lines()
        .filter(|line| !line.is_empty())
        .map(|line| line.chars().collect::<Vec<_>>())
        .collect();

    let numpad_graph = PadGraph::new(&Grid::from([
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
        [' ', '0', 'A'],
    ]));
    let arrowpad_graph = PadGraph::new(&Grid::from([
        [' ', '^', 'A'],
        ['<', 'v', '>'],
    ]));

    let mut total_complexity = 0;
    for code in codes {
        let mut total_path: Vec<char> = Vec::new();

        // println!("\nEntering code: {}", code.iter().collect::<String>());

        let mut previous = KeypadNode(('A', 'A', 'A'));
        for i in 0..code.len() {
            let next = code[i];
            let mut astar = AStar::new(KeypadGraph {
                numpad: &numpad_graph,
                arrowpad: &arrowpad_graph,
                from: previous,
                to: next,
                debug: false,
            });

            loop {
                if astar.next() {
                    break;
                }
            }

            let (goal, _) = astar.found_goal().as_ref().unwrap();
            let path_segment: Vec<char> = astar.iter_back_path(goal.0)
                .flat_map(|p| p.1)
                .map(|action| action.to_char())
                .collect();

            total_path.extend(path_segment.iter().rev());
            total_path.push('A');

            // let segments = astar
            //     .iter_back_path(goal.0)
            //     .collect::<Vec<_>>().into_iter().rev();
            // for segment in segments {
            //     println!("  {} {:?}", segment.1.map(|a| a.to_char()).unwrap_or(' '), segment.0);
            // }
            // println!("Found goal {:?}:", goal.0);

            previous = goal.clone();
        }

        let code_str = code.iter().collect::<String>();
        let path = total_path.iter().collect::<String>();
        println!("{}: {} length = {}", code_str, path, path.len());

        let length_part: i32 = total_path.len().try_into().unwrap();
        let numeric_part = code_str[..code_str.len() - 1].parse::<i32>().unwrap();
        total_complexity += length_part * numeric_part;
    }

    println!("Total code complexity (basic): {}", total_complexity);
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle21.txt")).unwrap();
    let codes: Vec<_> = input.lines()
        .filter(|line| !line.is_empty())
        .map(|line| line.chars().collect::<Vec<_>>())
        .collect();

    let numpad = Keypad::new(Grid::from([
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
        [' ', '0', 'A'],
    ]));
    let arrowpad = Keypad::new(Grid::from([
        [' ', '^', 'A'],
        ['<', 'v', '>'],
    ]));

    let mut sequence = KeypadSequence::new(&numpad, &arrowpad, 25);

    let mut total_complexity = 0;
    for code in codes {
        let mut result = 0;
        let mut previous = 'A';
        for i in 0..code.len() {
            let next = code[i];
            result += sequence.for_input(0, previous, next, 1);
            previous = next;
        }

        let code_str = code.iter().collect::<String>();
        println!("{}: length = {}", code_str, result);

        let numeric_part = code_str[..code_str.len() - 1].parse::<u64>().unwrap();
        total_complexity += result * numeric_part;
    }

    println!("Total code complexity (advanced): {}", total_complexity);
}

struct PadGraph(HashMap<char, HashMap<Action, char>>);

impl PadGraph {
    fn new(pad: &Grid<char>) -> PadGraph {
        let actions = [Action::Up, Action::Down, Action::Left, Action::Right];
        let mut graph: HashMap<char, HashMap<Action, char>> = HashMap::new();
        for i in 0..pad.width() {
            for j in 0..pad.height() {
                let from = (i, j);
                let from_button = pad.get(from).unwrap();
                if from_button == ' ' {
                    continue;
                }
                let edges: &mut _ = graph.entry(from_button).or_default();
                for action in actions.iter() {
                    let to = action.step(from);
                    if let Some(to_button) = pad.get(to) {
                        if to_button != ' ' {
                            edges.insert(*action, to_button);
                        }
                    }
                }
            }
        }
        return PadGraph(graph);
    }

    fn step(&self, from: char, action: Action) -> Option<char> {
        if let Some(edges) = self.0.get(&from) {
            if let Some(&to) = edges.get(&action) {
                return Some(to);
            }
        }
        return None;
    }
}

#[derive(Clone, Debug)]
struct KeypadNode(KeypadState);

type KeypadState = (char, char, char);

struct KeypadGraph<'a> {
    numpad: &'a PadGraph,
    arrowpad: &'a PadGraph,
    from: KeypadNode,
    to: char,
    debug: bool,
}

#[derive(Hash, Eq, PartialEq, Clone, Copy)]
enum Action { Up, Down, Left, Right, Push }

impl Action {
    fn from_char(ch: char) -> Option<Action> {
        match ch {
            '^' => Some(Action::Up),
            'v' => Some(Action::Down),
            '<' => Some(Action::Left),
            '>' => Some(Action::Right),
            'A' => Some(Action::Push),
            _ => None,
        }
    }

    fn to_char(&self) -> char {
        match *self {
            Action::Up => '^',
            Action::Down => 'v',
            Action::Left => '<',
            Action::Right => '>',
            Action::Push => 'A',
        }
    }

    fn step(&self, from: (i32, i32)) -> (i32, i32) {
        match *self {
            Action::Up => (from.0, from.1 - 1),
            Action::Down => (from.0, from.1 + 1),
            Action::Left => (from.0 - 1, from.1),
            Action::Right => (from.0 + 1, from.1),
            Action::Push => from,
        }
    }
}

impl<'a> KeypadGraph<'a> {
    fn step(&self, from: &KeypadNode, action: Action) -> Option<KeypadNode> {
        let KeypadNode((n, a1, a2)) = from;
        let mut current = action;

        if current == Action::Push {
            current = Action::from_char(*a2)?;
        } else {
            return self.arrowpad.step(*a2, current)
                .map(|to| KeypadNode((*n, *a1, to)));
        }

        if current == Action::Push {
            current = Action::from_char(*a1)?;
        } else {
            return self.arrowpad.step(*a1, current)
                .map(|to| KeypadNode((*n, to, *a2)));
        }

        if current == Action::Push {
            return None;
        } else {
            return self.numpad.step(*n, current)
                .map(|to| KeypadNode((to, *a1, *a2)));
        }
    }
}

impl AStarNode for KeypadNode {
    type Key = KeypadState;

    fn key(&self) -> Self::Key {
        return self.0;
    }
}

impl<'a> AStarGraph<KeypadNode> for KeypadGraph<'a> {
    type Edge = Action;
    type Cost = i32;

    fn start(&self) -> KeypadNode {
        return self.from.clone();
    }

    fn is_goal(&self, KeypadNode((a, b, c)): &KeypadNode) -> bool {
        return *a == self.to && *b == 'A' && *c == 'A';
    }

    fn neighbors(&self, node: &KeypadNode) -> impl Iterator<Item = (KeypadNode, Action, Self::Cost)> + '_ {
        let from = node.clone();
        let actions = [
            Action::Left,
            Action::Down,
            Action::Right,
            Action::Up,
            Action::Push,
        ];
        return actions.into_iter()
            .flat_map(move |action| self.step(&from, action)
                .map(|to| (to, action, 1))
            );
    }

    fn estimate(&self, _node: &KeypadNode) -> Self::Cost {
        return 0;
    }

    fn on_visit_node(&self, node: &KeypadNode, path_cost: Self::Cost) {
        if self.debug {
            println!("Node {:?} (path: {})", node, path_cost);
        }
    }

    fn on_visit_edge(&self, _from: &KeypadNode, to: &KeypadNode, cost: Self::Cost) {
        if self.debug {
            println!("    -> {:?} (cost {})", to, cost);
        }
    }
}

struct Keypad {
    moves: HashMap<(char, char), Vec<(char, u64)>>,
}

impl Keypad {
    fn new(pad: Grid<char>) -> Keypad {
        let mut moves = HashMap::new();
        for from_x in 0..pad.width() {
            for from_y in 0..pad.height() {
                for to_x in 0..pad.width() {
                    for to_y in 0..pad.height() {
                        let from = pad.get((from_x, from_y)).unwrap();
                        let to = pad.get((to_x, to_y)).unwrap();
                        moves.insert((from, to), Self::optimal_moves(&pad, from_x, from_y, to_x, to_y)
                            .into_iter().map(|m| (m.0, m.1.try_into().unwrap())).collect()
                        );
                    }
                }
            }
        }
        return Keypad { moves };
    }

    fn optimal_moves(pad: &Grid<char>, from_x: i32, from_y: i32, to_x: i32, to_y: i32) -> Vec<(char, i32)> {
        let mut moves = Vec::new();
        let move_x = if to_x > from_x {('>', to_x - from_x) } else { ('<', from_x - to_x) };
        let move_y = if to_y > from_y { ('v', to_y - from_y) } else { ('^', from_y - to_y) };
        if from_x == to_x {
            moves.push(move_y);
        } else if from_y == to_y {
            moves.push(move_x);
        } else {
            if pad.get((to_x, from_y)).unwrap() == ' ' {
                moves.push(move_y);
                moves.push(move_x);
            } else if pad.get((from_x, to_y)).unwrap() == ' ' {
                moves.push(move_x);
                moves.push(move_y);
            } else if move_x.0 == '<' {
                moves.push(move_x);
                moves.push(move_y);
            } else {
                moves.push(move_y);
                moves.push(move_x);
            }
        }
        return moves;
    }

    fn get_moves(&self, from: char, to: char) -> impl Iterator<Item = &(char, u64)> {
        self.moves.get(&(from, to)).into_iter()
            .flat_map(|v| v.iter())
    }
}

struct KeypadSequence<'a> {
    numpad: &'a Keypad,
    arrowpad: &'a Keypad,
    arrowpad_count: usize,
    memoized_presses: HashMap<(usize, char, char, u64), u64>,
    debug: bool,
}

impl<'a> KeypadSequence<'a> {
    fn new(
        numpad: &'a Keypad,
        arrowpad: &'a Keypad,
        arrowpad_count: usize,
    ) -> KeypadSequence<'a> {
        KeypadSequence {
            numpad,
            arrowpad,
            arrowpad_count,
            memoized_presses: HashMap::new(),
            debug: false,
        }
    }

    fn for_input(&mut self, index: usize, from: char, to: char, count: u64) -> u64 {
        if let Some(&presses) = self.memoized_presses.get(&(index, from, to, count)) {
            return presses;
        } else if self.debug {
            println!("{}[{index:0>2}] {from} ~ {to} ({count})", " ".repeat(index));
        }

        let presses = if count == 0 {
            0
        } else if index > self.arrowpad_count {
            count
        } else {
            let mut presses_to_move = 0;
            let pad = if index == 0 { self.numpad } else { self.arrowpad };
            let mut previous = 'A';
            for &(button, presses) in pad.get_moves(from, to) {
                presses_to_move += self.for_input(index + 1, previous, button, presses);
                previous = button;
            }
            presses_to_move += self.for_input(index + 1, previous, 'A', count);
            presses_to_move
        };

        self.memoized_presses.insert((index, from, to, count), presses);
        return presses;
    }
}
