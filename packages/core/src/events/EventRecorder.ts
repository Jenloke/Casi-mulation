import type { PlayerId, PlayerKind } from '@casino/contracts';
import type { Clock } from '../time/Clock.ts';
import type { DomainEvent, DomainEventData } from './DomainEvent.ts';
import type { DomainEventPublisher } from './DomainEventBus.ts';

export interface EventActor {
  readonly id: PlayerId;
  readonly kind: PlayerKind;
}

/** Stamps domain events with the time and the acting player, then publishes them. */
export class EventRecorder {
  private readonly publisher: DomainEventPublisher;
  private readonly clock: Clock;

  constructor(publisher: DomainEventPublisher, clock: Clock) {
    this.publisher = publisher;
    this.clock = clock;
  }

  record(actor: EventActor, data: DomainEventData): void {
    const event: DomainEvent = {
      ...data,
      at: this.clock.now(),
      playerId: actor.id,
      playerKind: actor.kind,
    };
    this.publisher.publish(event);
  }
}
