import React from 'react';
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

type StableDurationLabelProps = {
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  reserveLabel: string;
  style?: StyleProp<TextStyle>;
  visibleStyle?: StyleProp<TextStyle>;
  label: string;
};

/**
 * Renders a duration label with a layout-stable width.
 *
 * It reserves space using an invisible max-width label, then absolutely positions
 * the live value on top so playback updates do not cause parent relayout.
 */
export const StableDurationLabel = React.memo(
  ({
    accessibilityLabel,
    containerStyle,
    reserveLabel,
    style,
    visibleStyle,
    label,
  }: StableDurationLabelProps) => (
    <View style={[styles.container, containerStyle]}>
      <Text accessible={false} style={[style, styles.reserveLabel]}>
        {reserveLabel}
      </Text>
      <Text
        accessibilityLabel={accessibilityLabel}
        style={[style, styles.visibleLabel, visibleStyle]}
      >
        {label}
      </Text>
    </View>
  ),
);

StableDurationLabel.displayName = 'StableDurationLabel';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  reserveLabel: {
    opacity: 0,
  },
  visibleLabel: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
