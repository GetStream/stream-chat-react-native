import React, { PropsWithChildren } from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

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
