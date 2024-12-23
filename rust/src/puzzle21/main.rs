use core::{AStar, AStarGraph, AStarNode, Grid, get_data_path};
use std::{collections::HashMap, fs::read_to_string};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle21_test.txt")).unwrap();
    let codes: Vec<_> = input.lines()
        .filter(|line| !line.is_empty())
        .map(|line| line.chars().collect::<Vec<_>>())
        .collect();

    let numpad_graph = pad_graph(&Grid::from([
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
        [' ', '0', 'A'],
    ]));
    let arrowpad_graph = pad_graph(&Grid::from([
        [' ', '^', 'A'],
        ['<', 'v', '>'],
    ]));

    let mut total_complexity = 0;
    for code in codes {
        let mut total_path: Vec<char> = Vec::new();

        println!("\nEntering code: {}", code.iter().collect::<String>());

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

            let segments = astar
                .iter_back_path(goal.0)
                .collect::<Vec<_>>().into_iter().rev();
            for segment in segments {
                println!("  {} {:?}", segment.1.map(|a| a.to_char()).unwrap_or(' '), segment.0);
            }
            println!("Found goal {:?}:", goal.0);

            previous = goal.clone();
        }

        let code_str = code.iter().collect::<String>();
        println!("{}: {}", code_str, total_path.iter().collect::<String>());

        let length_part: i32 = total_path.len().try_into().unwrap();
        let numeric_part = code_str[..code_str.len() - 1].parse::<i32>().unwrap();
        total_complexity += length_part * numeric_part;
    }

    println!("Total code complexity (basic): {}", total_complexity);
}

type PadGraph = HashMap<char, HashMap<Action, char>>;

fn pad_graph(pad: &Grid<char>) -> PadGraph {
    let actions = [Action::Up, Action::Down, Action::Left, Action::Right];
    let mut graph: PadGraph = HashMap::new();
    for i in 0..pad.width() {
        for j in 0..pad.height() {
            let from = (i, j);
            let from_button = pad.get(from).unwrap();
            let edges: &mut _ = graph.entry(from_button).or_default();
            for action in actions.iter() {
                let to = action.step(from);
                if let Some(to_button) = pad.get(to) {
                    edges.insert(*action, to_button);
                }
            }
        }
    }
    return graph;
}

fn step_pad(pad_graph: &PadGraph, from: char, action: Action) -> Option<char> {
    if let Some(edges) = pad_graph.get(&from) {
        if let Some(&to) = edges.get(&action) {
            return Some(to);
        }
    }
    return None;
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
            return step_pad(&self.arrowpad, *a2, current)
                .map(|to| KeypadNode((*n, *a1, to)));
        }

        if current == Action::Push {
            current = Action::from_char(*a1)?;
        } else {
            return step_pad(&self.arrowpad, *a1, current)
                .map(|to| KeypadNode((*n, to, *a2)));
        }

        if current == Action::Push {
            return None;
        } else {
            return step_pad(&self.numpad, *n, current)
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
