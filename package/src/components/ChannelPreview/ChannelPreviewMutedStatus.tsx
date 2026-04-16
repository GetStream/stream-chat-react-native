import React from 'react';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mute } from '../../icons';

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelPreviewMutedStatus = () => {
  const {
    theme: {
      channelPreview: { mutedStatus },
      semantics,
    },
  } = useTheme();

  return <Mute height={20} fill={semantics.textTertiary} width={20} {...mutedStatus} />;
};
