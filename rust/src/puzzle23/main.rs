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
    let input = read_to_string(get_data_path("input/puzzle23.txt")).unwrap();
    let connections = parse_network(&input).unwrap();
    write_network_turtle(&connections).unwrap();

    let mut network = Network::new();
    for (from, to) in connections.iter() {
        network.add_edge(from, to);
    }

    let mut triples = HashSet::new();
    for (a, a_neighbors) in network.edges.iter() {
        if !a.starts_with("t") {
            continue;
        }
        for b in a_neighbors {
            for c in network.edges.get(b).iter().flat_map(|n| n.iter()) {
                if a != c && b != c && a_neighbors.contains(c) {
                    let mut triple = [a, b, c];
                    triple.sort();
                    triples.insert((triple[0], triple[1], triple[2]));
                }
            }
        }
    }

    // for (a, b, c) in triples.iter() {
    //     println!("{a},{b},{c}");
    // }

    println!("Found {} interconnected triples (basic)", triples.len());
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle23.txt")).unwrap();
    let connections = parse_network(&input).unwrap();

    let mut network = Network::new();
    for (from, to) in connections.iter() {
        network.add_edge(from, to);
    }

    let max_clique = network.find_max_clique();
    let mut clique: Vec<_> = max_clique.iter().map(|n| *n).collect();
    clique.sort();

    println!("Found max clique of size {} (advanced): {}", clique.len(), clique.join(","));
}

fn parse_network(input: &str) -> Result<Vec<(&str, &str)>, String> {
    input.lines()
        .filter(|line| !line.is_empty())
        .enumerate()
        .map(|(i, line)| line.split_once('-')
            .ok_or(format!("Invalid connection #{i}: {line}"))
        )
        .collect()
}

fn write_network_turtle(connections: &[(&str, &str)]) -> Result<(), String> {
    let mut writer = LineWriter::new(
        File::create(get_data_path("output/puzzle23_graph.ttl"))
            .map_err(|err| format!("Failed to creater output Turtle file {err}"))?
    );

    let mut nodes = HashSet::new();
    for (from, to) in connections.iter() {
        nodes.insert(from.to_string());
        nodes.insert(to.to_string());
    }

    for node in nodes {
        writeln!(writer, "<urn:aoc2024:node:{node}> a <urn:aoc2024:Computer>.")
            .map_err(|err| format!("Failed to write node: {err}"))?;
    }

    for (from, to) in connections.iter() {
        writeln!(writer, "<urn:aoc2024:node:{from}> <urn:aoc2024:link> <urn:aoc2024:node:{to}>.")
            .map_err(|err| format!("Failed to write edge: {err}"))?;
    }
    return Ok(());
}

struct Network<'a> {
    nodes: HashSet<&'a str>,
    edges: HashMap<&'a str, HashSet<&'a str>>,
}

impl<'a> Network<'a> {
    fn new() -> Network<'a> {
        Network {
            nodes: HashSet::new(),
            edges: HashMap::new(),
        }
    }

    fn add_edge(&mut self, from: &'a str, to: &'a str) {
        self.nodes.insert(from);
        self.nodes.insert(to);
        self.edges.entry(from).or_default().insert(to);
        self.edges.entry(to).or_default().insert(from);
    }

    fn find_max_clique(&self) -> HashSet<&str> {
        let mut node_list: Vec<_> = self.nodes.iter().map(|n| *n).collect();
        node_list.sort();

        let mut max_clique = HashSet::new();

        let mut clique = HashSet::new();
        let mut stack = vec![0];

        while let Some(i) = stack.pop() {
            if i < node_list.len() {
                let node = node_list[i];
                if let Some(neighbors) = self.edges.get(node) {
                    if clique.is_subset(neighbors) {
                        clique.insert(node);
                        if clique.len() > max_clique.len() {
                            max_clique = clique.clone();
                        }

                        stack.push(i);
                        stack.push(i + 1);
                        continue;
                    }
                }
                stack.push(i + 1);
            } else if let Some(previous) = stack.pop() {
                clique.remove(node_list[previous]);
                stack.push(previous + 1);
            }
        }

        return max_clique;
    }
}
