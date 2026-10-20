import type { GameInfoDto } from '@casino/contracts';
import { type FormEvent, useState } from 'react';

interface BetFormProps {
  readonly game: GameInfoDto;
  readonly disabled: boolean;
  readonly onBet: (amount: number, option: string) => void;
}

/** Generic bet form built from the game's bet options, so new games need no UI code. */
export function BetForm({ game, disabled, onBet }: BetFormProps) {
  const [amount, setAmount] = useState(game.minBet);
  const [optionId, setOptionId] = useState(game.betOptions[0]?.id ?? '');
  const [number, setNumber] = useState(0);
  const option = game.betOptions.find((candidate) => candidate.id === optionId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (option) onBet(amount, option.numberRange ? `${option.id}:${number}` : option.id);
  };

  return (
    <form className="bet-form" onSubmit={submit}>
      <label>
        Stake
        <input
          type="number"
          min={game.minBet}
          max={game.maxBet}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </label>
      {game.betOptions.length > 1 && (
        <fieldset className="options">
          <legend>Bet on</legend>
          {game.betOptions.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === optionId}
              onClick={() => setOptionId(candidate.id)}
            >
              {candidate.label} <small>{candidate.payout}</small>
            </button>
          ))}
        </fieldset>
      )}
      {option?.numberRange && (
        <label>
          Number
          <input
            type="number"
            min={option.numberRange.min}
            max={option.numberRange.max}
            value={number}
            onChange={(event) => setNumber(Number(event.target.value))}
          />
        </label>
      )}
      <button type="submit" className="primary" disabled={disabled || !option}>
        {game.betOptions.length === 1 ? option?.label : 'Place bet'}
      </button>
    </form>
  );
}
