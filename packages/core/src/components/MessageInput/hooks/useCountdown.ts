import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

const SECOND_IN_MS = 1000;

/**
 * Start a countdown to a set date, in seconds.
 * The date passed in as an argument to useCountdown
 * will be rounded up to the nearest second.
 **/
export const useCountdown = (endsAt: Date) => {
  const [seconds, setSeconds] = useState<number>(0);

  const counter = useRef<number>();

  const update = () => {
    setSeconds((previous: number) => {
      const next = previous - 1;

      if (next < 1) {
        /* Don't trigger an unnecessary rerender when done */
        clearInterval(counter.current);
        return 0;
      }
      return next;
    });
  };

  /**
   * When a new value is passed with `endsAt`, calculate the
   * amount of seconds for the counter to start at.
   **/
  useEffect(() => {
    const secondsUntilEndsAt = Math.ceil(dayjs(endsAt).diff(dayjs(), 'seconds', true));
    setSeconds(secondsUntilEndsAt);
  }, [endsAt]);

  useEffect(() => {
    const timerId = setInterval(() => {
      update();
    }, SECOND_IN_MS);

    counter.current = timerId as unknown as number;

    return () => {
      clearInterval(counter.current);
    };
  }, []);

  return { seconds };
};
