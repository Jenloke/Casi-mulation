import { SIM_SPEEDS } from '@casino/contracts';
import { Button } from '@casino/ui/components/button';
import { ButtonGroup } from '@casino/ui/components/button-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@casino/ui/components/card';
import { FieldLegend, FieldSet } from '@casino/ui/components/field';
import { BotIcon, SquareIcon } from 'lucide-react';
import { useClientState, useSendCommand } from './GameContext.tsx';

export function AutoPlayPanel() {
  const { state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!self) return null;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <h2>Auto-play</h2>
        </CardTitle>
        <CardDescription>
          Your character uses the same brain as the bots; the camera follows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          variant={self.autoPlay ? 'secondary' : 'default'}
          className="w-full"
          onClick={() => send({ type: 'setAutoPlay', enabled: !self.autoPlay })}
        >
          {self.autoPlay ? <SquareIcon /> : <BotIcon />}
          {self.autoPlay ? 'Stop auto-play' : 'Start auto-play'}
        </Button>
        <FieldSet className="gap-0">
          <FieldLegend variant="label">Speed while auto-playing</FieldLegend>
          <ButtonGroup>
            {SIM_SPEEDS.map((speed) => {
              const selected = self.requestedSpeed === speed;
              return (
                <Button
                  key={speed}
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => send({ type: 'setSimSpeed', speed })}
                >
                  {speed}x
                </Button>
              );
            })}
          </ButtonGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}
