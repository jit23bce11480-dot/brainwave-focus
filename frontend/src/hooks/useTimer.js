import { useEffect, useState } from 'react';

// Counts seconds while `running` is true. Returns [elapsedSeconds, reset].
export default function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1); // functional update: always uses the latest value
    }, 1000);
    return () => clearInterval(id); // cleanup: stop this interval before the next one starts
  }, [running]);

  const reset = () => setElapsed(0);
  return [elapsed, reset];
}
