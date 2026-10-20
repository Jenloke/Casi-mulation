import type { DomainEvent } from './DomainEvent.ts';

export type DomainEventListener = (event: DomainEvent) => void;

/** Where the world reports what happened. */
export interface DomainEventPublisher {
  publish(event: DomainEvent): void;
}

/** In-process publish/subscribe for domain events. */
export class DomainEventBus implements DomainEventPublisher {
  private readonly listeners = new Set<DomainEventListener>();

  /** Returns an unsubscribe function. */
  subscribe(listener: DomainEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: DomainEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
