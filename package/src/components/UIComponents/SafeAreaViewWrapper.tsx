import React, { PropsWithChildren } from 'react';
import { SafeAreaView as RNFSafeAreaView, ViewStyle } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewOriginal,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';

export const SafeAreaView = SafeAreaViewOriginal ?? RNFSafeAreaView;

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
