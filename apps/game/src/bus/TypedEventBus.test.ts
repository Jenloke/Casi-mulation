import { describe, expect, it } from 'vitest';
import { TypedEventBus } from './TypedEventBus.ts';

describe('TypedEventBus', () => {
  it('delivers events until unsubscribed and replays the latest to late listeners', () => {
    const bus = new TypedEventBus<{ ping: number }>();
    const early: number[] = [];
    const unsubscribe = bus.on('ping', (value) => early.push(value));
    bus.emit('ping', 1);
    unsubscribe();
    bus.emit('ping', 2);

    const late: number[] = [];
    bus.on('ping', (value) => late.push(value), { replay: true });
    const withoutReplay: number[] = [];
    bus.on('ping', (value) => withoutReplay.push(value));

    expect(early).toEqual([1]);
    expect(late).toEqual([2]);
    expect(withoutReplay).toEqual([]);
  });
});
