import { Sheet, CellInterface } from "./parser";

export class Dag<T> {
  constructor(private readonly preVisit: (node: T) => Set<T>) {}

  visit(nodes: T[]): Set<T> {
    const nodesToVisit = [...nodes];
    const visited = new Set<T>();
    const stack: T[] = [];
    while (nodesToVisit.length > 0) {
      const current = nodesToVisit[0];

      // if not yet visited, push it onto the stack and perform a previsit
      if (!visited.has(current)) {
        stack.push(current);
        visited.add(current);

        const children = Array.from(this.preVisit(current));
        // previsit should return the children to visit
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (!visited.has(child)) {
            nodesToVisit.unshift(child);
          }
        }

        continue;
      }

      // check if stack exists, otherwise node is likely already via another path
      const stackLen = stack.length;
      if (stackLen > 0) {
        const stackTop = stack[stackLen - 1];
        if (current !== stackTop) {
          // throw new Error(`Invalid stack: [current: ${current}, stackTop: ${stackTop}`);
        }

        nodesToVisit.shift();
        stack.pop();
        continue;
      }

      // The node was already visited, and is not on the stack, so just remove it.
      nodesToVisit.shift();
    }

    return visited;
  }
}

export class Node {
  children: Set<Node> = new Set<Node>();
  constructor(
    readonly address: string,
    readonly sheet: Sheet,
    readonly cell: CellInterface
  ) {}
  add(node: Node) {
    if (this.children.has(node)) return;
    this.children.add(node);
  }
  delete(node: Node) {
    this.children.delete(node);
  }
}

export class DependencyMapping {
  map: Map<string, Node>;
  constructor() {
    this.map = new Map();
  }
  clearAll() {
    this.map = new Map();
  }
  get(address: string, sheet: Sheet, cell: CellInterface) {
    const key = `${sheet}!${address}`;
    if (!this.map.has(key)) {
      this.set(key, new Node(address, sheet, cell));
    }
    return this.map.get(key);
  }
  has(address: string, sheet: Sheet) {
    const key = `${sheet}!${address}`;
    return this.map.get(key);
  }
  set(key: string, node: Node) {
    this.map.set(key, node);
    return this;
  }
}
