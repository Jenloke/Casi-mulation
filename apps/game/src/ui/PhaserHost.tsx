import { useEffect, useRef } from 'react';
import { createPhaserGame } from '../phaser/createPhaserGame.ts';
import { useBus } from './GameContext.tsx';

/** Mounts the Phaser canvas; Phaser and React then talk only through the bus. */
export function PhaserHost() {
  const bus = useBus();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const game = createPhaserGame(host.current, bus);
    return () => game.destroy(true);
  }, [bus]);

  return <div ref={host} className="absolute inset-0" data-testid="game-canvas" />;
}
