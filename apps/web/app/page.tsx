'use client';

import { useEffect, useRef, useState } from 'react';

export default function GamePage() {
  const gameRoot = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    import('../game/runtime')
      .then(({ mountGame }) => {
        if (active && gameRoot.current) cleanup = mountGame(gameRoot.current);
      })
      .catch((reason: unknown) => {
        console.error('Tiny Frontier failed to start:', reason);
        if (active) setError('The game could not start. Please refresh the page.');
      });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <main className="tf-page" aria-label="Tiny Frontier game">
      <div ref={gameRoot} className="tf-game-root" />
      {error && <div className="tf-error" role="alert">{error}</div>}
    </main>
  );
}
