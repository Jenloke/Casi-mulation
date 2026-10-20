import { type PlayerCommand, SIM_SPEEDS } from '@casino/contracts';
import type { Player } from '../players/Player.ts';
import { type CommandResult, OK, rejected } from './CommandResult.ts';
import type { Navigator } from './Navigator.ts';
import type { RoundService } from './RoundService.ts';
import type { ShopService } from './ShopService.ts';

export interface CommandHandlerDeps {
  readonly navigator: Navigator;
  readonly rounds: RoundService;
  readonly shop: ShopService;
  readonly setAutoPlay: (player: Player, enabled: boolean) => CommandResult;
}

/** Routes each player command to the service that owns it. */
export class CommandHandler {
  private readonly deps: CommandHandlerDeps;

  constructor(deps: CommandHandlerDeps) {
    this.deps = deps;
  }

  handle(player: Player, command: PlayerCommand): CommandResult {
    const { navigator, rounds, shop } = this.deps;
    switch (command.type) {
      case 'moveTo':
        return this.whenFree(player, () => navigator.moveTo(player, command.target));
      case 'step':
        return this.whenFree(player, () => navigator.step(player, command.direction));
      case 'leaveSeat':
        return this.whenFree(player, () => navigator.leaveSeat(player));
      case 'placeBet':
        return rounds.placeBet(player, command.amount, command.option);
      case 'roundAction':
        return rounds.act(player, command.action);
      case 'buyItem':
        return shop.buy(player, command.itemId);
      case 'toggleItem':
        return shop.toggle(player, command.instanceId);
      case 'setAutoPlay':
        return this.deps.setAutoPlay(player, command.enabled);
      case 'setSimSpeed':
        return this.setSpeed(player, command.speed);
    }
  }

  /** Nobody walks away from a round that still needs their decision. */
  private whenFree(player: Player, move: () => CommandResult): CommandResult {
    return player.pendingRound ? rejected('Finish the current round first') : move();
  }

  private setSpeed(player: Player, speed: number): CommandResult {
    const supported = SIM_SPEEDS.find((candidate) => candidate === speed);
    if (supported === undefined) return rejected(`Speed must be one of ${SIM_SPEEDS.join(', ')}`);
    player.requestedSpeed = supported;
    return OK;
  }
}
