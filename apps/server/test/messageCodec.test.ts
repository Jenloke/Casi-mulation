import { describe, expect, it } from 'vitest';
import { parseClientMessage } from '../src/net/messageCodec.ts';

const wrap = (command: unknown) => JSON.stringify({ type: 'command', command });

describe('parseClientMessage', () => {
  it('accepts well-formed commands', () => {
    expect(parseClientMessage(wrap({ type: 'moveTo', target: { x: 3, y: 4 } }))).toEqual({
      type: 'command',
      command: { type: 'moveTo', target: { x: 3, y: 4 } },
    });
    expect(
      parseClientMessage(wrap({ type: 'placeBet', amount: 10, option: 'red' }))?.command,
    ).toEqual({ type: 'placeBet', amount: 10, option: 'red' });
    expect(parseClientMessage(wrap({ type: 'setSimSpeed', speed: 4 }))?.command).toEqual({
      type: 'setSimSpeed',
      speed: 4,
    });
  });

  it('drops anything malformed', () => {
    const malformed = [
      'not json',
      '{}',
      wrap({ type: 'teleport' }),
      wrap({ type: 'moveTo', target: { x: 'a', y: 1 } }),
      wrap({ type: 'step', direction: 'north' }),
      wrap({ type: 'setSimSpeed', speed: 3 }),
      wrap({ type: 'placeBet', amount: 10, option: 'x'.repeat(200) }),
    ];
    for (const raw of malformed) expect(parseClientMessage(raw), raw).toBeNull();
  });
});
