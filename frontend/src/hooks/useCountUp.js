import { useEffect, useState } from 'react';
import useReducedMotion from './useReducedMotion';

// Counts from 0 up to `target` over `duration` ms, slowing down at the end.
export default function useCountUp(target, duration = 1600) {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return undefined;
    }
    let frameId;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4); // "ease-out quart": quick, then gentle
      setValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, reducedMotion]);

  return value;
}
