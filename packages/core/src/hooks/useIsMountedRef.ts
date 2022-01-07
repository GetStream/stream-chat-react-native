import { useEffect, useRef } from 'react';

/**
 * Returns mount status of component. This hook can be used for purpose of avoiding any
 * setState calls (within async operation) after component gets unmounted.
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
 * @returns isMounted {Object} Mount status ref for the component.
 */
export const useIsMountedRef = () => {
  // Initial value has been set to true, since this hook exist only for sole purpose of
  // avoiding any setState calls (within async operation) after component gets unmounted.
  // Basically we don't need to know about state change from component being initialized -> mounted.
  // We only need a state change from initialized or mounted state -> unmounted state.
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  return isMounted;
};
