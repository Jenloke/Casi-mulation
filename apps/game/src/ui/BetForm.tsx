import type { GameInfoDto } from '@casino/contracts';
import { Button } from '@casino/ui/components/button';
import { Field, FieldLabel, FieldLegend, FieldSet } from '@casino/ui/components/field';
import { Input } from '@casino/ui/components/input';
import { type FormEvent, useId, useState } from 'react';

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
  const stakeId = useId();
  const numberId = useId();
  const option = game.betOptions.find((candidate) => candidate.id === optionId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (option) onBet(amount, option.numberRange ? `${option.id}:${number}` : option.id);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={stakeId}>Stake</FieldLabel>
        <Input
          id={stakeId}
          type="number"
          className="w-24 tabular-nums"
          min={game.minBet}
          max={game.maxBet}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </Field>
      {game.betOptions.length > 1 && (
        <FieldSet className="gap-0">
          <FieldLegend variant="label">Bet on</FieldLegend>
          <div className="flex flex-wrap gap-1.5">
            {game.betOptions.map((candidate) => {
              const selected = candidate.id === optionId;
              return (
                <Button
                  key={candidate.id}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => setOptionId(candidate.id)}
                >
                  {candidate.label}
                  <span className="text-xs tabular-nums opacity-70">{candidate.payout}</span>
                </Button>
              );
            })}
          </div>
        </FieldSet>
      )}
      {option?.numberRange && (
        <Field orientation="horizontal">
          <FieldLabel htmlFor={numberId}>Number</FieldLabel>
          <Input
            id={numberId}
            type="number"
            className="w-24 tabular-nums"
            min={option.numberRange.min}
            max={option.numberRange.max}
            value={number}
            onChange={(event) => setNumber(Number(event.target.value))}
          />
        </Field>
      )}
      <Button type="submit" className="w-full" disabled={disabled || !option}>
        {game.betOptions.length === 1 ? option?.label : 'Place bet'}
      </Button>
    </form>
  );
}
