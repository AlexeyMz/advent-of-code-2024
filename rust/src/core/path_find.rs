use priority_queue::PriorityQueue;
use std::collections::HashMap;
use std::ops::Add;
use std::hash::Hash;

pub trait AStarNode: Clone {
    type Key: Eq + Hash + Clone;
    fn key(&self) -> Self::Key;
}

pub trait AStarGraph<N: AStarNode> {
    type Edge: Clone;
    type Cost: Add<Output = Self::Cost> + Ord + Copy + Default;

    fn start(&self) -> N;
    fn neighbors(&self, node: &N) -> impl Iterator<Item = (N, Self::Edge, Self::Cost)> + '_;
    fn estimate(&self, node: &N) -> Self::Cost;
    fn is_goal(&self, node: &N) -> bool;

    fn on_visit_node(&self, _node: &N, _path_cost: Self::Cost) {}
    fn on_visit_edge(&self, _from: &N, _to: &N, _cost: Self::Cost) {}
}

pub struct AStar<N: AStarNode, G: AStarGraph<N>> {
    graph: G,
    paths: HashMap<N::Key, AStarPath<N, G>>,
    queue: PriorityQueue<N::Key, PathCost<G::Cost>>,
    found_goal: Option<(N, G::Cost)>,
}

struct AStarPath<N: AStarNode, G: AStarGraph<N>> {
    to: N,
    from: Vec<(N::Key, G::Edge)>,
    cost: G::Cost,
}

#[derive(Eq, PartialEq)]
struct PathCost<T: Ord + Copy>(T);

impl<T: Ord + Copy> Ord for PathCost<T> {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.0.cmp(&other.0).reverse()
    }
}

impl<T: Ord + Copy> PartialOrd for PathCost<T> {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(&other))
    }
}

impl<N: AStarNode, G: AStarGraph<N>> AStar<N, G> {
    pub fn new(graph: G) -> AStar<N, G> {
        let mut paths = HashMap::new();
        let mut queue = PriorityQueue::new();

        let start = graph.start();
        let start_key = start.key();
        paths.insert(start_key.clone(), AStarPath {
            to: start.clone(),
            from: Vec::new(),
            cost: Default::default(),
        });
        queue.push(start_key.clone(), PathCost(graph.estimate(&start)));

        AStar {
            graph,
            paths,
            queue,
            found_goal: None,
        }
    }

    pub fn get_from(&self, to: &N::Key) -> impl Iterator<Item = &(N::Key, G::Edge)> + '_ {
        self.paths.get(to)
            .into_iter()
            .flat_map(|path| path.from.iter())
    }

    pub fn get_cost(&self, to: &N::Key) -> Option<G::Cost> {
        self.paths.get(to).map(|path| path.cost)
    }

    pub fn found_goal(&self) -> &Option<(N, G::Cost)> {
        &self.found_goal
    }

    pub fn next(&mut self) -> bool {
        if self.found_goal.is_some() {
            return true;
        }

        if let Some((key, _)) = self.queue.pop() {
            let path_to: N;
            let path_cost: G::Cost;
            if let Some(path) = self.paths.get(&key) {
                path_to = path.to.clone();
                path_cost = path.cost;
            } else {
                return false;
            }

            self.graph.on_visit_node(&path_to, path_cost);
            if self.graph.is_goal(&path_to) {
                self.found_goal = Some((path_to.clone(), path_cost));
                return true;
            }

            for (neighbor, edge, edge_cost) in self.graph.neighbors(&path_to) {
                let neighbor_cost = path_cost + edge_cost;
                let estimated_cost = neighbor_cost + self.graph.estimate(&neighbor);
                let neighbor_key = neighbor.key();
                if let Some(existing) = self.paths.get_mut(&neighbor_key) {
                    if neighbor_cost < existing.cost {
                        self.graph.on_visit_edge(&path_to, &neighbor, edge_cost);
                        if self.queue.get_priority(&neighbor_key).is_some() {
                            self.queue.change_priority(&neighbor_key, PathCost(estimated_cost));
                        }
                        self.paths.insert(neighbor_key.clone(), AStarPath {
                            to: neighbor,
                            from: vec![(key.clone(), edge.clone())],
                            cost: neighbor_cost,
                        });
                    } else if neighbor_cost == existing.cost {
                        self.graph.on_visit_edge(&path_to, &neighbor, edge_cost);
                        existing.from.push((key.clone(), edge.clone()));
                    }
                } else {
                    self.graph.on_visit_edge(&path_to, &neighbor, edge_cost);
                    self.queue.push(neighbor_key.clone(), PathCost(estimated_cost));
                    self.paths.insert(neighbor_key.clone(), AStarPath {
                        to: neighbor,
                        from: vec![(key.clone(), edge.clone())],
                        cost: neighbor_cost,
                    });
                }
            }
            return false;
        }
        return true;
    }

    pub fn iter_back_path(&self, from: N::Key) -> impl Iterator<Item = (&N, Option<&G::Edge>)> {
        return AStarPathIterator {
            paths: &self.paths,
            current: Some(from),
        };
    }
}

struct AStarPathIterator<'a, N: AStarNode, G: AStarGraph<N>> {
    paths: &'a HashMap<N::Key, AStarPath<N, G>>,
    current: Option<N::Key>,
}

impl<'a, N: AStarNode, G: AStarGraph<N>> Iterator for AStarPathIterator<'a, N, G> {
    type Item = (&'a N, Option<&'a G::Edge>);

    fn next(&mut self) -> Option<Self::Item> {
        if let Some(from) = self.current.take() {
            if let Some(path) = self.paths.get(&from) {
                let first = path.from.first();
                self.current = first.map(|pair| pair.0.clone());
                return Some((&path.to, first.map(|pair| &pair.1)));
            } else {
                self.current = None;
            }
        }
        return None;
    }
}
