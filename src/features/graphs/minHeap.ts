/** Small binary min-heap. snapshot() preserves actual array order, not sorted display order. */
export class MinHeap<T> {
  private readonly items: T[] = []
  private readonly compare: (a: T, b: T) => number
  constructor(compare: (a: T, b: T) => number) { this.compare = compare }
  get size() { return this.items.length }
  snapshot(): readonly T[] { return [...this.items] }
  push(item: T): void {
    this.items.push(item)
    let index = this.items.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.compare(this.items[parent], this.items[index]) <= 0) break
      ;[this.items[parent], this.items[index]] = [this.items[index], this.items[parent]]
      index = parent
    }
  }
  pop(): T | undefined {
    if (!this.items.length) return undefined
    const min = this.items[0], last = this.items.pop()!
    if (this.items.length) {
      this.items[0] = last
      let index = 0
      while (true) {
        const left = 2 * index + 1, right = left + 1
        let smallest = index
        if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) smallest = left
        if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) smallest = right
        if (smallest === index) break
        ;[this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]]
        index = smallest
      }
    }
    return min
  }
}
