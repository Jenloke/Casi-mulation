interface HeapNode<T> {
  readonly value: T;
  readonly priority: number;
  readonly order: number;
}

/** Binary min-heap. Equal priorities pop in insertion order, which keeps searches deterministic. */
export class MinHeap<T> {
  private readonly nodes: HeapNode<T>[] = [];
  private inserted = 0;

  get size(): number {
    return this.nodes.length;
  }

  push(value: T, priority: number): void {
    this.nodes.push({ value, priority, order: this.inserted++ });
    this.siftUp(this.nodes.length - 1);
  }

  pop(): T | undefined {
    const top = this.nodes[0];
    const last = this.nodes.pop();
    if (top === undefined || last === undefined) return undefined;
    if (this.nodes.length > 0) {
      this.nodes[0] = last;
      this.siftDown(0);
    }
    return top.value;
  }

  private siftUp(start: number): void {
    let index = start;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.less(index, parent)) return;
      this.swap(index, parent);
      index = parent;
    }
  }

  private siftDown(start: number): void {
    let index = start;
    let smallest = this.smallestOfFamily(index);
    while (smallest !== index) {
      this.swap(index, smallest);
      index = smallest;
      smallest = this.smallestOfFamily(index);
    }
  }

  /** Index of the smallest among a node and its two children. */
  private smallestOfFamily(index: number): number {
    let smallest = index;
    for (const child of [2 * index + 1, 2 * index + 2]) {
      if (child < this.nodes.length && this.less(child, smallest)) smallest = child;
    }
    return smallest;
  }

  private less(a: number, b: number): boolean {
    const left = this.nodes[a];
    const right = this.nodes[b];
    if (!left || !right) return false;
    return (
      left.priority < right.priority ||
      (left.priority === right.priority && left.order < right.order)
    );
  }

  private swap(a: number, b: number): void {
    const left = this.nodes[a];
    const right = this.nodes[b];
    if (!left || !right) return;
    this.nodes[a] = right;
    this.nodes[b] = left;
  }
}
