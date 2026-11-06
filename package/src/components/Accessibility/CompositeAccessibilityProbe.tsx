import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { HiddenA11yText } from './HiddenA11yText';

export type CompositeAccessibilityProbeProps = {
  /**
   * Label that VoiceOver and TalkBack announce for the wrapped content. `undefined` renders the
   * children unchanged.
   */
  label: string | undefined;
};

/**
 * Gives decorative visual content (avatars, icons, composed graphics) a single screen reader focus
 * stop that announces `label`, and hides the visual subtree from screen readers.
 *
 * The label lives on a visually hidden `<Text>` sibling because on Android a parent's
 * `importantForAccessibility='no-hide-descendants'` is defeated by nested descendants that set
 * `accessible` themselves, such as `<Avatar>`.
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
