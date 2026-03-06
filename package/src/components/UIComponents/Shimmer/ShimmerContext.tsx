import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { SharedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type ShimmerContextValue = {
  progress: SharedValue<number>;
  visibleMessages: SharedValue<string[]>;
};

const ShimmerContext = createContext<ShimmerContextValue>({} as ShimmerContextValue);

const SHIMMER_WIDTH = 150;

type ShimmerProviderProps = PropsWithChildren<{
  visibleMessages: SharedValue<string[]>;
}>;

export const ShimmerProvider = ({ children, visibleMessages }: ShimmerProviderProps) => {
  const progress = useSharedValue(-SHIMMER_WIDTH);

  useEffect(() => {
    progress.value = withRepeat(withTiming(SHIMMER_WIDTH, { duration: 1200 }), -1, true);
  }, [progress]);

  const contextValue = useMemo(() => ({ progress, visibleMessages }), [progress, visibleMessages]);

  return <ShimmerContext.Provider value={contextValue}>{children}</ShimmerContext.Provider>;
};

export const useShimmerContext = () => useContext(ShimmerContext);
