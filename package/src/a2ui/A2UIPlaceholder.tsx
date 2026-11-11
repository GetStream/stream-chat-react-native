import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../ai-components/contexts';
import { Shimmer } from '../ai-components/internal/Shimmer';
import { primitives } from '../ai-components/internal/tokens';

/** What shows while a reply's first surface is being written. */
export const A2UIPlaceholder = () => {
  const {
    theme: { colors },
  } = useTheme();
  return (
    <View accessibilityState={{ busy: true }} testID='a2ui-placeholder'>
      <Shimmer>
        <View style={[styles.placeholder, { backgroundColor: colors.white_smoke }]} />
      </Shimmer>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: { borderRadius: primitives.radiusXl, height: 120 },
});
