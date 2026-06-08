import React from 'react';
import { StyleSheet, Text } from 'react-native';

export type HiddenA11yTextProps = {
  /**
   * The text to inject into the accessibility tree. Rendered as actual Text
   * content (not as `accessibilityLabel`) so the parent's compose loop on
   * Android picks it up — Text without its own label isn't
   * `isAccessibilityFocusable`, so it gets concatenated into the parent's
   * announcement rather than being skipped as a drill-in target.
   *
   * Pass the result of `useA11yLabel(...)` directly: when SDK a11y is
   * opt-out the value is `undefined` and the component renders nothing.
   */
  label: string | undefined;
};

/**
 * A visually invisible Text that exists only to contribute extra information
 * to a screen reader's announcement. Use it inside a parent that auto-composes
 * descendant labels (Pressable, or any View with `accessible` + `accessibilityRole`)
 * to splice in supplementary state like "you reacted", "and N more", etc.
 *
 * Not for "this whole element should be one focus stop with a curated label" -
 * use `CompositeAccessibilityProbe` for that.
 */
export const HiddenA11yText = ({ label }: HiddenA11yTextProps) => {
  if (!label) return null;
  // Both content and accessibilityLabel are set to the same string. Content
  // keeps the Text on the parent's compose loop (label-only would make it
  // `isAccessibilityFocusable` and potentially skipped on Android — though
  // the opacity:0 hidden style usually saves it). accessibilityLabel keeps
  // testing-library `getByLabelText(...)` queries working.
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
