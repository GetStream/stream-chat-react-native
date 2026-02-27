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
};

const SwipeRegistryContext = createContext<SwipeRegistryContextValue | undefined>(undefined);

export const SwipeRegistryProvider = ({ children }: PropsWithChildren) => {
  const swipeablesRef = useRef<Map<string, CloseSwipeable> | undefined>(undefined);

  const registerSwipeable = useCallback((id: string, close: CloseSwipeable) => {
    if (!swipeablesRef.current) {
      swipeablesRef.current = new Map();
    }

    swipeablesRef.current.set(id, close);

    return () => {
      const registered = swipeablesRef.current?.get(id);
      if (registered === close) {
        swipeablesRef.current?.delete(id);
      }
    };
  }, []);

  const notifyWillOpen = useCallback((id: string) => {
    for (const [registeredId, close] of swipeablesRef.current?.entries() ?? []) {
      if (registeredId !== id) {
        close();
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      notifyWillOpen,
      registerSwipeable,
    }),
    [notifyWillOpen, registerSwipeable],
  );

  return <SwipeRegistryContext.Provider value={value}>{children}</SwipeRegistryContext.Provider>;
};

export const useSwipeRegistryContext = () => useContext(SwipeRegistryContext);
