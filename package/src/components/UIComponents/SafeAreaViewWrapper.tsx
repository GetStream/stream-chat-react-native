import React, { PropsWithChildren } from 'react';
import { SafeAreaView as RNFSafeAreaView, ViewStyle } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewOriginal,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';

/**
 * `react-native-safe-area-context`'s `SafeAreaView`, keeping React Native's own as a defensive
 * runtime fallback.
 *
 * The type is pinned to the safe-area-context component deliberately. A `A ?? B` expression types as
 * the *union* of both components, which makes the resulting `style` prop their intersection - and
 * from React Native 0.87 that intersection is unsatisfiable, because RN's own `SafeAreaView` and
 * safe-area-context's now describe styles differently. That in turn breaks
 * `Animated.createAnimatedComponent()` wrapping (see `ImageGalleryFooter`). The fallback is only
 * ever hit when safe-area-context is missing at runtime, so pinning the type costs nothing.
 */
export const SafeAreaView = (SafeAreaViewOriginal ??
  RNFSafeAreaView) as typeof SafeAreaViewOriginal;

export const SafeAreaViewWrapper = ({
  children,
  style,
  ...restProps
}: PropsWithChildren<{ style: ViewStyle }> & SafeAreaViewProps) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['bottom', 'top']} style={style} {...restProps}>
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
