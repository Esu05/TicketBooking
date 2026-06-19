import { useState, useEffect, useRef } from 'react';

export function useCountdown(targetDate) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!targetDate) { setSecondsLeft(null); return; }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(targetDate) - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) clearInterval(timerRef.current);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [targetDate]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;
  const expired = secondsLeft === 0;

  return { secondsLeft, minutes, seconds, expired };
}
