export type CommandResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export const OK: CommandResult = { ok: true };

export function rejected(reason: string): CommandResult {
  return { ok: false, reason };
}
