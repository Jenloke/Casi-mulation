import {
  type ClientMessage,
  type Direction,
  type GridPos,
  type PlayerCommand,
  SIM_SPEEDS,
} from '@casino/contracts';

const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];
const MAX_TEXT_LENGTH = 64;

type Fields = Readonly<Record<string, unknown>>;

/** Parses untrusted client JSON; null unless it is a well-formed command message. */
export function parseClientMessage(raw: string): ClientMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isFields(data) || data.type !== 'command' || !isFields(data.command)) return null;
  const command = parseCommand(data.command);
  return command ? { type: 'command', command } : null;
}

function parseCommand(fields: Fields): PlayerCommand | null {
  switch (fields.type) {
    case 'moveTo':
      return isGridPos(fields.target)
        ? { type: 'moveTo', target: { x: fields.target.x, y: fields.target.y } }
        : null;
    case 'step': {
      const direction = DIRECTIONS.find((candidate) => candidate === fields.direction);
      return direction ? { type: 'step', direction } : null;
    }
    case 'leaveSeat':
      return { type: 'leaveSeat' };
    case 'placeBet':
      return typeof fields.amount === 'number' && isText(fields.option)
        ? { type: 'placeBet', amount: fields.amount, option: fields.option }
        : null;
    case 'roundAction':
      return isText(fields.action) ? { type: 'roundAction', action: fields.action } : null;
    case 'buyItem':
      return isText(fields.itemId) ? { type: 'buyItem', itemId: fields.itemId } : null;
    case 'toggleItem':
      return isText(fields.instanceId)
        ? { type: 'toggleItem', instanceId: fields.instanceId }
        : null;
    case 'setAutoPlay':
      return typeof fields.enabled === 'boolean'
        ? { type: 'setAutoPlay', enabled: fields.enabled }
        : null;
    case 'setSimSpeed': {
      const speed = SIM_SPEEDS.find((candidate) => candidate === fields.speed);
      return speed ? { type: 'setSimSpeed', speed } : null;
    }
    default:
      return null;
  }
}

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
}

function isGridPos(value: unknown): value is GridPos {
  return isFields(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}
