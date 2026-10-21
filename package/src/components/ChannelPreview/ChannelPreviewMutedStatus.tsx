import React from 'react';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { CompositeAccessibilityProbe } from '../Accessibility/CompositeAccessibilityProbe';

/** The muted indicator of a channel preview. */
export const ChannelPreviewMutedStatus = () => {
  const {
    theme: {
      channelPreview: { mutedStatus },
      semantics,
    },
  } = useTheme();
  const { icons } = useComponentsContext();
  const accessibilityLabel = useA11yLabel('channelPreview.muted.accessibilityLabel');

  return (
    <CompositeAccessibilityProbe label={accessibilityLabel}>
      <icons.Mute height={20} fill={semantics.textTertiary} width={20} {...mutedStatus} />
    </CompositeAccessibilityProbe>
  );
};
