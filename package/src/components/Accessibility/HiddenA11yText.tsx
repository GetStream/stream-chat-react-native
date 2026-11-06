import React from 'react';
import { StyleSheet, Text } from 'react-native';

export type HiddenA11yTextProps = {
  /**
   * Text added to the accessibility tree. It is rendered as `Text` content so that the parent's
   * label composition on Android includes it. `undefined` (such as the result of `useA11yLabel`
   * while accessibility is disabled) renders nothing.
   */
  label: string | undefined;
};

/**
 * Visually hidden text that adds information, such as "you reacted", to a screen reader
 * announcement. Use it inside a parent that composes its descendants' labels (a `Pressable`, or a
 * `View` with `accessible` and `accessibilityRole`). For one focus stop with a curated label, use
 * `CompositeAccessibilityProbe`.
 */
export const HiddenA11yText = ({ label }: HiddenA11yTextProps) => {
  if (!label) return null;
  // The label is both content and `accessibilityLabel`. Content keeps the Text in the parent's
  // label composition on Android (a label-only Text is focusable and may be skipped); the label
  // keeps testing-library `getByLabelText` queries working.
  return (
    <Text accessibilityLabel={label} style={styles.hidden}>
      {label}
    </Text>
  );
};

const styles = StyleSheet.create({
  hidden: {
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
});
