import { useEffect, useRef } from 'react';

/**
 * Returns a ref that turns false once the component unmounts, to skip state updates in async work.
 *
 * @example
 * ```
 * const isMounted = useIsMountedRef();
 * const [dummyValue, setDummyValue] = useState(false);
 *
 * useEffect(() => {
 *  someAsyncOperation().then(() => {
 *    if (isMounted.current) setDummyValue(true);
 *  })
 * })
 * ```
 *
 * @returns A ref whose `current` is true until the component unmounts.
 */
export const useIsMountedRef = () => {
  // Starts true: only the transition to unmounted matters, not the one from initialized to mounted.
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  return isMounted;
};
