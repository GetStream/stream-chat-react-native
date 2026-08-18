import React from 'react';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CompositeAccessibilityProbe } from '../Accessibility/CompositeAccessibilityProbe';

/**
 * This UI component displays a pinned indicator for a particular channel.
 */
export const ChannelPreviewPinnedStatus = () => {
  const {
    theme: {
      channelPreview: { pinnedStatus },
      semantics,
    },
  } = useTheme();
  const { icons } = useComponentsContext();
  const accessibilityLabel = useA11yLabel('channelPreview.pinned.accessibilityLabel');

  return (
    <CompositeAccessibilityProbe label={accessibilityLabel}>
      <icons.Pin height={20} stroke={semantics.textTertiary} width={20} {...pinnedStatus} />
    </CompositeAccessibilityProbe>
  );
};
