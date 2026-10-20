type Listener<T> = (payload: T) => void;

export interface ListenOptions {
  /** Call the listener straight away with the event's latest payload, if there is one. */
  readonly replay?: boolean;
}

/** A small typed publish/subscribe channel that remembers each event's latest payload. */
export class TypedEventBus<Events extends object> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};
  private readonly latest: { [K in keyof Events]?: { readonly payload: Events[K] } } = {};

  /** Returns an unsubscribe function. */
  on<K extends keyof Events>(
    type: K,
    listener: Listener<Events[K]>,
    options: ListenOptions = {},
  ): () => void {
    const listeners = this.listeners[type] ?? new Set<Listener<Events[K]>>();
    this.listeners[type] = listeners;
    listeners.add(listener);
    const last = this.latest[type];
    if (options.replay && last) listener(last.payload);
    return () => {
      listeners.delete(listener);
    };
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.latest[type] = { payload };
    for (const listener of [...(this.listeners[type] ?? [])]) listener(payload);
  }
}
