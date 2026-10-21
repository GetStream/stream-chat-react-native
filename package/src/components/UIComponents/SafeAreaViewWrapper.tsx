import React, { PropsWithChildren } from 'react';
import { SafeAreaView as RNFSafeAreaView, ViewStyle } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewOriginal,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';

/**
 * `react-native-safe-area-context`'s `SafeAreaView`, falling back to React Native's own when it is
 * missing at runtime.
 *
 * The type is pinned to the safe-area-context component: typing `A ?? B` as a union makes the
 * `style` prop an unsatisfiable intersection on recent React Native versions, which breaks
 * `Animated.createAnimatedComponent()` wrapping (see `ImageGalleryFooter`).
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
      <SafeAreaView edges={['bottom', 'left', 'right', 'top']} style={style} {...restProps}>
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};
