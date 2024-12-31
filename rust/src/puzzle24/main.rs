use core::get_data_path;
use std::{collections::{HashMap, HashSet}, fs::{read_to_string, File}, io::{LineWriter, Write}};

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    advanced();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle24.txt")).unwrap();
    let data = WireData::parse(&input).unwrap();

    let mut states= HashMap::new();
    for (&node, &state) in data.initial.iter() {
        states.insert(node, state);
    }

    let mut z_nodes: Vec<_> = data.target_to_wire
        .keys()
        .filter(|n| n.starts_with("z"))
        .collect();
    z_nodes.sort();

    let mut z_result: u64 = 0;
    for z_node in z_nodes.iter().rev() {
        let bit: u64 = data.compute(&mut states, &z_node).into();
        z_result <<= 1;
        z_result |= bit;
    }

    println!("Computed wire result: {}", z_result);
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle24.txt")).unwrap();
    let data = WireData::parse(&input).unwrap();

    // Solve puzzle visually by looking at the graph via
    // https://reactodia.github.io/playground/rdf
    write_wire_graph_turtle(&data).unwrap();
}

#[derive(Copy, Clone)]
enum Operation { AND, OR, XOR }

impl std::fmt::Display for Operation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", match self {
            Operation::AND => "AND",
            Operation::OR => "OR",
            Operation::XOR => "XOR",
        })?;
        return Ok(());
    }
}

struct WireData<'a> {
    initial: HashMap<&'a str, u8>,
    wires: Vec<(&'a str, &'a str, Operation, &'a str)>,
    target_to_wire: HashMap<&'a str, usize>,
}

impl<'a> WireData<'a> {
    fn parse(content: &str) -> Result<WireData, String> {
        let mut parse_initial = true;
        let mut initial = HashMap::new();
        let mut wires = Vec::new();
        let mut target_to_wire: HashMap<&str, usize> = HashMap::new();
        for line in content.lines() {
            if parse_initial {
                if line.is_empty() {
                    parse_initial = false;
                    continue;
                }
                let (source, state) = line.split_once(":")
                    .ok_or(format!("Invalid initial state: {line}"))?;
                let state_bit = state.trim().parse::<u8>()
                    .map_err(|_| format!("Invalid initial state value: {state}"))?;
                initial.insert(source, state_bit);
            } else {
                if line.is_empty() {
                    continue;
                }
                let parts = line.split(' ').collect::<Vec<_>>();
                if parts.len() < 5 || parts[3] != "->" {
                    return Err(format!("Invalid wire: {line}"));
                }
                let operation = Self::parse_operation(parts[1])
                    .ok_or(format!("Invalid wire operation: {line}"))?;
                let index = wires.len();
                wires.push((parts[0], parts[2], operation, parts[4]));
                target_to_wire.insert(parts[4], index);
            }
        }
        return Ok(WireData {
            initial,
            wires,
            target_to_wire,
        });
    }

    fn parse_operation(part: &str) -> Option<Operation> {
        match part {
            "AND" => Some(Operation::AND),
            "OR" => Some(Operation::OR),
            "XOR" => Some(Operation::XOR),
            _ => None,
        }
    }

    fn compute(&self, states: &mut HashMap<&'a str, u8>, node: &str) -> u8 {
        if let Some(&state) = states.get(node) {
            return state;
        } else if let Some(&index) = self.target_to_wire.get(node) {
            let (from1, from2, operation, to) = self.wires[index];
            let from1_state = self.compute(states, from1);
            let from2_state = self.compute(states, from2);
            let result = match operation {
                Operation::AND => from1_state & from2_state,
                Operation::OR => from1_state | from2_state,
                Operation::XOR => from1_state ^ from2_state,
            };
            states.insert(to, result);
            return result;
        } else {
            panic!("No wires go into node {}", node);
        }
    }
}

fn write_wire_graph_turtle(data: &WireData) -> Result<(), String> {
    let mut writer = LineWriter::new(
        File::create(get_data_path("output/puzzle24_graph.ttl"))
            .map_err(|err| format!("Failed to create output Turtle file {err}"))?
    );

    let mut inputs = HashSet::new();
    let mut outputs=  HashSet::new();
    for (from1, from2, _, to) in data.wires.iter() {
        inputs.insert(from1.to_string());
        inputs.insert(from2.to_string());
        outputs.insert(to.to_string());
    }

    for input in inputs {
        writeln!(writer, "<urn:aoc2024:node:{input}> a <urn:aoc2024:Input>.")
            .map_err(|err| format!("Failed to write input node: {err}"))?;
    }

    for output in outputs {
        writeln!(writer, "<urn:aoc2024:node:{output}> a <urn:aoc2024:Output>.")
            .map_err(|err| format!("Failed to write output node: {err}"))?;
    }

    for (from1, from2, operation, to) in data.wires.iter() {
        writeln!(
            writer,
            concat!(
                "<urn:aoc2024:node:{}> <urn:aoc2024:wireIn> [ ",
                "  <urn:aoc2024:wireIn> <urn:aoc2024:node:{}> ; ",
                "  <urn:aoc2024:wireIn> <urn:aoc2024:node:{}> ; ",
                "  a <urn:aoc2024:node:{}>",
                "]."
            ),
            to,
            from1,
            from2,
            operation
        ).map_err(|err| format!("Failed to write edge: {err}"))?;
    }
    return Ok(());
}
