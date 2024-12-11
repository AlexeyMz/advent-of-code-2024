export namespace DoubleLinked {
  export interface Node<Self> {
    next?: Self;
    previous?: Self;
  }

  export interface List<S extends Node<S>> {
    first: S | undefined;
    last: S | undefined;
  }

  export function empty<S extends Node<S>>(): List<S> {
    return {
      first: undefined,
      last: undefined,
    };
  }

  export function insertFirst<S extends Node<S>>(list: List<S>, node: S): void {
    if (list.first) {
      const start = list.first;
      node.next = start;
      node.previous = undefined;
      start.previous = node;
      list.first = node;
    } else {
      list.first = node;
      list.last = node;
    }
  }

  export function insertLast<S extends Node<S>>(list: List<S>, node: S): void {
    if (list.last) {
      const end = list.last;
      node.previous = end;
      node.next = undefined;
      end.next = node;
      list.last = node;
    } else {
      list.first = node;
      list.last = node;
    }
  }

  export function remove<S extends Node<S>>(list: List<S>, node: S): void {
    let {previous, next} = node;

    if (previous) {
      previous.next = next;
    } else {
      list.first = next;
    }

    if (next) {
      next.previous = previous;
    } else {
      list.last = previous;
    }

    node.previous = undefined;
    node.next = undefined;
  }

  export function insertAfter<S extends Node<S>>(
    list: List<S>,
    target: S | undefined,
    inserted: S
  ): void {
    if (target) {
      const follower = target.next;
      target.next = inserted;
      inserted.previous = target;
      inserted.next = follower;
      if (follower) {
        follower.previous = inserted;
      } else {
        list.last = inserted;
      }
    } else {
      insertFirst(list, inserted);
    }
  }

  export function* enumerate<S extends Node<S>>(list: List<S>): Iterable<S> {
    let node = list.first;
    while (node) {
      yield node;
      node = node.next;
    }
  }

  export function count<S extends Node<S>>(list: List<S>): number {
    let count = 0;
    let node = list.first;
    while (node) {
      count++;
      node = node.next;
    }
    return count;
  }
}
