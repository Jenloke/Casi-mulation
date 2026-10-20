import type { DomainEvent } from './DomainEvent.ts';

/** The event log. In memory today; a database adapter implements the same interface later. */
export interface DomainEventStore {
  append(event: DomainEvent): void;
  /** The newest `limit` events, oldest first. */
  recent(limit: number): readonly DomainEvent[];
  /** Events appended since start, including any trimmed from memory. */
  count(): number;
}

/** Keeps at least the newest `capacity` events in memory and trims older ones in batches. */
export class InMemoryDomainEventStore implements DomainEventStore {
  private readonly events: DomainEvent[] = [];
  private readonly capacity: number;
  private total = 0;

  constructor(capacity = 50_000) {
    this.capacity = capacity;
  }

  append(event: DomainEvent): void {
    this.events.push(event);
    this.total++;
    if (this.events.length > this.capacity * 2) {
      this.events.splice(0, this.events.length - this.capacity);
    }
  }

  recent(limit: number): readonly DomainEvent[] {
    return limit > 0 ? this.events.slice(-limit) : [];
  }

  count(): number {
    return this.total;
  }
}
