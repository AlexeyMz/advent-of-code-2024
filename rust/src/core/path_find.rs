use priority_queue::PriorityQueue;
use std::collections::HashMap;
use std::ops::Add;
use std::hash::Hash;

pub trait AStarNode: Clone {
    type Key: Eq + Hash + Clone;
    fn key(&self) -> Self::Key;
}

pub trait AStarGraph<N: AStarNode> {
    type Cost: Add<Output = Self::Cost> + Ord + Copy + Default;

    fn start(&self) -> N;
    fn neighbors(&self, node: &N) -> impl Iterator<Item = (N, Self::Cost)> + '_;
    fn estimate(&self, node: &N) -> Self::Cost;
    fn is_goal(&self, node: &N) -> bool;

    fn on_visit_node(&self, _node: &N, _path_cost: Self::Cost) {}
    fn on_push_edge(&self, _from: &N, _to: &N, _cost: Self::Cost) {}
}

pub struct AStar<N: AStarNode, G: AStarGraph<N>> {
    graph: G,
    shortest: HashMap<N::Key, (N, G::Cost)>,
    queue: PriorityQueue<N::Key, PathCost<G::Cost>>,
    found_goal: Option<(N, G::Cost)>,
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
        let mut shortest = HashMap::new();
        let mut queue = PriorityQueue::new();

        let start = graph.start();
        let start_key = start.key();
        shortest.insert(start_key.clone(), (start.clone(), Default::default()));
        queue.push(start_key.clone(), PathCost(graph.estimate(&start)));

        AStar {
            graph,
            shortest,
            queue,
            found_goal: None,
        }
    }

    pub fn found_goal(&self) -> &Option<(N, G::Cost)> {
        &self.found_goal
    }

    pub fn next(&mut self) -> bool {
        if self.found_goal.is_some() {
            return true;
        }

        if let Some((key, _)) = self.queue.pop() {
            let node_item = self.shortest.get(&key).map(|n| n.clone());
            if let Some((node, path_cost)) = node_item {
                self.graph.on_visit_node(&node, path_cost);
                if self.graph.is_goal(&node) {
                    self.found_goal = Some((node.clone(), path_cost));
                    return true;
                }

                for (neighbor, edge_cost) in self.graph.neighbors(&node) {
                    let neighbor_cost = path_cost + edge_cost;
                    let estimated_cost = neighbor_cost + self.graph.estimate(&neighbor);
                    let neighbor_key = neighbor.key();
                    if let Some((_, existing_cost)) = self.shortest.get(&neighbor_key) {
                        if neighbor_cost < *existing_cost {
                            self.graph.on_push_edge(&node, &neighbor, edge_cost);
                            self.queue.change_priority(&neighbor_key, PathCost(estimated_cost));
                            self.shortest.insert(neighbor_key.clone(), (neighbor, neighbor_cost));
                        }
                    } else {
                        self.graph.on_push_edge(&node, &neighbor, edge_cost);
                        self.queue.push(neighbor_key.clone(), PathCost(estimated_cost));
                        self.shortest.insert(neighbor_key.clone(), (neighbor, neighbor_cost));
                    }
                }
                return false;
            }
        }
        return true;
    }
}
