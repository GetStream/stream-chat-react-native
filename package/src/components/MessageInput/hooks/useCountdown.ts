import { useEffect, useState } from 'react';
import { ONE_SECOND_IN_MS, secondsUntil } from '../../../utils/date';

/**
 * Start a countdown to a set date, in seconds.
 * The date passed in as an argument to useCountdown
 * will be rounded up to the nearest second.
 **/
export const useCountdown = (end: Date) => {
  const [seconds, setSeconds] = useState(0);

  /**
   * When a new `end` is set for the countdown, start the counter if
   * the `end` is in the future.
   **/
  useEffect(() => {
    let intervalId: NodeJS.Timer;

    const startCountdown = (seconds: number) => {
      setSeconds(seconds);
      intervalId = setInterval(() => {
        setSeconds((previous: number) => {
          const next = previous - 1;
          if (next < 1) {
            /* Don't trigger an unnecessary rerender when done */
            clearInterval(intervalId);
            return 0;
          }
          return next;
        });
      }, ONE_SECOND_IN_MS);
    };

    const secondsUntilEnd = secondsUntil(end);
    if (secondsUntilEnd > 0) {
      startCountdown(secondsUntilEnd);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [end]);

  return { seconds };
};
