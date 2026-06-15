import React from 'react';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Pin } from '../../icons';
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
  const accessibilityLabel = useA11yLabel('a11y/Pinned');

  return (
    <CompositeAccessibilityProbe label={accessibilityLabel}>
      <Pin height={20} stroke={semantics.textTertiary} width={20} {...pinnedStatus} />
    </CompositeAccessibilityProbe>
  );
};
