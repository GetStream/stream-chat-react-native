import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

type CloseSwipeable = () => void;

type SwipeRegistryContextValue = {
  notifyWillOpen: (id: string) => void;
  registerSwipeable: (id: string, close: CloseSwipeable) => () => void;
  closeAll: () => void;
  updateOpenTracker: (id: string, value: boolean) => void;
  hasOpen: () => boolean;
};

const SwipeRegistryContext = createContext<SwipeRegistryContextValue | undefined>(undefined);

export const SwipeRegistryProvider = ({ children }: PropsWithChildren) => {
  const swipeablesRef = useRef<Map<string, CloseSwipeable> | undefined>(undefined);
  const openRef = useRef<Set<string | undefined> | undefined>(undefined);

  const registerSwipeable = useCallback((id: string, close: CloseSwipeable) => {
    if (!swipeablesRef.current) {
      swipeablesRef.current = new Map();
    }

    if (!openRef.current) {
      openRef.current = new Set();
    }

    swipeablesRef.current.set(id, close);

    return () => {
      const registered = swipeablesRef.current?.get(id);
      if (registered === close) {
        swipeablesRef.current?.delete(id);
      }
    };
  }, []);

  const updateOpenTracker = useCallback((id: string, value: boolean) => {
    if (value) {
      openRef.current?.add(id);
      return;
    }
    openRef.current?.delete(id);
  }, []);

  const notifyWillOpen = useCallback(
    (id: string) => {
      for (const [registeredId, close] of swipeablesRef.current?.entries() ?? []) {
        if (registeredId !== id && openRef.current?.has(registeredId)) {
          close();
        }
      }

      updateOpenTracker(id, true);
    },
    [updateOpenTracker],
  );

  const hasOpen = useCallback(() => {
    return !!openRef.current?.size;
  }, []);

  const closeAll = useCallback(() => {
    for (const close of swipeablesRef.current?.values() ?? []) {
      close();
    }
  }, []);

  const value = useMemo(
    () => ({
      notifyWillOpen,
      registerSwipeable,
      closeAll,
      updateOpenTracker,
      hasOpen,
    }),
    [notifyWillOpen, registerSwipeable, closeAll, updateOpenTracker, hasOpen],
  );

  return <SwipeRegistryContext.Provider value={value}>{children}</SwipeRegistryContext.Provider>;
};

export const useSwipeRegistryContext = () => useContext(SwipeRegistryContext);
