'use client';

import { useEffect, useState, useRef } from 'react';

export function useCountUp(end: number, duration = 600, startOnMount = true) {
  const [value, setValue] = useState(startOnMount ? 0 : end);
  const [started, setStarted] = useState(startOnMount);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, started]);

  return { value, start: () => setStarted(true) };
}
