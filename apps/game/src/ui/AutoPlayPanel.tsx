import { SIM_SPEEDS } from '@casino/contracts';
import { useClientState, useSendCommand } from './GameContext.tsx';

export function AutoPlayPanel() {
  const { state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!self) return null;
  return (
    <section className="panel">
      <h2>Auto-play</h2>
      <button
        type="button"
        aria-pressed={self.autoPlay}
        onClick={() => send({ type: 'setAutoPlay', enabled: !self.autoPlay })}
      >
        {self.autoPlay ? 'Stop auto-play' : 'Start auto-play'}
      </button>
      <fieldset className="speeds">
        <legend>Speed while auto-playing</legend>
        {SIM_SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            aria-pressed={self.requestedSpeed === speed}
            onClick={() => send({ type: 'setSimSpeed', speed })}
          >
            {speed}x
          </button>
        ))}
      </fieldset>
      <p className="hint">Your character uses the same brain as the bots; the camera follows.</p>
    </section>
  );
}
