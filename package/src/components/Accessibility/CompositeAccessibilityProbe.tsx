import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { HiddenA11yText } from './HiddenA11yText';

export type CompositeAccessibilityProbeProps = {
  /**
   * The accessibility label that VoiceOver / TalkBack should announce for the
   * wrapped content. When `undefined`, the probe is a no-op and the children
   * render with no a11y modifications — use this to skip the wrapper when the
   * SDK's a11y opt-in is off.
   */
  label: string | undefined;
};

/**
 * Wraps decorative visual content with a single, cross platform stable
 * accessibility focus stop carrying the provided `label`.
 *
 * iOS auto collapses descendants when a parent View is `accessible`, but on
 * Android `importantForAccessibility='no-hide-descendants'` on the parent
 * gets defeated by deeply nested descendants that set their own
 * `accessible={true}` (our SDK's `<Avatar>` does this). A zero size accessible
 * `<Text>` sidesteps that - Text is always accessible by default on both
 * platforms and carries the label cleanly, while the visual subtree is
 * marked decorative. More importantly, it's discoverable very very easily
 * by screen readers.
 *
 * Use this anywhere you have non-Text visual content (avatars, icons,
 * composed graphics) that should announce as a single semantic unit with a
 * curated label, rather than letting screen readers walk the visual tree
 * verbosely.
 */
export const CompositeAccessibilityProbe = ({
  children,
  label,
}: PropsWithChildren<CompositeAccessibilityProbeProps>) => {
  if (!label) return <>{children}</>;

  return (
    <>
      <HiddenA11yText label={label} />
      <View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
        {children}
      </View>
    </>
  );
};
