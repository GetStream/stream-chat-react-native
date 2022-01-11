import { useState } from 'react';

import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

/**
 * Wrapper around useState that provides a `reset`
 * function to reset the state to its initial value.
 *
 * Will not set state after being unmounted.
 * */
export const useResettableState = <T>(values: T) => {
  const [data, setData] = useState(values);
  const isMounted = useIsMountedRef();

  const reset = () => {
    if (isMounted.current) {
      setData(values);
    }
  };

  return { data, reset, setData };
};
